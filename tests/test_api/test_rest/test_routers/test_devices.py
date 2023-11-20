"""Integration tests for the devices router"""
import json
from datetime import datetime
from itertools import zip_longest
from typing import Any, Dict, List, Union

import pytest
from motor.motor_asyncio import AsyncIOMotorDatabase

from api.dto.Device import DeviceData
from api.dto.Device import DeviceInfo as BasicDeviceConfig
from api.dto.Device import DevicesSimpleInfo as BasicDeviceData
from api.dto.DeviceConfiguration import (
    PrivateBackendConfiguration as PrivateBackendFullDeviceConfig,
)
from api.dto.FilteredDeviceData import FilteredComponent, FilteredDeviceData
from api.dto.NDUV import NDUV as Property
from api.dto.VisualisationType import VisualisationType
from api.utils.configuration_utils import (
    private_backend_config_to_qiskit_format as to_qiskit_config_format,
)
from api.utils.qiskit_utils import device_data_to_qiskit as to_qiskit_device_data
from config import app_config
from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.numbers import is_even
from tests._utils.records import (
    distinct_on,
    get_many_records,
    get_range,
    get_record,
    group_by,
    order_by,
    pop_field,
)
from tests._utils.ws import MockWebsocket

_DATA_COLLECTION = "data"
_CONFIG_COLLECTION = "config"
_BACKENDS_COLLECTION = "backends"
_BACKENDS_LOG_COLLECTION = "backend_log"
_COLLECTIONS = ["backends", "backend_test", "backend_sub"]
_EXCLUDED_FIELDS = ["_id", "_force_refresh"]

_ENDPOINTS_MAP = app_config["ENDPOINTS_URL"]
_ENDPOINT_RESPONSE_MAP = {
    addr: 200 if is_even(i) else 408 for i, addr in enumerate(_ENDPOINTS_MAP.values())
}
_BACKENDS_LIST = load_json_fixture("backend_list.json")
_DEVICE_DATA_LIST = load_json_fixture("device_data_list.json")
_DEVICE_CONFIG_LIST = load_json_fixture("device_config_list.json")
_LDA_PARAMETERS_BODY = load_json_fixture("lda_parameters.json")

_DEVICE_NAMES = list(set([item["backend_name"] for item in _DEVICE_DATA_LIST]))
_ONLINE_STATUS_MAP = {
    backend: is_even(i)
    for i, backend in enumerate(list(_ENDPOINTS_MAP.keys()) + _DEVICE_NAMES)
}
# the device list as seen in database
_DB_DEVICE_DATA_LIST = [
    {**DeviceData.parse_obj(item).dict(), "_force_refresh": False}
    for item in _DEVICE_DATA_LIST
]
# the device list as seen from the API
_API_DEVICE_DATA_LIST = [
    json.loads(DeviceData.parse_obj(item).json()) for item in _DEVICE_DATA_LIST
]
_API_DEVICE_INFO = [
    json.loads(
        BasicDeviceConfig.parse_obj(
            {
                **item,
                "is_online": _ONLINE_STATUS_MAP[item["backend_name"]],
            }
        ).json()
    )
    for item in _DEVICE_DATA_LIST
]
_VISUALIZATION_TYPES = 2 * VisualisationType.values()
_COMPONENT_TYPES = 3 * ["qubits", "gates", "couplers", "resonators"]
_LAST_UPDATE_DATES = sorted(list(set(v["last_update_date"] for v in _DEVICE_DATA_LIST)))
_TIME_RANGES = [
    (_LAST_UPDATE_DATES[0], _LAST_UPDATE_DATES[1]),
    (_LAST_UPDATE_DATES[0], _LAST_UPDATE_DATES[4]),
    (_LAST_UPDATE_DATES[0], _LAST_UPDATE_DATES[8]),
    (_LAST_UPDATE_DATES[2], _LAST_UPDATE_DATES[6]),
    (_LAST_UPDATE_DATES[3], _LAST_UPDATE_DATES[6]),
    (_LAST_UPDATE_DATES[4], _LAST_UPDATE_DATES[8]),
    (_LAST_UPDATE_DATES[4], _LAST_UPDATE_DATES[7]),
    (_LAST_UPDATE_DATES[7], _LAST_UPDATE_DATES[8]),
    (_LAST_UPDATE_DATES[1], _LAST_UPDATE_DATES[5]),
    (_LAST_UPDATE_DATES[5], _LAST_UPDATE_DATES[7]),
]
_COMPONENT_PROP_PAIR_LIST = [
    ("qubits", "qubit_T_phi"),
    ("qubits", "read_err_prep0_meas1_gef"),
    ("qubits", "chi_shift"),
    ("gates", "pulse_freq"),
    ("gates", "pulse_drag"),
    ("gates", "pulse_detune"),
    ("resonators", "frequency_ge"),
    ("resonators", "read_amp"),
    ("resonators", "Q_c"),
    ("couplers", "bias_V"),
    ("couplers", "xtalk_{2,1}"),
    ("couplers", "xtalk_{2,6}"),
]

_BACKENDS_AND_COLLECTIONS_FIXTURE = list(
    zip_longest(_BACKENDS_LIST, _COLLECTIONS, fillvalue="backends")
)


def test_read_backends(db, client):
    """GET to /backends/ retrieves all backends"""
    insert_in_collection(
        database=db, collection_name=_BACKENDS_COLLECTION, data=_BACKENDS_LIST
    )

    response = client.get(f"/backends")
    got = order_by(response.json(), field="name")
    expected = order_by(_BACKENDS_LIST, field="name")

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize("backend_name", [v["name"] for v in _BACKENDS_LIST])
def test_read_backend(db, client, backend_name: str):
    """GET to /backends/{backend_name} returns the backend of the given name"""
    insert_in_collection(
        database=db, collection_name=_BACKENDS_COLLECTION, data=_BACKENDS_LIST
    )

    response = client.get(f"/backends/{backend_name}")
    got = response.json()
    expected = get_record(_BACKENDS_LIST, _filter={"name": backend_name})

    assert response.status_code == 200
    assert expected == got


@pytest.mark.parametrize("backend_name", [v["name"] for v in _BACKENDS_LIST])
def test_read_backend_lda_parameters(db, client, backend_name: str):
    """GET to /backends/{backend_name}/properties/lda_parameters returns the lda_parameters of the backend"""
    insert_in_collection(
        database=db, collection_name=_BACKENDS_COLLECTION, data=_BACKENDS_LIST
    )

    response = client.get(f"/backends/{backend_name}/properties/lda_parameters")
    got = response.json()
    record = get_record(_BACKENDS_LIST, _filter={"name": backend_name})
    try:
        expected = record["properties"]["lda_parameters"]
        expected_status = 200
    except KeyError:
        expected = {"detail": f"backend {backend_name} lacks lda_parameters"}
        expected_status = 404

    assert response.status_code == expected_status
    assert got == expected


@pytest.mark.parametrize("backend_dict", _BACKENDS_LIST)
def test_create_backend(db, client, backend_dict: Dict[str, Any]):
    """PUT to /backends/ creates a new backend if it does not exist already"""
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    response = client.put(
        "/backends/",
        json=backend_dict,
    )
    final_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    timelogs = pop_field(final_data_in_db, "timelog")

    assert response.status_code == 200
    assert response.json() == "OK"

    assert original_data_in_db == []
    assert final_data_in_db == [backend_dict]
    assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("backend_dict", _BACKENDS_LIST)
def test_create_backend_log(db, client, backend_dict: Dict[str, Any]):
    """PUT to /backends/ adds a backend log"""
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_LOG_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    for i in range(3):
        response = client.put(
            "/backends/",
            json=backend_dict,
        )

        assert response.status_code == 200
        assert response.json() == "OK"

    final_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_LOG_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    timelogs = pop_field(final_data_in_db, "timelog")

    assert original_data_in_db == []
    assert final_data_in_db == [backend_dict, backend_dict, backend_dict]
    assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("backend_dict, collection", _BACKENDS_AND_COLLECTIONS_FIXTURE)
def test_create_backend_in_collection(
    db, client, backend_dict: Dict[str, Any], collection: str
):
    """PUT to /backends?collection='some-collection' creates a new backend in 'some-collection' if it not exist"""
    original_data_in_db = find_in_collection(
        db, collection_name=collection, fields_to_exclude=_EXCLUDED_FIELDS
    )

    response = client.put(
        "/backends/",
        json=backend_dict,
        params=dict(collection=collection),
    )
    final_data_in_db = find_in_collection(
        db, collection_name=collection, fields_to_exclude=_EXCLUDED_FIELDS
    )
    timelogs = pop_field(final_data_in_db, "timelog")

    assert response.status_code == 200
    assert response.json() == "OK"

    assert original_data_in_db == []
    assert final_data_in_db == [backend_dict]
    assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("backend_dict, collection", _BACKENDS_AND_COLLECTIONS_FIXTURE)
def test_create_backend_in_collection_log(
    db, client, backend_dict: Dict[str, Any], collection: str
):
    """PUT to /backends?collection='some-collection' adds a backend log"""
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_LOG_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    for i in range(3):
        response = client.put(
            "/backends/",
            json=backend_dict,
            params=dict(collection=collection),
        )

        assert response.status_code == 200
        assert response.json() == "OK"

    final_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_LOG_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    timelogs = pop_field(final_data_in_db, "timelog")

    assert original_data_in_db == []
    assert final_data_in_db == [backend_dict, backend_dict, backend_dict]
    assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("backend_dict", _BACKENDS_LIST)
def test_create_pre_existing_backend(db, client, backend_dict: Dict[str, Any]):
    """PUT to /backends/ a pre-existing backend will do nothing"""
    insert_in_collection(db, collection_name=_BACKENDS_COLLECTION, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    response = client.put(
        "/backends/",
        json=backend_dict,
    )
    final_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    timelogs = pop_field(final_data_in_db, "timelog")

    assert response.status_code == 200
    assert response.json() == "OK"

    assert original_data_in_db == [backend_dict]
    assert final_data_in_db == original_data_in_db
    assert all([is_not_older_than(x["LAST_UPDATED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("backend_dict, collection", _BACKENDS_AND_COLLECTIONS_FIXTURE)
def test_create_pre_existing_backend_collection(
    db, client, backend_dict: Dict[str, Any], collection: str
):
    """PUT to /backends?collection='some-collection' a pre-existing backend will do nothing"""
    insert_in_collection(db, collection_name=collection, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=collection, fields_to_exclude=_EXCLUDED_FIELDS
    )

    response = client.put(
        "/backends/",
        json=backend_dict,
        params=dict(collection=collection),
    )
    final_data_in_db = find_in_collection(
        db, collection_name=collection, fields_to_exclude=_EXCLUDED_FIELDS
    )
    timelogs = pop_field(final_data_in_db, "timelog")

    assert response.status_code == 200
    assert response.json() == "OK"

    assert original_data_in_db == [backend_dict]
    assert final_data_in_db == original_data_in_db
    assert all([is_not_older_than(x["LAST_UPDATED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("backend_dict", _BACKENDS_LIST)
def test_update_backend(db, client, backend_dict: Dict[str, Any]):
    """PUT to /backends/{backend} updates the given backend"""
    insert_in_collection(db, collection_name=_BACKENDS_COLLECTION, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    backend_name = backend_dict["name"]
    payload = {"foo": "bar", "hey": "you"}

    response = client.put(
        f"/backends/{backend_name}",
        json=payload,
    )
    final_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    expected = {
        **original_data_in_db[0],
        **payload,
        "timelog": {**final_data_in_db[0]["timelog"]},
    }

    assert response.status_code == 200
    assert response.json() == "OK"

    assert original_data_in_db == [backend_dict]
    assert final_data_in_db[0] == expected


@pytest.mark.parametrize("backend_dict", _BACKENDS_LIST)
def test_update_lda_parameters(db, client, backend_dict: Dict[str, Any]):
    """PUT to /backends/{backend}/properties/lda_parameters updates the lda parameters of backend"""
    insert_in_collection(db, collection_name=_BACKENDS_COLLECTION, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    backend_name = backend_dict["name"]

    response = client.put(
        f"/backends/{backend_name}/properties/lda_parameters",
        json=_LDA_PARAMETERS_BODY,
    )
    final_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    expected = {
        **original_data_in_db[0],
        "properties": {"lda_parameters": _LDA_PARAMETERS_BODY},
        "timelog": {**final_data_in_db[0]["timelog"]},
    }

    assert response.status_code == 200
    assert response.json() == "OK"

    assert original_data_in_db == [backend_dict]
    assert final_data_in_db[0] == expected


def test_get_all_basic_device_data(db, client, mocker):
    """Get to /devices returns the basic summarized data for all backends. Are online if pings to urls return 200 OK"""
    _mock_online_status_ping(mocker)
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )

    response = client.get(f"/devices")
    got = order_by(response.json(), field="backend_name")
    expected = []

    for item in _DEVICE_DATA_LIST:
        backend_name = item["backend_name"].lower()
        is_online = _ONLINE_STATUS_MAP.get(backend_name, False)
        obj = {**item, "is_online": is_online}
        item_json = BasicDeviceData.parse_obj(obj).json()
        expected.append(json.loads(item_json))

    expected = order_by(expected, field="last_update_date", is_descending=True)
    expected = distinct_on(expected, field="backend_name")
    expected = order_by(expected, field="backend_name")

    assert response.status_code == 200
    assert got == expected


def test_get_all_latest_backend_data(db, client):
    """GET to /devices/all_last_data Gets the static and dynamic properties of all available backends."""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )

    response = client.get(f"/devices/all_last_data")
    got = order_by(response.json(), field="backend_name")
    expected = order_by(
        _API_DEVICE_DATA_LIST, field="last_update_date", is_descending=True
    )
    expected = distinct_on(expected, field="backend_name")
    expected = order_by(expected, field="backend_name")

    assert response.status_code == 200
    assert got == expected


def test_get_all_device_statuses(client, mocker):
    """GET to /devices/online_statuses retrieves the online statuses of all devices.
    Online if pings to their urls return 200 OK"""
    _mock_online_status_ping(mocker)

    response = client.get(f"/devices/online_statuses")
    got = response.json()

    assert response.status_code == 200
    assert got == _ONLINE_STATUS_MAP


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_single_device_info(db, client, mocker, device: str):
    """Get to /devices/{device} retrieves the basic configuration information from the specified backend."""
    _mock_online_status_ping(mocker)
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )

    response = client.get(f"/devices/{device}")
    got = response.json()
    expected = get_record(_API_DEVICE_INFO, {"backend_name": device})
    expected = json.loads(BasicDeviceConfig.parse_obj(expected).json())

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_single_device_data(db, client, device: str):
    """GET to /devices/{device}/data retrieves the static and dynamic properties data of a specified backend."""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )

    response = client.get(f"/devices/{device}/data")
    got = response.json()
    expected = get_record(_API_DEVICE_DATA_LIST, {"backend_name": device})

    assert response.status_code == 200
    assert expected == got


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_single_device_data_forced_refresh(db, client, mocker, device: str):
    """GET to /devices/{device}/data?force-refresh=True retrieves the static and dynamic properties data of a specified
    backend after refreshing its data from BCC"""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )
    expected = {**_API_DEVICE_DATA_LIST[0], "backend_name": device}

    _mock_forced_refresh(mocker, db=db, fresh_data=expected)

    response = client.get(f"/devices/{device}/data?force_refresh=True")
    got = response.json()

    assert response.status_code == 200
    assert expected == got


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_qiskit_device_data(db, client, device: str):
    """GET to /devices/{device}/data/qiskit returns the stored data from the specified device in Qiskit format."""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )

    response = client.get(f"/devices/{device}/data/qiskit")
    got = response.json()
    expected_dict = get_record(_DEVICE_DATA_LIST, {"backend_name": device})
    expected = to_qiskit_device_data(DeviceData.parse_obj(expected_dict))
    expected = json.loads(expected.json())

    assert response.status_code == 200
    assert expected == got


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_qiskit_device_data_forced_refresh(db, client, mocker, device: str):
    """GET to /devices/{device}/data/qiskit?forced-refresh=True returns the stored data from the specified device
    in Qiskit format after refreshing from BCC"""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )
    expected_dict = {**_DEVICE_DATA_LIST[0], "backend_name": device}

    _mock_forced_refresh(mocker, db=db, fresh_data=expected_dict)

    response = client.get(f"/devices/{device}/data/qiskit?force_refresh=True")
    got = response.json()
    expected = to_qiskit_device_data(DeviceData.parse_obj(expected_dict))
    expected = json.loads(expected.json())

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_CONFIG_LIST])
def test_get_config(db, client, device: str):
    """GET to /devices/{device}/config returns the configuration file of the specified backend."""
    insert_in_collection(
        database=db, collection_name=_CONFIG_COLLECTION, data=_DEVICE_CONFIG_LIST
    )

    response = client.get(f"/devices/{device}/config")
    got = response.json()
    reversed_device_configs = order_by(
        _DEVICE_CONFIG_LIST, "backend_version", is_descending=True
    )
    expected_dict = get_record(
        reversed_device_configs,
        {"backend_name": device},
    )
    expected_model = PrivateBackendFullDeviceConfig.parse_obj(expected_dict)
    expected = json.loads(expected_model.json())

    assert response.status_code == 200
    assert expected == got


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_CONFIG_LIST])
def test_get_qiskit_config(db, client, device: str):
    """GET to /devices/{device}/config/qiskit returns the config file of the specified backend in Qiskit format."""
    insert_in_collection(
        database=db, collection_name=_CONFIG_COLLECTION, data=_DEVICE_CONFIG_LIST
    )

    response = client.get(f"/devices/{device}/config/qiskit")
    got = response.json()
    device_configs = order_by(
        _DEVICE_CONFIG_LIST, "backend_version", is_descending=True
    )
    expected_dict = get_record(device_configs, _filter={"backend_name": device})
    expected_model = to_qiskit_config_format(
        PrivateBackendFullDeviceConfig.parse_obj(expected_dict)
    )
    expected = json.loads(expected_model.json())

    assert response.status_code == 200
    assert expected == got


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_device_online_since_date(db, client, device: str):
    """GET to /devices/{device}/online_since retrieves datetime from which the backend has been online."""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )

    response = client.get(f"/devices/{device}/online_since")
    got = response.json()
    expected_device = get_record(_DB_DEVICE_DATA_LIST, {"backend_name": device})
    online_date: datetime = expected_device["online_date"]
    expected = online_date.isoformat()

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_device_offline_since_date(db, client, mocker, device: str):
    """GET to /devices/{device}/offline_since retrieves the datetime when the backend was last seen if offline
    or else returns 400 HTTP status."""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DEVICE_DATA_LIST
    )
    _mock_online_status_ping(mocker)
    is_online = _ONLINE_STATUS_MAP.get(device, False)

    response = client.get(f"/devices/{device}/offline_since")
    got = response.json()

    if is_online:
        assert response.status_code == 400
        assert got == {"detail": f"Backend is online"}

    else:
        expected_devices = get_many_records(
            _API_DEVICE_DATA_LIST, {"backend_name": device}
        )
        expected_device = order_by(
            expected_devices, field="last_update_date", is_descending=True
        )[0]
        last_update_date = expected_device["last_update_date"]
        expected = last_update_date.replace("Z", "+00:00")

        expected = datetime.fromisoformat(expected)
        got = datetime.fromisoformat(got)

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("device", [v["backend_name"] for v in _DEVICE_DATA_LIST])
def test_get_device_status(client, mocker, device: str):
    """GET to /devices/{device}/online_status returns endpoint online status."""
    _mock_online_status_ping(mocker)
    expected = _ONLINE_STATUS_MAP.get(device, False)

    response = client.get(f"/devices/{device}/online_status")
    got = response.json()

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize(
    "device, _type, _from, to",
    [
        (v["backend_name"], _type, start, stop)
        for v, _type, (start, stop) in zip(
            _DEVICE_DATA_LIST, _VISUALIZATION_TYPES, _TIME_RANGES
        )
    ],
)
def test_get_properties_by_type_and_period(
    db,
    client,
    device: str,
    _type: str,
    _from: str,
    to: Union[str, None],
):
    """GET to /devices/{device}/{_type}/period returns all recorded values of all properties of a specified type
    over a range of time.
    """
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DB_DEVICE_DATA_LIST
    )

    device_data_list = get_many_records(_DB_DEVICE_DATA_LIST, {"backend_name": device})
    _from_datetime = datetime.fromisoformat(_from.replace("Z", "+00:00"))
    _to_datetime = datetime.fromisoformat(to.replace("Z", "+00:00"))
    expected_snapshots = get_range(
        device_data_list,
        field="last_update_date",
        from_=_from_datetime,
        to=_to_datetime,
    )
    expected_snapshots = order_by(expected_snapshots, field="last_update_date")
    qubits = []
    gates = []
    resonators = []
    couplers = []

    # filter for given type
    for snapshot in expected_snapshots:
        qubits += _get_props_with_type(snapshot["qubits"], viz_type=_type)
        gates += _get_props_with_type(snapshot["gates"], viz_type=_type)
        resonators += _get_props_with_type(snapshot["resonators"], viz_type=_type)
        couplers += _get_props_with_type(snapshot["couplers"], viz_type=_type)

    # then group by name and id
    _unique_keys = ("id", "name")
    filtered_qubits = group_by(qubits, _unique_keys)
    filtered_gates = group_by(gates, _unique_keys)
    filtered_resonators = group_by(resonators, _unique_keys)
    filtered_couplers = group_by(couplers, _unique_keys)

    # then flatten and remove duplicates in each group. Duplicates are those with the same date
    # then return the groups with each group having two keys; one id, the other the name of the group.
    flattened_qubits = _flatten_to_filtered_components(filtered_qubits)
    flattened_gates = _flatten_to_filtered_components(filtered_gates)
    flattened_resonators = _flatten_to_filtered_components(filtered_resonators)
    flattened_couplers = _flatten_to_filtered_components(filtered_couplers)

    expected_json = FilteredDeviceData(
        qubits=flattened_qubits,
        gates=flattened_gates,
        resonators=flattened_resonators,
        couplers=flattened_couplers,
    ).json()
    expected = json.loads(expected_json)

    response = client.get(f"/devices/{device}/{_type}/period?from={_from}&to={to}")
    got = response.json()

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize(
    "device, _from, to",
    [
        (v["backend_name"], start, stop)
        for v, (start, stop) in zip(_DEVICE_DATA_LIST, _TIME_RANGES)
    ],
)
def test_get_backend_over_time(
    db,
    client,
    device: str,
    _from: str,
    to: Union[str, None],
):
    """GET to /devices/{device}/period returns all recorded snapshots of a given backend over a range of time"""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DB_DEVICE_DATA_LIST
    )

    device_data_list = get_many_records(_API_DEVICE_DATA_LIST, {"backend_name": device})
    expected = get_range(
        device_data_list,
        field="last_update_date",
        from_=_from,
        to=to,
    )
    expected = order_by(expected, field="last_update_date")

    response = client.get(f"/devices/{device}/period?from={_from}&to={to}")
    got = response.json()

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize(
    "device, _type",
    [
        (v["backend_name"], _type)
        for v, _type in zip(_DEVICE_DATA_LIST, _VISUALIZATION_TYPES)
    ],
)
def test_get_properties_by_type(db, client, device: str, _type: str):
    """
    GET to /devices/{device}/{_type} returns the properties of the specified backend's latest snapshot with the given
    type.
    """
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DB_DEVICE_DATA_LIST
    )

    device_data_list = get_many_records(_DB_DEVICE_DATA_LIST, {"backend_name": device})
    expected_snapshot = order_by(
        device_data_list, field="last_update_date", is_descending=True
    )[0]

    # filter for given type
    qubits = _get_props_with_type(expected_snapshot["qubits"], viz_type=_type)
    gates = _get_props_with_type(expected_snapshot["gates"], viz_type=_type)
    resonators = _get_props_with_type(expected_snapshot["resonators"], viz_type=_type)
    couplers = _get_props_with_type(expected_snapshot["couplers"], viz_type=_type)

    # then group by name and id
    _unique_keys = ("id", "name")
    filtered_qubits = group_by(qubits, _unique_keys)
    filtered_gates = group_by(gates, _unique_keys)
    filtered_resonators = group_by(resonators, _unique_keys)
    filtered_couplers = group_by(couplers, _unique_keys)

    # then flatten and remove duplicates in each group. Duplicates are those with the same date
    # then return the groups with each group having two keys; one id, the other the name of the group.
    flattened_qubits = _flatten_to_filtered_components(filtered_qubits)
    flattened_gates = _flatten_to_filtered_components(filtered_gates)
    flattened_resonators = _flatten_to_filtered_components(filtered_resonators)
    flattened_couplers = _flatten_to_filtered_components(filtered_couplers)

    expected_json = FilteredDeviceData(
        qubits=flattened_qubits,
        gates=flattened_gates,
        resonators=flattened_resonators,
        couplers=flattened_couplers,
    ).json()
    expected = json.loads(expected_json)

    response = client.get(f"/devices/{device}/{_type}")
    got = response.json()

    assert response.status_code == 200
    assert got == expected


@pytest.mark.parametrize(
    "device, components, _property, _from, to",
    [
        (v["backend_name"], component, _property, start, stop)
        for v, (component, _property), (start, stop) in zip(
            _DEVICE_DATA_LIST, _COMPONENT_PROP_PAIR_LIST, _TIME_RANGES
        )
    ],
)
def test_get_property_over_time(
    db,
    client,
    device: str,
    components: str,
    _property: str,
    _from: str,
    to: Union[str, None],
):
    """GET to /devices/{device}/{components}/{_property}/period?from={}&to={} returns the given property over time"""
    insert_in_collection(
        database=db, collection_name=_DATA_COLLECTION, data=_DB_DEVICE_DATA_LIST
    )

    device_data_list = get_many_records(_DB_DEVICE_DATA_LIST, {"backend_name": device})
    _from_datetime = datetime.fromisoformat(_from.replace("Z", "+00:00"))
    _to_datetime = datetime.fromisoformat(to.replace("Z", "+00:00"))
    expected_snapshots = get_range(
        device_data_list,
        field="last_update_date",
        from_=_from_datetime,
        to=_to_datetime,
    )
    expected_snapshots = order_by(expected_snapshots, field="last_update_date")
    all_props = []

    # filter properties by component and name
    for snapshot in expected_snapshots:
        all_props += _get_props_with_name(snapshot[components], name=_property)

    # then group by name and id
    _unique_keys = ("id", "name")
    filtered_props = group_by(all_props, _unique_keys)

    # then flatten and remove duplicates in each group. Duplicates are those with the same date
    # then return the groups with each group having two keys; one id, the other the name of the group.
    flattened_props = _flatten_to_filtered_components(filtered_props)

    expected = [
        json.loads(FilteredComponent.parse_obj(item).json()) for item in flattened_props
    ]

    response = client.get(
        f"/devices/{device}/{components}/{_property}/period?from={_from}&to={to}"
    )
    got = response.json()

    assert response.status_code == 200
    assert got == expected


def _mock_online_status_ping(mocker):
    """Mocks the online-status HTTP ping for all backends

    Args:
        mocker: the pytest-mock mocker object
    """
    mocker.patch(
        "websockets.client.connect",
        return_value=MockWebsocket(result_map=_ONLINE_STATUS_MAP, default=False),
    )


def _mock_forced_refresh(mocker, db: AsyncIOMotorDatabase, fresh_data: Dict[str, Any]):
    """Mocks the online-status HTTP ping for all backends

    Args:
        mocker: the pytest-mock mocker object
        db: the database to insert the fresh_data
        fresh_data: the value to push in the database on forced refresh
    """

    def side_effect(*args, **kwargs):
        insert_in_collection(db, "data", data=[fresh_data])
        return MockWebsocket(result_map={}, default="OK")

    mocker.patch("websockets.client.connect", side_effect=side_effect)


def _get_props_with_type(
    components: List[Dict[str, Any]], viz_type: str
) -> List[Dict[str, Any]]:
    """extracts the all properties (dynamic and static) that have a given visualisation type from a list of components

    Args:
        components: the list of components as dicts
        viz_type: the VisualisationType

    Returns:
        a list of Dicts that represent FilteredComponents for the given visualisation type
    """
    return [
        {**prop, "id": component["id"]}
        for component in components
        for prop in component["dynamic_properties"] + component["static_properties"]
        if viz_type in prop["types"]
    ]


def _get_props_with_name(
    components: List[Dict[str, Any]], name: str
) -> List[Dict[str, Any]]:
    """extracts the all properties (dynamic and static) that have a given name type from a list of components

    Args:
        components: the list of components as dicts
        name: the name of the property

    Returns:
        a list of Dicts that represent FilteredComponents for the given name
    """
    return [
        {**prop, "id": component["id"]}
        for component in components
        for prop in component["dynamic_properties"] + component["static_properties"]
        if prop["name"] == name
    ]


def _flatten_to_filtered_components(
    data: Dict[str, Any]
) -> List[Dict[str, Union[List[Property], int]]]:
    """Flattens the dict to dictionaries that resemble FilteredComponent objects

    Args:
        data: the list to be flattened

    Returns:
        the flattened list
    """
    result = []
    for _id, item_map in data.items():
        item: Dict[str, Union[List[Property], int]] = {"id": _id}
        for k, v in item_map.items():
            item[k] = [Property.parse_obj(obj) for obj in distinct_on(v, "date")]

        result.append(item)

    return result

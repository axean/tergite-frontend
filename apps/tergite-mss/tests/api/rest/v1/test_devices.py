# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2023, 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Integration tests for the devices router"""
from itertools import zip_longest
from typing import Any, Dict

import pytest

from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import get_record, order_by, pop_field

_DATA_COLLECTION = "data"
_CONFIG_COLLECTION = "config"
_BACKENDS_COLLECTION = "backends"
_BACKENDS_LOG_COLLECTION = "backend_log"
_COLLECTIONS = ["backends", "backend_test", "backend_sub"]
_EXCLUDED_FIELDS = ["_id", "_force_refresh"]


_BACKENDS_LIST = load_json_fixture("backend_list.json")
_DEVICE_DATA_LIST = load_json_fixture("device_data_list.json")
_DEVICE_CONFIG_LIST = load_json_fixture("device_config_list.json")

_DEVICE_NAMES = list(set([item["backend_name"] for item in _DEVICE_DATA_LIST]))


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


def test_read_backends(db, client, app_token_header):
    """GET to /backends/ retrieves all backends"""
    insert_in_collection(
        database=db, collection_name=_BACKENDS_COLLECTION, data=_BACKENDS_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/backends", headers=app_token_header)
        got = order_by(response.json(), field="name")
        expected = order_by(_BACKENDS_LIST, field="name")

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("backend_name", [v["name"] for v in _BACKENDS_LIST])
def test_read_backend(db, client, backend_name: str, app_token_header):
    """GET to /backends/{backend_name} returns the backend of the given name"""
    insert_in_collection(
        database=db, collection_name=_BACKENDS_COLLECTION, data=_BACKENDS_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/backends/{backend_name}", headers=app_token_header)
        got = response.json()
        expected = get_record(_BACKENDS_LIST, _filter={"name": backend_name})

        assert response.status_code == 200
        assert expected == got


@pytest.mark.parametrize("backend_dict", _BACKENDS_LIST)
def test_create_backend(
    db, client, backend_dict: Dict[str, Any], system_app_token_header
):
    """PUT to /backends/ creates a new backend if it does not exist already"""
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            "/backends/",
            json=backend_dict,
            headers=system_app_token_header,
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


@pytest.mark.parametrize("backend_dict, collection", _BACKENDS_AND_COLLECTIONS_FIXTURE)
def test_create_backend_in_collection(
    db, client, backend_dict: Dict[str, Any], collection: str, system_app_token_header
):
    """PUT to /backends?collection='some-collection' creates a new backend in 'some-collection' if it not exist"""
    original_data_in_db = find_in_collection(
        db, collection_name=collection, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            "/backends",
            json=backend_dict,
            params=dict(collection=collection),
            headers=system_app_token_header,
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


@pytest.mark.parametrize("backend_dict", _BACKENDS_LIST)
def test_create_pre_existing_backend(
    db, client, backend_dict: Dict[str, Any], system_app_token_header
):
    """PUT to /backends a pre-existing backend will do nothing"""
    insert_in_collection(db, collection_name=_BACKENDS_COLLECTION, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            "/backends",
            json=backend_dict,
            headers=system_app_token_header,
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
    db, client, backend_dict: Dict[str, Any], collection: str, system_app_token_header
):
    """PUT to /backends?collection='some-collection' a pre-existing backend will do nothing"""
    insert_in_collection(db, collection_name=collection, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=collection, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            "/backends",
            json=backend_dict,
            params=dict(collection=collection),
            headers=system_app_token_header,
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
def test_update_backend(
    db, client, backend_dict: Dict[str, Any], system_app_token_header
):
    """PUT to /backends/{backend} updates the given backend"""
    insert_in_collection(db, collection_name=_BACKENDS_COLLECTION, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=_BACKENDS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    backend_name = backend_dict["name"]
    payload = {"foo": "bar", "hey": "you"}

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            f"/backends/{backend_name}",
            json=payload,
            headers=system_app_token_header,
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

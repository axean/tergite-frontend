"""Integration tests for the devices v2 router"""
import json
from datetime import datetime
from itertools import zip_longest
from typing import Any, Dict, List, Union

import pytest
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.device_info.config import app_config
from services.device_info.dtos import (
    BasicDeviceConfig,
    BasicDeviceData,
    DeviceData,
    FilteredComponent,
    FilteredDeviceData,
    PrivateBackendFullDeviceConfig,
    Property,
    VisualisationType,
)
from services.device_info.utils.configs import to_qiskit_config_format
from services.device_info.utils.qiskit import to_qiskit_device_data
from tests._utils.aiohttp import MockAiohttpClient
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

_DEVICES_COLLECTION = "devices"
_EXCLUDED_FIELDS = ["_id"]

_DEVICE_LIST = load_json_fixture("device_list.json")


def test_read_devices(db, client, user_jwt_cookie):
    """GET to /v2/devices retrieves all devices"""
    insert_in_collection(
        database=db, collection_name=_DEVICES_COLLECTION, data=_DEVICE_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/v2/devices", cookies=user_jwt_cookie)
        got = order_by(response.json(), field="name")
        expected = order_by(_DEVICE_LIST, field="name")

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("name", [v["name"] for v in _DEVICE_LIST])
def test_read_one_device(db, client, name: str, user_jwt_cookie):
    """GET to /devices/{name} returns the device of the given name"""
    insert_in_collection(
        database=db, collection_name=_DEVICES_COLLECTION, data=_DEVICE_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/v2/devices/{name}", cookies=user_jwt_cookie)
        got = response.json()
        expected = get_record(_DEVICE_LIST, _filter={"name": name})

        assert response.status_code == 200
        assert expected == got


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_create_device(db, client, payload: Dict[str, Any], system_app_token_header):
    """PUT to /v2/devices/ creates a new device if it does not exist already"""
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            "/v2/devices/",
            json=payload,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        timelogs = pop_field(final_data_in_db, "timelog")

        assert response.status_code == 200
        assert response.json() == "OK"

        assert original_data_in_db == []
        assert final_data_in_db == [payload]
        assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_create_device_non_system_user(
    db, client, payload: Dict[str, Any], user_jwt_cookie
):
    """Only system users can PUT to /v2/devices/"""
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            "/v2/devices/",
            json=payload,
            cookies=user_jwt_cookie,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )

        assert response.status_code == 403
        assert response.json() == {"details": "forbidden"}

        assert original_data_in_db == []
        assert final_data_in_db == []


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_create_pre_existing_device(
    db, client, payload: Dict[str, Any], system_app_token_header
):
    """PUT to /v2/devices a pre-existing device will do nothing"""
    insert_in_collection(db, collection_name=_DEVICES_COLLECTION, data=[payload])
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            "/v2/devices",
            json=payload,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        timelogs = pop_field(final_data_in_db, "timelog")

        assert response.status_code == 200
        assert response.json() == "OK"

        assert original_data_in_db == [payload]
        assert final_data_in_db == original_data_in_db
        assert all([is_not_older_than(x["LAST_UPDATED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_update_device(db, client, payload: Dict[str, Any], system_app_token_header):
    """PUT to /v2/devices/{name} updates the given device"""
    insert_in_collection(db, collection_name=_DEVICES_COLLECTION, data=[payload])
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    backend_name = payload["name"]
    payload = {"foo": "bar", "hey": "you"}

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            f"/v2/devices/{backend_name}",
            json=payload,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        expected = {
            **original_data_in_db[0],
            **payload,
            "timelog": {**final_data_in_db[0]["timelog"]},
        }

        assert response.status_code == 200
        assert response.json() == "OK"

        assert original_data_in_db == [payload]
        assert final_data_in_db[0] == expected


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_update_device_non_system_user(
    db, client, payload: Dict[str, Any], user_jwt_cookie
):
    """Only system users can PUT to /v2/devices/{name}"""
    insert_in_collection(db, collection_name=_DEVICES_COLLECTION, data=[payload])
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    backend_name = payload["name"]
    payload = {"foo": "bar", "hey": "you"}

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            f"/v2/devices/{backend_name}",
            json=payload,
            cookies=user_jwt_cookie,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )

        assert response.status_code == 403
        assert response.json() == {"details": "forbidden"}

        assert original_data_in_db == [payload]
        assert final_data_in_db[0] == [payload]

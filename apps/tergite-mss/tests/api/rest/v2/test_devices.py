# This code is part of Tergite
#
# (C) Copyright Chalmers Next Labs 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Integration tests for the devices v2 router"""
from typing import Any, Dict

import pytest

from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import get_record, order_by, pop_field

_DEVICES_COLLECTION = "devices"
_EXCLUDED_FIELDS = ["_id"]

_DEVICE_LIST = load_json_fixture("device_list.json")


def test_read_devices(db, client_v2, user_jwt_cookie):
    """GET to /v2/devices retrieves all devices"""
    insert_in_collection(
        database=db, collection_name=_DEVICES_COLLECTION, data=_DEVICE_LIST
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get(f"/v2/devices", cookies=user_jwt_cookie)
        got = order_by(response.json(), field="name")
        pop_field(got, field="id")
        expected = order_by(_DEVICE_LIST, field="name")

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("name", [v["name"] for v in _DEVICE_LIST])
def test_read_one_device(db, client_v2, name: str, user_jwt_cookie):
    """GET to /devices/{name} returns the device of the given name"""
    insert_in_collection(
        database=db, collection_name=_DEVICES_COLLECTION, data=_DEVICE_LIST
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get(f"/v2/devices/{name}", cookies=user_jwt_cookie)
        got: dict = response.json()
        got.pop("id")
        expected = get_record(_DEVICE_LIST, _filter={"name": name})

        assert response.status_code == 200
        assert expected == got


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_create_device(db, client_v2, payload: Dict[str, Any], system_app_token_header):
    """PUT to /v2/devices/ creates a new device if it does not exist already"""
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.put(
            "/v2/devices/",
            json=payload,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        json_response: dict = response.json()
        json_response.pop("id")

        assert response.status_code == 200
        assert json_response == final_data_in_db[0]

        created_at_timestamps = pop_field(final_data_in_db, "created_at")
        updated_at_timestamps = pop_field(final_data_in_db, "updated_at")

        assert original_data_in_db == []
        assert final_data_in_db == [payload]
        assert all([is_not_older_than(x, seconds=30) for x in created_at_timestamps])
        assert all([is_not_older_than(x, seconds=30) for x in updated_at_timestamps])


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_create_device_non_system_user(
    db, client_v2, payload: Dict[str, Any], user_jwt_cookie
):
    """Only system users can PUT to /v2/devices/"""
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.put(
            "/v2/devices/",
            json=payload,
            cookies=user_jwt_cookie,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )

        assert response.status_code == 401
        assert response.json() == {"detail": "Unauthorized"}

        assert original_data_in_db == []
        assert final_data_in_db == []


@pytest.mark.parametrize("payload", _DEVICE_LIST)
def test_create_pre_existing_device(
    db, client_v2, payload: Dict[str, Any], system_app_token_header
):
    """PUT to /v2/devices a pre-existing device will do nothing except update updated_at"""
    insert_in_collection(db, collection_name=_DEVICES_COLLECTION, data=[payload])
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.put(
            "/v2/devices",
            json=payload,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        json_response: dict = response.json()
        json_response.pop("id")

        assert response.status_code == 200
        assert json_response == final_data_in_db[0]

        updated_at_timestamps = pop_field(final_data_in_db, "updated_at")

        assert original_data_in_db == [payload]
        assert final_data_in_db == original_data_in_db
        assert all([is_not_older_than(x, seconds=30) for x in updated_at_timestamps])


@pytest.mark.parametrize("backend_dict", _DEVICE_LIST)
def test_update_device(
    db, client_v2, backend_dict: Dict[str, Any], system_app_token_header
):
    """PUT to /v2/devices/{name} updates the given device"""
    insert_in_collection(db, collection_name=_DEVICES_COLLECTION, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    backend_name = backend_dict["name"]
    payload = {"foo": "bar", "hey": "you"}

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.put(
            f"/v2/devices/{backend_name}",
            json=payload,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        json_response: dict = response.json()
        json_response.pop("id")

        assert response.status_code == 200
        assert json_response == final_data_in_db[0]

        updated_at_timestamps = pop_field(final_data_in_db, "updated_at")
        expected = {
            **original_data_in_db[0],
            **payload,
        }

        assert original_data_in_db == [backend_dict]
        assert final_data_in_db[0] == expected
        assert all([is_not_older_than(x, seconds=30) for x in updated_at_timestamps])


@pytest.mark.parametrize("backend_dict", _DEVICE_LIST)
def test_update_device_non_system_user(
    db, client_v2, backend_dict: Dict[str, Any], user_jwt_cookie
):
    """Only system users can PUT to /v2/devices/{name}"""
    insert_in_collection(db, collection_name=_DEVICES_COLLECTION, data=[backend_dict])
    original_data_in_db = find_in_collection(
        db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    backend_name = backend_dict["name"]
    payload = {"foo": "bar", "hey": "you"}

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.put(
            f"/v2/devices/{backend_name}",
            json=payload,
            cookies=user_jwt_cookie,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_DEVICES_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )

        assert response.status_code == 401
        assert response.json() == {"detail": "Unauthorized"}

        assert original_data_in_db == [backend_dict]
        assert final_data_in_db[0] == backend_dict

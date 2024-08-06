"""Tests for calibrations v2"""

import pytest

from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import order_by, pop_field

_CALIBRATIONS_LIST = load_json_fixture("calibrations_v2.json")
_DEVICE_NAMES = [item["name"] for item in _CALIBRATIONS_LIST]
_COLLECTION = "calibrations_v2"
_EXCLUDED_FIELDS = ["_id"]


def test_read_calibrations(db, client, user_jwt_cookie):
    """GET `/v2/calibrations/` returns the latest calibrations"""
    insert_in_collection(
        database=db, collection_name=_COLLECTION, data=_CALIBRATIONS_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/v2/calibrations", headers=user_jwt_cookie)
        got = order_by(response.json(), field="name")
        pop_field(got, "_id")
        expected = order_by(_CALIBRATIONS_LIST, field="name")

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("name", _DEVICE_NAMES)
def test_read_calibration(name: str, db, client, app_token_header):
    """Get `/v2/calibrations/{name}` reads the calibration of the given device"""
    insert_in_collection(
        database=db, collection_name=_COLLECTION, data=_CALIBRATIONS_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/v2/calibrations/{name}", headers=app_token_header)
        got: dict = response.json()
        got.pop("_id")
        expected = list(filter(lambda x: x["name"] == name, _CALIBRATIONS_LIST))[0]

        assert response.status_code == 200
        assert expected == got


def test_create_calibrations(db, client, system_app_token_header):
    """POST list of calibration-like dicts to `/v2/calibrations` creates them"""
    original_data_in_db = find_in_collection(
        db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/v2/calibrations/",
            json=_CALIBRATIONS_LIST,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        final_data_in_db = order_by(final_data_in_db, "name")
        expected_data_in_db = order_by(_CALIBRATIONS_LIST, field="name")
        timelogs = pop_field(final_data_in_db, "timelog")

        assert response.status_code == 200
        assert response.json() == "OK"

        assert original_data_in_db == []
        assert final_data_in_db == expected_data_in_db
        assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


def test_create_calibrations_non_system_user(db, client, user_jwt_cookie):
    """Only system users can POST list of calibration-like dicts to `/v2/calibrations`"""
    original_data_in_db = find_in_collection(
        db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/v2/calibrations/",
            json=_CALIBRATIONS_LIST,
            cookies=user_jwt_cookie,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        final_data_in_db = order_by(final_data_in_db, "name")

        assert response.status_code == 401
        assert response.json() == {"detail": "Unauthorized"}

        assert original_data_in_db == []
        assert final_data_in_db == []

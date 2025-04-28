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
"""Tests for calibrations v2"""
import copy
from datetime import datetime, timezone

import pytest

from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import distinct_on, order_by, pop_field

_CALIBRATIONS_LIST = load_json_fixture("calibrations_v2.json")
_LATEST_CALIBRATIONS = distinct_on(
    order_by(_CALIBRATIONS_LIST, field="last_calibrated", is_descending=True),
    field="name",
)
_DEVICE_NAMES = [item["name"] for item in _LATEST_CALIBRATIONS]
_COLLECTION = "calibrations_v2"
_LOGS_COLLECTION = "calibrations_logs"
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
        expected = order_by(_LATEST_CALIBRATIONS, field="name")

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("name", _DEVICE_NAMES)
def test_read_calibration(name: str, db, client, app_token_header):
    """Get `/v2/calibrations/{name}` reads the latest calibration of the given device"""
    insert_in_collection(
        database=db, collection_name=_COLLECTION, data=_CALIBRATIONS_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/v2/calibrations/{name}", headers=app_token_header)
        got: dict = response.json()
        got.pop("_id")
        expected = list(filter(lambda x: x["name"] == name, _LATEST_CALIBRATIONS))[0]

        assert response.status_code == 200
        assert expected == got


def test_create_calibrations(db, client, system_app_token_header, freezer):
    """POST calibrations to `/v2/calibrations` upserts them in calibrations_v2, and in calibrations_logs if not exist"""
    now = (
        datetime.now(timezone.utc)
        .isoformat(sep="T", timespec="milliseconds")
        .replace("+00:00", "Z")
    )
    # insert only some of the calibrations in collection to show upsert is done
    original_calibrations = _CALIBRATIONS_LIST[:2]
    insert_in_collection(
        database=db, collection_name=_COLLECTION, data=original_calibrations
    )
    insert_in_collection(
        database=db, collection_name=_LOGS_COLLECTION, data=original_calibrations
    )
    original_calibrations_in_db = find_in_collection(
        db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/v2/calibrations/",
            json=_CALIBRATIONS_LIST,
            headers=system_app_token_header,
        )
        final_calibrations_in_db = find_in_collection(
            db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        final_calibration_logs_in_db = find_in_collection(
            db, collection_name=_LOGS_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        final_calibrations_in_db = order_by(final_calibrations_in_db, "name")
        final_calibration_logs_in_db = order_by(final_calibration_logs_in_db, "name")
        new_calibrations = [{**v, "last_calibrated": now} for v in _CALIBRATIONS_LIST]
        expected_calibrations_in_db = order_by(new_calibrations, field="name")
        expected_calibration_logs_in_db = order_by(
            original_calibrations + new_calibrations[2:], field="name"
        )

        assert response.status_code == 200
        assert response.json() == "OK"

        assert original_calibrations_in_db == original_calibrations
        assert final_calibrations_in_db == expected_calibrations_in_db
        assert final_calibration_logs_in_db == expected_calibration_logs_in_db


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

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
"""Tests for calibrations"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import pytest
from bson import ObjectId

from tests._utils.date_time import get_current_timestamp_str, get_timestamp_str
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import (
    distinct_on,
    filter_by_equality,
    order_by,
    order_by_many,
    with_current_timestamps,
    with_incremental_timestamps,
)

_CALIBRATIONS_LIST = load_json_fixture("calibrations.json")
_LATEST_CALIBRATIONS = distinct_on(
    order_by(_CALIBRATIONS_LIST, field="last_calibrated", is_descending=True),
    field="name",
)
_DEVICE_NAMES = [item["name"] for item in _LATEST_CALIBRATIONS]
_COLLECTION = "calibrations"
_LOGS_COLLECTION = "calibrations_logs"
_EXCLUDED_FIELDS = ["_id"]
_SKIP_LIMIT_SORT_PARAMS = [
    (0, 1, ["-version", "last_calibrated"]),
    (2, 4, None),
    (1, 3, ["version"]),
    (None, 10, None),
    (2, None, ["last_calibrated"]),
]
_SEARCH_PARAMS = [
    {"version": "2024.04.1"},
    {"name": "Loke"},
    {"version": "2023.06.0"},
    {"version": "2023.06.0", "name": "Loke"},
    {"version": "2023.06.0", "name": "Thor"},
    {},
]
_PAGINATE_AND_SEARCH_PARAMS = [
    (skip, limit, sort, search)
    for skip, limit, sort in _SKIP_LIMIT_SORT_PARAMS
    for search in _SEARCH_PARAMS
]


@pytest.mark.parametrize("skip, limit, sort, search", _PAGINATE_AND_SEARCH_PARAMS)
def test_find_calibrations(
    db,
    client,
    skip: Optional[int],
    limit: Optional[int],
    sort: Optional[List[str]],
    search: dict,
    freezer,
):
    """Get to /calibrations/?version=...&name=... can search for the calibrations that fulfill the given filters"""
    raw_calibrations = with_incremental_timestamps(
        _LATEST_CALIBRATIONS, fields=("last_calibrated", "updated_at")
    )
    inserted_ids = insert_in_collection(
        database=db, collection_name=_COLLECTION, data=raw_calibrations
    )
    raw_calibrations = _attach_str_ids(
        raw_calibrations, ids=inserted_ids, id_field="id"
    )

    query_string = "?"
    slice_end = len(raw_calibrations)
    slice_start = 0
    sort_fields = [
        "-last_calibrated",
    ]
    if limit is not None:
        query_string += f"limit={limit}&"
        slice_end = limit
    if skip is not None:
        query_string += f"skip={skip}&"
        slice_start = skip
        slice_end += skip
    if sort is not None:
        sort_fields = sort
        for sort_field in sort_fields:
            query_string += f"sort={sort_field}&"

    # Adding search
    for key, value in search.items():
        query_string += f"{key}={value}&"

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/calibrations/{query_string}")
        got = response.json()

        filtered_data = filter_by_equality(raw_calibrations, filters=search)
        sorted_data = order_by_many(filtered_data, fields=sort_fields)
        expected = {
            "skip": slice_start,
            "limit": limit,
            "data": sorted_data[slice_start:slice_end],
        }

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("name", _DEVICE_NAMES)
def test_read_calibration(name: str, db, client, freezer):
    """Get `/calibrations/{name}` reads the latest calibration of the given device"""
    raw_calibrations = with_incremental_timestamps(
        _LATEST_CALIBRATIONS, fields=("last_calibrated", "updated_at")
    )
    inserted_ids = insert_in_collection(
        database=db, collection_name=_COLLECTION, data=raw_calibrations
    )
    raw_calibrations = _attach_str_ids(
        raw_calibrations, ids=inserted_ids, id_field="id"
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/calibrations/{name}")
        got = response.json()
        expected = filter_by_equality(raw_calibrations, {"name": name})[0]

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("payload", _CALIBRATIONS_LIST)
def test_create(db, client, system_app_token_header, payload, freezer):
    """POST new calibration to `/calibrations` creates it in calibrations and returns it"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/calibrations/",
            json=payload,
            headers=system_app_token_header,
        )
        got = response.json()
        assert response.status_code == 200
        assert got == {
            **payload,
            "updated_at": get_current_timestamp_str(),
            "id": got["id"],
        }


@pytest.mark.parametrize("raw_payload", _CALIBRATIONS_LIST)
def test_upsert(db, client, system_app_token_header, raw_payload, freezer):
    """POST an existing calibration to `/calibrations/` updates it in the calibrations collection"""
    raw_calibrations = with_current_timestamps(
        [raw_payload], fields=("updated_at", "last_calibrated")
    )
    insert_in_collection(
        database=db, collection_name=_COLLECTION, data=raw_calibrations
    )

    now = get_current_timestamp_str()
    future_timestamp = get_timestamp_str(
        datetime.now(timezone.utc) + timedelta(hours=2)
    )
    payload = {
        **raw_payload,
        "last_calibrated": future_timestamp,
        "resonators": None,
        "discriminators": None,
    }

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/calibrations/",
            json=payload,
            headers=system_app_token_header,
        )
        got = response.json()
        assert response.status_code == 200
        assert got == {**payload, "updated_at": now, "id": got["id"]}

        new_calibration_in_db = {
            **payload,
            "updated_at": now,
            "_id": ObjectId(got["id"]),
        }
        final_db_data = find_in_collection(db, collection_name=_COLLECTION)
        assert final_db_data == [new_calibration_in_db]


@pytest.mark.parametrize("raw_payload", _CALIBRATIONS_LIST)
def test_create_log(db, client, system_app_token_header, raw_payload, freezer):
    """POST calibrations to `/calibrations/` adds the calibration to calibrations_logs if not exist"""
    raw_calibrations = with_current_timestamps(
        _LATEST_CALIBRATIONS, fields=("updated_at",)
    )
    # insert only some of the calibrations in collection to show upsert is done
    original_logs_in_db = raw_calibrations[:2]
    insert_in_collection(
        database=db, collection_name=_LOGS_COLLECTION, data=raw_calibrations[:2]
    )

    future_timestamp = get_timestamp_str(
        datetime.now(timezone.utc) + timedelta(hours=2)
    )
    payload = {**raw_payload, "last_calibrated": future_timestamp}

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/calibrations/",
            json=payload,
            headers=system_app_token_header,
        )
        got = find_in_collection(
            db, collection_name=_LOGS_COLLECTION, fields_to_exclude=("_id",)
        )
        expected = [*original_logs_in_db, payload]

        assert response.status_code == 200
        assert order_by(got, "name") == order_by(expected, "name")


@pytest.mark.parametrize("payload", _CALIBRATIONS_LIST)
def test_create_calibrations_non_system_user(db, client, payload, user_jwt_cookie):
    """Only system users can POST calibration-like dicts to `/calibrations`"""
    original_data_in_db = find_in_collection(
        db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/calibrations/",
            json=payload,
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


def _attach_str_ids(
    data: List[Dict[str, Any]], ids: List[ObjectId], id_field: str = "_id"
) -> List[Dict[str, Any]]:
    """Attaches ids in string form to the data

    Args:
        data: the list of raw data records
        ids: the list of ObjectId ids, in the same order as that of the data
        id_field: the field on the records that is to have the id

    Returns:
        the list of records with ids attached to them
    """
    return [{**item, id_field: str(ids[idx])} for idx, item in enumerate(data)]

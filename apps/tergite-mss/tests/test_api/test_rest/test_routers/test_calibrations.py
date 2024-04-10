"""Tests for calibrations"""

import pytest

from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import order_by, pop_field

_CALIBRATIONS_LIST = load_json_fixture("calibration_list.json")
_JOB_IDS = [item["job_id"] for item in _CALIBRATIONS_LIST]
_COLLECTION = "calibrations"
_EXCLUDED_FIELDS = ["_id"]


@pytest.mark.parametrize("nlast", [1, 4, 6, 10, None])
def test_read_calibrations(nlast, db, client, app_token_header):
    """GET `/calibrations/` with given nlast returns the latest nlast number of calibrations"""
    insert_in_collection(
        database=db, collection_name=_COLLECTION, data=_CALIBRATIONS_LIST
    )

    query_string = "" if nlast is None else f"?nlast={nlast}"
    limit = 10 if nlast is None else nlast

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/calibrations{query_string}", headers=app_token_header)
        got = order_by(response.json(), field="job_id")
        expected = order_by(_CALIBRATIONS_LIST[:limit], field="job_id")

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("job_id", _JOB_IDS)
def test_read_calibration(job_id: str, db, client, app_token_header):
    """Get `/calibrations/{job_id}` reads the calibration of the given job_id"""
    insert_in_collection(
        database=db, collection_name=_COLLECTION, data=_CALIBRATIONS_LIST
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/calibrations/{job_id}", headers=app_token_header)
        got = response.json()
        expected = list(filter(lambda x: x["job_id"] == job_id, _CALIBRATIONS_LIST))[0]

        assert response.status_code == 200
        assert expected == got


def test_create_calibrations(db, client, system_app_token_header):
    """POST list of calibration-like dicts to `/calibrations` creates them"""
    original_data_in_db = find_in_collection(
        db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            "/calibrations/",
            json=_CALIBRATIONS_LIST,
            headers=system_app_token_header,
        )
        final_data_in_db = find_in_collection(
            db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
        )
        final_data_in_db = order_by(final_data_in_db, "job_id")
        expected_data_in_db = order_by(_CALIBRATIONS_LIST, field="job_id")
        timelogs = pop_field(final_data_in_db, "timelog")

        assert response.status_code == 200
        assert response.json() == "OK"

        assert original_data_in_db == []
        assert final_data_in_db == expected_data_in_db
        assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])

"""Tests for the random router of the REST API"""

import pytest

from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import pop_field

_RNG_LIST = load_json_fixture("rng_list.json")
_JOB_IDS = [item["job_id"] for item in _RNG_LIST]
_COLLECTION = "rng"
_EXCLUDED_FIELDS = ["_id"]


def test_create_many_rng(db, client):
    """POST list of rng to /random/ should create them in the service"""
    original_data_in_db = find_in_collection(
        db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )

    response = client.post(
        "/random/",
        json=_RNG_LIST,
    )
    final_data_in_db = find_in_collection(
        db, collection_name=_COLLECTION, fields_to_exclude=_EXCLUDED_FIELDS
    )
    timelogs = pop_field(final_data_in_db, field="timelog")

    assert response.status_code == 200
    assert response.json() == "OK"

    assert original_data_in_db == []
    assert final_data_in_db == _RNG_LIST
    assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("job_id", _JOB_IDS)
def test_read_rng(client, db, job_id):
    """GET from /rng/{job_id} should return rng for given job"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_RNG_LIST)

    response = client.get(f"/rng/{job_id}")
    got = response.json()
    expected = list(filter(lambda x: x["job_id"] == job_id, _RNG_LIST))[0]

    assert response.status_code == 200
    assert expected == got

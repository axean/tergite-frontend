"""Integration tests for the jobs router"""
import pytest

import settings
from tests._utils.date_time import is_not_older_than
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import order_by, pop_field

_STATUSES = ["DONE", "REGISTERED", "EXECUTING"]
_URLS = ["http://example.com", "http://foo.com", "http://bar.com"]
_DEFAULT_MEMORY_LIST = ["0x0", "0x1", "0x0", "0x0", "0x0", "0x1"]
_JOBS_LIST = load_json_fixture("job_list.json")
_JOB_IDS = [item["job_id"] for item in _JOBS_LIST]
_MEMORY_LIST = [
    [f"{index}-{v}" for v in _DEFAULT_MEMORY_LIST]
    for index, item in enumerate(_JOBS_LIST)
]
_JOB_UPDATE_PAYLOADS = [
    {
        "result": {"memory": [f"{index}-{v}" for v in _DEFAULT_MEMORY_LIST]},
        "status": _STATUSES[index % 3],
        "download_url": _URLS[index % 3],
    }
    for index, item in enumerate(_JOBS_LIST)
]
_STATUS_LIST = [_STATUSES[index % 3] for index, item in enumerate(_JOBS_LIST)]
_URL_LIST = [_URLS[index % 3] for index, item in enumerate(_JOBS_LIST)]
_BACKENDS = ["loke", "loki", None]
_COLLECTION = "jobs"
_EXCLUDED_FIELDS = ["_id"]


@pytest.mark.parametrize("job_id", _JOB_IDS)
def test_read_job(db, client, job_id: str, no_qpu_app_token_header):
    """Get to /jobs/{job_id} returns the job for the given job_id"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/jobs/{job_id}", headers=no_qpu_app_token_header)
        got = response.json()
        expected = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]

        assert response.status_code == 200
        assert expected == got


@pytest.mark.parametrize("job_id", _JOB_IDS)
def test_read_job_result(db, client, job_id: str, no_qpu_app_token_header):
    """Get to /jobs/{job_id}/result returns the job result for the given job_id"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/jobs/{job_id}/result", headers=no_qpu_app_token_header)
        got = response.json()
        expected_job = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]

        try:
            status_code = 200
            expected = expected_job["result"]
        except KeyError:
            status_code = 404
            expected = {"detail": f"job of id {job_id} has no result"}

        assert response.status_code == status_code
        assert expected == got


@pytest.mark.parametrize("job_id", _JOB_IDS)
def test_read_job_download_url(db, client, job_id: str, no_qpu_app_token_header):
    """Get to /jobs/{job_id}/download_url the job download_url for the given job_id"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/jobs/{job_id}/download_url", headers=no_qpu_app_token_header
        )
        got = response.json()
        expected_job = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]

        try:
            status_code = 200
            expected = expected_job["download_url"]
        except KeyError:
            status_code = 404
            expected = {"detail": f"job of id {job_id} has no download_url"}

        assert response.status_code == status_code
        assert expected == got


@pytest.mark.parametrize("backend", _BACKENDS)
def test_create_job(db, client, backend: str, app_token_header):
    """Post to /jobs/ creates a job in the given backend"""
    query_string = "" if backend is None else f"?backend={backend}"
    backend_param = backend if backend else "pingu"
    jobs_before_creation = find_in_collection(
        db,
        collection_name=_COLLECTION,
        fields_to_exclude=_EXCLUDED_FIELDS,
    )

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            f"/jobs/{query_string}", json={}, headers=app_token_header
        )
        json_response = response.json()
        new_job_id = json_response["job_id"]
        expected_job = {
            "job_id": new_job_id,
            "backend": backend_param,
            "status": "REGISTERING",
        }
        jobs_after_creation = find_in_collection(
            db,
            collection_name=_COLLECTION,
            fields_to_exclude=_EXCLUDED_FIELDS,
        )
        timelogs = pop_field(jobs_after_creation, "timelog")

        assert response.status_code == 200
        assert response.json() == {
            "job_id": str(new_job_id),
            "upload_url": str(settings.BCC_MACHINE_ROOT_URL) + "/jobs",
        }

        assert jobs_before_creation == []
        assert jobs_after_creation == [expected_job]
        assert all([is_not_older_than(x["REGISTERED"], seconds=30) for x in timelogs])


@pytest.mark.parametrize("nlast", [1, 4, 6, 10, None])
def test_read_jobs(db, client, nlast: int, no_qpu_app_token_header):
    """Get to /jobs returns the latest jobs only upto the given nlast records"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    query_string = "" if nlast is None else f"?nlast={nlast}"
    limit = 10 if nlast is None else nlast

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/jobs{query_string}", headers=no_qpu_app_token_header)
        got = order_by(response.json(), field="job_id")
        expected = order_by(_JOBS_LIST[:limit], field="job_id")

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("job_id, memory", zip(_JOB_IDS, _MEMORY_LIST))
def test_update_job_result(db, client, job_id: str, memory: list, app_token_header):
    """PUT to /jobs/{job_id}/result updates the result of the job with the given memory object"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            f"/jobs/{job_id}/result", json=memory, headers=app_token_header
        )
        got = response.json()
        expected_job = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]
        expected_job["result"] = {"memory": memory}

        job_after_update = find_in_collection(
            db,
            collection_name=_COLLECTION,
            fields_to_exclude=_EXCLUDED_FIELDS,
            _filter={"job_id": job_id},
        )[0]
        timelog = job_after_update.pop("timelog")

        assert response.status_code == 200
        assert got == "OK"
        assert job_after_update == expected_job
        assert is_not_older_than(timelog["LAST_UPDATED"], seconds=30)


@pytest.mark.parametrize("job_id, status", zip(_JOB_IDS, _STATUS_LIST))
def test_update_job_status(db, client, job_id: str, status: str, app_token_header):
    """PUT to /jobs/{job_id}/status updates the status of the job of the given job id"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            f"/jobs/{job_id}/status", json=status, headers=app_token_header
        )
        got = response.json()
        expected_job = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]
        expected_job["status"] = status

        job_after_update = find_in_collection(
            db,
            collection_name=_COLLECTION,
            fields_to_exclude=_EXCLUDED_FIELDS,
            _filter={"job_id": job_id},
        )[0]
        timelog = job_after_update.pop("timelog")

        assert response.status_code == 200
        assert got == "OK"
        assert job_after_update == expected_job
        assert is_not_older_than(timelog["LAST_UPDATED"], seconds=30)


@pytest.mark.parametrize("job_id, url", zip(_JOB_IDS, _URL_LIST))
def test_update_job_download_url(db, client, job_id: str, url: str, app_token_header):
    """PUT to /jobs/{job_id}/download_url updates the download_url of the job of the given job id"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            f"/jobs/{job_id}/download_url", json=url, headers=app_token_header
        )
        got = response.json()
        expected_job = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]
        expected_job["download_url"] = url

        job_after_update = find_in_collection(
            db,
            collection_name=_COLLECTION,
            fields_to_exclude=_EXCLUDED_FIELDS,
            _filter={"job_id": job_id},
        )[0]
        timelog = job_after_update.pop("timelog")

        assert response.status_code == 200
        assert got == "OK"
        assert job_after_update == expected_job
        assert is_not_older_than(timelog["LAST_UPDATED"], seconds=30)


@pytest.mark.parametrize("job_id, event_name", zip(_JOB_IDS, _STATUS_LIST))
def test_update_timelog_entry(
    db, client, job_id: str, event_name: str, app_token_header
):
    """PUT to /jobs/{job_id}/timelog refreshes the timelog of the given event of the job of the given job id"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(
            f"/jobs/{job_id}/timelog", json=event_name, headers=app_token_header
        )
        got = response.json()
        expected_job = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]

        job_after_update = find_in_collection(
            db,
            collection_name=_COLLECTION,
            fields_to_exclude=_EXCLUDED_FIELDS,
            _filter={"job_id": job_id},
        )[0]
        timelog = job_after_update.pop("timelog")

        assert response.status_code == 200
        assert got == "OK"
        assert job_after_update == expected_job
        assert is_not_older_than(timelog[event_name], seconds=30)


@pytest.mark.parametrize("job_id, payload", zip(_JOB_IDS, _JOB_UPDATE_PAYLOADS))
def test_update_job(db, client, job_id: str, payload: dict, app_token_header):
    """PUT to /jobs/{job_id} updates the job with the given object"""
    insert_in_collection(database=db, collection_name=_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.put(
            f"/jobs/{job_id}",
            json={**payload, "timelog.RESULT": "foo"},
            headers=app_token_header,
        )
        got = response.json()
        expected_job = list(filter(lambda x: x["job_id"] == job_id, _JOBS_LIST))[0]
        expected_job.update(payload)

        job_after_update = find_in_collection(
            db,
            collection_name=_COLLECTION,
            fields_to_exclude=_EXCLUDED_FIELDS,
            _filter={"job_id": job_id},
        )[0]
        timelog = job_after_update.pop("timelog")

        assert response.status_code == 200
        assert got == "OK"
        assert job_after_update == expected_job
        assert is_not_older_than(timelog["LAST_UPDATED"], seconds=30)
        assert timelog["RESULT"] == "foo"

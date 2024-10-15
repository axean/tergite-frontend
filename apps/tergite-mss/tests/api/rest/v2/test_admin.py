"""Integration tests for the routes for the admin"""
import copy
from datetime import datetime, timezone
from typing import Any, Dict

import pytest
from pytest_lazyfixture import lazy_fixture

from services.auth.user_requests import UserRequest

from ...._utils.auth import (
    TEST_SUPERUSER_ID,
    TEST_SYSTEM_USER_ID,
    TEST_USER_ID,
    get_db_record,
)
from ...._utils.fixtures import load_json_fixture
from ...._utils.mongodb import insert_in_collection
from ....conftest import PROJECT_V2_LIST, get_auth_cookie

_REQ_STATUSES = ["pending", "rejected", "approved"]
_USER_REQUEST_COLLECTION = "auth_user_requests"
_QPU_TIME_USER_REQUESTS_IN_DB = load_json_fixture("qpu_time_user_requests.json")

_USER_ID_COOKIES_FIXTURE = [
    (TEST_USER_ID, lazy_fixture("user_jwt_cookie")),
    (TEST_SUPERUSER_ID, lazy_fixture("admin_jwt_cookie")),
]

_USER_ID_COOKIES_REQ_STATUS_FIXTURE = [
    (pair[0], pair[1], status)
    for status in _REQ_STATUSES
    for pair in _USER_ID_COOKIES_FIXTURE
]

_USER_ID_COOKIES_REQ_PROJECT_ID_FIXTURE = [
    (pair[0], pair[1], project["_id"])
    for project in PROJECT_V2_LIST
    for pair in _USER_ID_COOKIES_FIXTURE
]
_USER_ID_COOKIES_REQ_PROJECT_ID_AND_STATUS_FIXTURE = [
    (pair[0], pair[1], project["_id"], status)
    for project in PROJECT_V2_LIST
    for status in _REQ_STATUSES
    for pair in _USER_ID_COOKIES_FIXTURE
]
_QPU_TIME_REQUEST = {
    "seconds": 150000.0,
    "reason": "Some other reason again",
}
_USER_ID_COOKIE_QPU_TIME_REQUESTS = [
    (
        user_id,
        get_auth_cookie(user_id),
        {**_QPU_TIME_REQUEST, "project_id": project["_id"]},
    )
    for project in PROJECT_V2_LIST
    for user_id in project["user_ids"]
]

_NON_MEMBER_ID_COOKIE_QPU_TIME_REQUESTS = [
    (
        user_id,
        get_auth_cookie(user_id),
        {**_QPU_TIME_REQUEST, "project_id": project["_id"]},
    )
    for project in PROJECT_V2_LIST
    for user_id in [TEST_USER_ID, TEST_SUPERUSER_ID, TEST_SYSTEM_USER_ID]
    if user_id not in project["user_ids"]
]


@pytest.mark.parametrize("user_id, cookies", _USER_ID_COOKIES_FIXTURE)
def test_view_all_qpu_time_user_requests(
    user_id, cookies, client_v2, inserted_project_ids_v2, db
):
    """Any user can view all user requests at /v2/admin/qpu-time-requests/"""
    insert_in_collection(
        database=db,
        collection_name=_USER_REQUEST_COLLECTION,
        data=_QPU_TIME_USER_REQUESTS_IN_DB,
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get("/v2/admin/qpu-time-requests/", cookies=cookies)

        got = response.json()
        user_request_list = [
            _db_to_http_item(item) for item in _QPU_TIME_USER_REQUESTS_IN_DB
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": user_request_list}


@pytest.mark.parametrize("user_id", [TEST_USER_ID, TEST_SUPERUSER_ID])
def test_non_authenticated_qpu_time_user_requests_view(
    user_id, client_v2, inserted_project_ids_v2, db
):
    """Only authenticated users can view user requests at /v2/admin/qpu-time-requests/"""
    insert_in_collection(
        database=db,
        collection_name=_USER_REQUEST_COLLECTION,
        data=_QPU_TIME_USER_REQUESTS_IN_DB,
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get("/v2/admin/qpu-time-requests/")
        got = response.json()
        assert response.status_code == 401
        assert got == {"detail": "Unauthorized"}


@pytest.mark.parametrize(
    "user_id, cookies, status", _USER_ID_COOKIES_REQ_STATUS_FIXTURE
)
def test_view_qpu_time_user_requests_filtered_by_status(
    user_id, cookies, status, client_v2, inserted_project_ids_v2, db
):
    """Any user can view user requests at /v2/admin/qpu-time-requests/?status=... filtered by status"""
    insert_in_collection(
        database=db,
        collection_name=_USER_REQUEST_COLLECTION,
        data=_QPU_TIME_USER_REQUESTS_IN_DB,
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get(
            f"/v2/admin/qpu-time-requests/?status={status}", cookies=cookies
        )

        got = response.json()
        user_request_list = [
            _db_to_http_item(item)
            for item in _QPU_TIME_USER_REQUESTS_IN_DB
            if item["status"] == status
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": user_request_list}


@pytest.mark.parametrize(
    "user_id, cookies, project_id", _USER_ID_COOKIES_REQ_PROJECT_ID_FIXTURE
)
def test_view_qpu_time_user_requests_filtered_by_project_id(
    user_id, cookies, project_id, client_v2, inserted_project_ids_v2, db
):
    """Any user can view user requests at /v2/admin/qpu-time-requests/?project_id=... filtered by project_id"""
    insert_in_collection(
        database=db,
        collection_name=_USER_REQUEST_COLLECTION,
        data=_QPU_TIME_USER_REQUESTS_IN_DB,
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get(
            f"/v2/admin/qpu-time-requests/?project_id={project_id}", cookies=cookies
        )

        got = response.json()
        user_request_list = [
            _db_to_http_item(item)
            for item in _QPU_TIME_USER_REQUESTS_IN_DB
            if item["request"]["project_id"] == project_id
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": user_request_list}


@pytest.mark.parametrize(
    "user_id, cookies, project_id, status",
    _USER_ID_COOKIES_REQ_PROJECT_ID_AND_STATUS_FIXTURE,
)
def test_view_qpu_time_user_requests_filtered_by_project_id_and_status(
    user_id, cookies, project_id, status, client_v2, inserted_project_ids_v2, db
):
    """User can filter user requests /v2/admin/qpu-time-requests/?project_id=...&status=... by project_id and status"""
    insert_in_collection(
        database=db,
        collection_name=_USER_REQUEST_COLLECTION,
        data=_QPU_TIME_USER_REQUESTS_IN_DB,
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get(
            f"/v2/admin/qpu-time-requests/?project_id={project_id}&status={status}",
            cookies=cookies,
        )

        got = response.json()
        user_request_list = [
            _db_to_http_item(item)
            for item in _QPU_TIME_USER_REQUESTS_IN_DB
            if item["request"]["project_id"] == project_id and item["status"] == status
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": user_request_list}


@pytest.mark.parametrize(
    "user_id, cookies, request_body", _USER_ID_COOKIE_QPU_TIME_REQUESTS
)
def test_create_qpu_time_user_request(
    user_id, cookies, request_body, client_v2, inserted_project_ids_v2, db, freezer
):
    """Any project member can create a user request at /v2/admin/qpu-time-requests/"""
    timestamp = (
        datetime.now(timezone.utc)
        .isoformat("T", timespec="milliseconds")
        .replace("+00:00", "Z")
    )
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        filter_obj = {"request.project_id": request_body["project_id"]}
        assert get_db_record(db, UserRequest, _filter=filter_obj) is None

        response = client.post(
            "/v2/admin/qpu-time-requests/", cookies=cookies, json=request_body
        )

        got = response.json()
        expected = {
            "request": {**request_body},
            "requester_id": user_id,
            "updated_at": timestamp,
            "created_at": timestamp,
            "type": "project-qpu-seconds",
            "status": "pending",
            "rejection_reason": None,
            "approver_id": None,
        }
        assert isinstance(got.pop("id"), str)
        assert response.status_code == 201
        assert got == expected
        assert get_db_record(db, UserRequest, _filter=filter_obj) is not None


@pytest.mark.parametrize(
    "user_id, cookies, request_body", _NON_MEMBER_ID_COOKIE_QPU_TIME_REQUESTS
)
def test_non_member_create_qpu_time_user_request(
    user_id, cookies, request_body, client_v2, inserted_project_ids_v2, db
):
    """Non project members can not create a user request at /v2/admin/qpu-time-requests/"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        filter_obj = {"request.project_id": request_body["project_id"]}
        response = client.post(
            "/v2/admin/qpu-time-requests/", cookies=cookies, json=request_body
        )

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "Forbidden"}
        assert get_db_record(db, UserRequest, _filter=filter_obj) is None


@pytest.mark.parametrize("project", PROJECT_V2_LIST)
def test_unauthenticated_create_qpu_time_user_request(
    project, client_v2, inserted_project_ids_v2, db
):
    """Unauthenticated users can not create a user request at /v2/admin/qpu-time-requests/"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        request_body = {**_QPU_TIME_REQUEST, "project_id": project["_id"]}
        filter_obj = {"request.project_id": request_body["project_id"]}
        assert get_db_record(db, UserRequest, _filter=filter_obj) is None

        response = client.post("/v2/admin/qpu-time-requests/", json=request_body)

        got = response.json()
        assert response.status_code == 401
        assert got == {"detail": "Unauthorized"}
        assert get_db_record(db, UserRequest, _filter=filter_obj) is None


def _db_to_http_item(db_item: Dict[str, Any]) -> Dict[str, Any]:
    """Converts a database item into an item that can be expected to be returned by HTTP server

    Args:
        db_item: the item in the database

    Returns:
        the item as would be seen from an HTTP response
    """
    item = copy.deepcopy(db_item)
    item["id"] = str(item.pop("_id"))
    return item

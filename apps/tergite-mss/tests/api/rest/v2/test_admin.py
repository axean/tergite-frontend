"""Integration tests for the routes for the admin"""
import copy
from typing import Any, Dict

import pytest
from pytest_lazyfixture import lazy_fixture

from ...._utils.auth import TEST_SUPERUSER_ID, TEST_USER_ID
from ...._utils.fixtures import load_json_fixture
from ...._utils.mongodb import insert_in_collection

_REQ_STATUSES = ["pending", "rejected", "approved"]
_USER_REQUEST_COLLECTION = "auth_user_requests"
_QPU_TIME_USER_REQUESTS_IN_DB = load_json_fixture("qpu_time_user_requests.json")
_PROJECT_V2_LIST = load_json_fixture("project_v2_list.json")

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
    for project in _PROJECT_V2_LIST
    for pair in _USER_ID_COOKIES_FIXTURE
]
_USER_ID_COOKIES_REQ_PROJECT_ID_AND_STATUS_FIXTURE = [
    (pair[0], pair[1], project["_id"], status)
    for project in _PROJECT_V2_LIST
    for status in _REQ_STATUSES
    for pair in _USER_ID_COOKIES_FIXTURE
]

# TODO: test
# - creating user requests
# - create user requests when not signed in


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

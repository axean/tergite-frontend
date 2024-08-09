"""Integration tests for the 'me v2' router"""

from datetime import datetime, timedelta, timezone

import pytest
from pytest_lazyfixture import lazy_fixture

from services.auth import AppToken, AuthProvider
from tests._utils.auth import (
    TEST_APP_TOKEN_DICT,
    TEST_NO_QPU_APP_TOKEN_DICT,
    TEST_NO_QPU_PROJECT_V2_DICT,
    TEST_PROJECT_V2_DICT,
    TEST_SUPERUSER_EMAIL,
    TEST_SUPERUSER_ID,
    TEST_USER_EMAIL,
    TEST_USER_ID,
    get_db_record,
)
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import insert_in_collection
from tests._utils.records import order_by
from tests.conftest import (
    APP_TOKEN_LIST,
    PROJECT_V2_LIST,
    get_auth_cookie,
    get_unauthorized_app_token_post_with_cookies,
)

_JOBS_COLLECTION = "jobs_v2"

_USER_EMAIL_INDEX = {
    TEST_SUPERUSER_EMAIL: TEST_SUPERUSER_ID,
    TEST_USER_EMAIL: TEST_USER_ID,
}
_MY_PROJECT_REQUESTS = [
    (user_id, get_auth_cookie(user_id), project)
    for project in PROJECT_V2_LIST
    for user_id in project["user_ids"]
]
_OTHERS_PROJECT_REQUESTS = [
    (user_id, get_auth_cookie(user_id), project)
    for project in PROJECT_V2_LIST
    for user_id in [TEST_USER_ID, TEST_SUPERUSER_ID]
    if user_id not in project["user_ids"]
]

_USER_ID_COOKIES_FIXTURE = [
    (TEST_USER_ID, lazy_fixture("user_jwt_cookie")),
    (TEST_SUPERUSER_ID, lazy_fixture("admin_jwt_cookie")),
]
_MY_TOKENS_REQUESTS = [
    (token["user_id"], get_auth_cookie(token["user_id"]), token)
    for token in APP_TOKEN_LIST
]
_OTHERS_TOKENS_REQUESTS = [
    (user_id, get_auth_cookie(user_id), token)
    for token in APP_TOKEN_LIST
    for user_id in [TEST_USER_ID, TEST_SUPERUSER_ID]
    if user_id != token["user_id"]
]

_JOBS_LIST = load_json_fixture("job_v2_list.json")


@pytest.mark.parametrize("user_id, cookies", _USER_ID_COOKIES_FIXTURE)
def test_view_own_projects_in_less_detail(
    user_id, cookies, client_v2, inserted_project_ids_v2
):
    """Any user can view only their own projects at /v2/me/projects/
    without user_ids"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get("/v2/me/projects/", cookies=cookies)

        got = response.json()
        project_list = [
            {
                "id": str(item["_id"]),
                "version": item.get("version", None),
                "name": item.get("name", None),
                "ext_id": item["ext_id"],
                "qpu_seconds": item["qpu_seconds"],
                "description": item.get("description", None),
                "user_ids": item.get("user_ids", None),
                "admin_id": item.get("admin_id", None),
                "is_active": item.get("is_active", True),
                "created_at": item.get("created_at", None),
                "updated_at": item.get("updated_at", None),
            }
            for item in [TEST_PROJECT_V2_DICT, TEST_NO_QPU_PROJECT_V2_DICT]
            + PROJECT_V2_LIST
            if user_id in item["user_ids"]
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": project_list}


@pytest.mark.parametrize("user_id, cookies, project", _MY_PROJECT_REQUESTS)
def test_view_my_project_in_less_detail(
    user_id, cookies, project, client_v2, inserted_projects_v2
):
    """Any user can view only their own single project at /v2/me/projects/{id}
    without user_emails"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        project_id = project["_id"]
        url = f"/v2/me/projects/{project_id}"
        response = client.get(url, cookies=cookies)

        got = response.json()
        expected = {
            "id": project_id,
            "version": project["version"],
            "name": project["name"],
            "ext_id": project["ext_id"],
            "qpu_seconds": project["qpu_seconds"],
            "description": project["description"],
            "user_ids": project["user_ids"],
            "admin_id": project["admin_id"],
            "is_active": project.get("is_active", True),
            "created_at": project["created_at"],
            "updated_at": project["updated_at"],
        }

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("user_id, cookies, project", _OTHERS_PROJECT_REQUESTS)
def test_view_others_project_is_not_allowed(
    user_id, cookies, project, client_v2, inserted_projects
):
    """No user can view only other's projects at /v2/me/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        project_id = project["_id"]
        url = f"/v2/me/projects/{project_id}"
        response = client.get(url, cookies=cookies)

        got = response.json()
        expected = {"detail": "Not Found"}

        assert response.status_code == 404
        assert got == expected


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_generate_app_token(payload, inserted_projects, client_v2):
    """At /v2/me/tokens/, user can generate app token for project they are attached to"""
    cookies = get_auth_cookie(payload["user_id"])

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.post("/v2/me/tokens/", cookies=cookies, json=payload)

        got = response.json()

        assert response.status_code == 200
        assert isinstance(got["access_token"], str)
        assert len(got["access_token"]) > 12


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_unauthenticated_app_token_generation(payload, inserted_projects, client_v2):
    """401 error raised at /v2/me/tokens/ when no user jwt is sent"""

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.post("/v2/me/tokens/", json=payload)

        got = response.json()
        expected = {"detail": "Unauthorized"}
        assert response.status_code == 401
        assert got == expected


@pytest.mark.parametrize(
    "body, cookies", get_unauthorized_app_token_post_with_cookies()
)
def test_unauthorized_app_token_generation(body, cookies, inserted_projects, client_v2):
    """403 error raised at /v2/me/tokens/, for a project to which a user is not attached"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.post("/v2/me/tokens/", cookies=cookies, json=body)

        got = response.json()
        expected = {"detail": "Forbidden"}
        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_destroy_app_token(
    payload, db, client_v2, inserted_projects, inserted_app_tokens
):
    """At /v2/me/tokens/{token}, user can destroy their own app token"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        _id = payload["_id"]
        user_id = payload["user_id"]
        assert get_db_record(db, AppToken, _id) is not None

        url = f"/v2/me/tokens/{_id}"
        cookies = get_auth_cookie(user_id)
        response = client.delete(url, cookies=cookies)

        assert response.status_code == 204
        assert get_db_record(db, AppToken, _id) is None


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_unauthenticated_app_token_deletion(
    payload, db, client_v2, inserted_projects, inserted_app_tokens
):
    """401 error raised at /v2/me/tokens/{token} if no JWT token is passed"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        _id = payload["_id"]
        assert get_db_record(db, AppToken, _id) is not None

        url = f"/v2/me/tokens/{_id}"
        response = client.delete(url)
        got = response.json()
        expected = {"detail": "Unauthorized"}

        assert response.status_code == 401
        assert got == expected
        assert get_db_record(db, AppToken, _id) is not None


@pytest.mark.parametrize(
    "payload, cookies", get_unauthorized_app_token_post_with_cookies()
)
def test_unauthorized_app_token_deletion(
    payload, cookies, db, client_v2, inserted_projects, inserted_app_tokens
):
    """403 error raised at /v2/me/tokens/{_id}, for a project to which a user is not attached"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        _id = payload["_id"]
        url = f"/v2/me/tokens/{_id}"
        response = client.delete(url, cookies=cookies)

        got = response.json()
        expected = {"detail": "app token does not exist or is expired."}
        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("user_id, cookies", _USER_ID_COOKIES_FIXTURE)
def test_view_own_app_tokens_in_less_detail(
    user_id, cookies, client_v2, inserted_projects, inserted_app_tokens, freezer
):
    """At /v2/me/tokens/, user can view their own app tokens
    without the token itself displayed"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get("/v2/me/tokens/", cookies=cookies)

        got = response.json()
        expected_data = [
            {
                "id": str(v["_id"]),
                "lifespan_seconds": v["lifespan_seconds"],
                "project_ext_id": v["project_ext_id"],
                "title": v["title"],
                "created_at": datetime.now(timezone.utc).isoformat("T"),
            }
            for v in [TEST_APP_TOKEN_DICT, TEST_NO_QPU_APP_TOKEN_DICT]
            + inserted_app_tokens
            if str(v["user_id"]) == user_id
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": expected_data}


@pytest.mark.parametrize("user_id, cookies, token", _MY_TOKENS_REQUESTS)
def test_view_my_app_token_in_less_detail(
    user_id, cookies, token, client_v2, inserted_projects, inserted_app_tokens, freezer
):
    """Any user can view only their own single app token at /v2/me/tokens/{id}
    without token itself displayed"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        token_id = token["_id"]
        url = f"/v2/me/tokens/{token_id}"
        response = client.get(url, cookies=cookies)

        got = response.json()

        expected = {
            "id": token_id,
            "project_ext_id": token["project_ext_id"],
            "title": token["title"],
            "lifespan_seconds": token["lifespan_seconds"],
            "created_at": datetime.now(timezone.utc).isoformat("T"),
        }

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("user_id, cookies, token", _OTHERS_TOKENS_REQUESTS)
def test_view_others_tokens_is_not_allowed(
    user_id, cookies, token, client_v2, inserted_projects, inserted_app_tokens, freezer
):
    """No user can view only other's app tokens at /v2/me/tokens/{id}"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        token_id = token["_id"]
        url = f"/v2/me/tokens/{token_id}"
        response = client.get(url, cookies=cookies)

        got = response.json()
        expected = {"detail": "the token does not exist."}

        assert response.status_code == 404
        assert got == expected


@pytest.mark.parametrize("app_token", APP_TOKEN_LIST)
def test_expired_app_token_fails(
    app_token, client_v2, inserted_projects, app_tokens_with_timestamps, freezer
):
    """Expired app tokens raise 401 HTTP error"""
    app_token_ttl = app_token["lifespan_seconds"]
    cookies = {"some-token": app_token["token"]}
    time_in_future = datetime.now(timezone.utc) + timedelta(seconds=app_token_ttl + 1)

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        # shift time to the future after startup has run
        freezer.move_to(time_in_future.isoformat())

        response = client.get("/", cookies=cookies)

        got = response.json()
        expected = {"detail": "Unauthorized"}

        assert response.status_code == 401
        assert got == expected


@pytest.mark.parametrize("app_token", APP_TOKEN_LIST)
def test_app_token_of_unallocated_projects_fails(
    app_token, client_v2, unallocated_projects, inserted_app_tokens
):
    """App tokens for projects with qpu_seconds <= 0 raise 403 HTTP error"""
    headers = {"Authorization": f"Bearer {app_token['token']}"}
    project = unallocated_projects[app_token["project_ext_id"]]

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get("/", headers=headers)

        got = response.json()
        expected = {
            "detail": f"{project['qpu_seconds']} QPU seconds left on project {project['ext_id']}"
        }

        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("user_id, cookies", _USER_ID_COOKIES_FIXTURE)
def test_read_all_my_jobs(db, client_v2, user_id, cookies):
    """Get to /v2/me/jobs returns the jobs for the current user"""
    # FIXME: the jobs need a user_id property on them
    insert_in_collection(database=db, collection_name=_JOBS_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get(f"/v2/me/jobs", cookies=cookies)
        got = order_by(response.json(), field="job_id")
        expected = order_by(
            [
                job
                for job in _JOBS_LIST
                if "user_id" in job and job["user_id"] == user_id
            ],
            field="job_id",
        )

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("user_id, cookies, project", _MY_PROJECT_REQUESTS)
def test_read_all_my_jobs_of_given_project(db, client_v2, user_id, cookies, project):
    """Get to /v2/me/jobs returns the jobs for the current user for the given project"""
    # FIXME: the jobs need a user_id property on them
    insert_in_collection(database=db, collection_name=_JOBS_COLLECTION, data=_JOBS_LIST)

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        project_id = project["_id"]
        response = client.get(
            f"/v2/me/jobs", cookies=cookies, params={"project_id": project_id}
        )
        got = order_by(response.json(), field="job_id")
        expected = order_by(
            [
                job
                for job in _JOBS_LIST
                if "user_id" in job
                and job["user_id"] == user_id
                and job["project_id"] == project_id
            ],
            field="job_id",
        )

        assert response.status_code == 200
        assert got == expected

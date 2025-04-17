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
"""Integration tests for the 'me v2' router"""

from datetime import datetime, timedelta, timezone
from random import randint

import pytest
from pytest_lazyfixture import lazy_fixture

from services.auth import AppToken, Project
from services.auth.projects.dtos import DeletedProject
from tests._utils.auth import (
    TEST_APP_TOKEN_DICT,
    TEST_NO_QPU_APP_TOKEN_DICT,
    TEST_NO_QPU_PROJECT_V2_DICT,
    TEST_PROJECT_V2_DICT,
    TEST_SUPERUSER_DICT,
    TEST_SUPERUSER_EMAIL,
    TEST_SUPERUSER_ID,
    TEST_SYSTEM_USER_DICT,
    TEST_USER_DICT,
    TEST_USER_EMAIL,
    TEST_USER_ID,
    get_db_record,
    get_jwt_token,
    update_db_record,
)
from tests._utils.date_time import get_timestamp_str
from tests._utils.fixtures import load_json_fixture
from tests._utils.mongodb import insert_in_collection
from tests._utils.records import order_by, prune
from tests.conftest import (
    APP_TOKEN_LIST,
    PROJECT_V2_LIST,
    get_auth_cookie,
    get_unauthorized_app_token_post_with_cookies,
)

_JOBS_COLLECTION = "jobs"

_USER_EMAIL_INDEX = {
    TEST_SUPERUSER_EMAIL: TEST_SUPERUSER_ID,
    TEST_USER_EMAIL: TEST_USER_ID,
}
_MY_PROJECT_REQUESTS = [
    (user_id, get_auth_cookie(user_id), project)
    for project in PROJECT_V2_LIST
    for user_id in project["user_ids"]
]
_MY_ADMINISTERED_PROJECT_REQUESTS = [
    (project["admin_id"], get_auth_cookie(project["admin_id"]), project)
    for project in PROJECT_V2_LIST
]
_MY_NON_ADMINISTERED_PROJECT_REQUESTS = [
    (user_id, get_auth_cookie(user_id), project)
    for project in PROJECT_V2_LIST
    for user_id in project["user_ids"]
    if user_id != project["admin_id"]
]
_MY_USER_INFO_REQUESTS = [
    (user, get_auth_cookie(str(user["_id"])))
    for user in [TEST_USER_DICT, TEST_SUPERUSER_DICT, TEST_SYSTEM_USER_DICT]
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
_EXTRA_PROJECT_DEFAULTS = {
    "resource_ids": [],
    "source": "internal",
    "user_emails": None,
    "admin_email": None,
}

_JOBS_LIST_IN_DB = load_json_fixture("jobs_v2_in_db.json")
_JOBS_LIST_AS_RESPONSES = load_json_fixture("jobs_v2_as_responses.json")


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
    user_id, cookies, project, client_v2, inserted_projects_v2
):
    """No user can view other's projects at /v2/me/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        project_id = project["_id"]
        url = f"/v2/me/projects/{project_id}"
        response = client.get(url, cookies=cookies)

        got = response.json()
        expected = {"detail": "the project does not exist."}

        assert response.status_code == 404
        assert got == expected


@pytest.mark.parametrize("user_id, cookies, project", _MY_ADMINISTERED_PROJECT_REQUESTS)
def test_delete_own_project(
    user_id, cookies, project, client_v2, inserted_projects_v2, db, freezer
):
    """Any user can delete the project they administer at /v2/me/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        _id = project["_id"]
        url = f"/v2/me/projects/{_id}"

        now = get_timestamp_str(datetime.now(timezone.utc))
        original = get_db_record(db, Project, _id)
        assert original is not None
        response = client.delete(url, cookies=cookies)

        deleted_project = get_db_record(db, DeletedProject, _id)
        pruned_fields = ["created_at", "updated_at"]
        pruned_deleted_project, deleted_project_timestamps = prune(
            deleted_project, pruned_fields
        )
        pruned_original, _ = prune(original, pruned_fields)
        pruned_original.update(_EXTRA_PROJECT_DEFAULTS)

        assert response.status_code == 204
        assert get_db_record(db, Project, _id) is None
        assert pruned_deleted_project == pruned_original
        for timestamp in deleted_project_timestamps.values():
            assert timestamp == now


@pytest.mark.parametrize(
    "user_id, cookies, project", _MY_NON_ADMINISTERED_PROJECT_REQUESTS
)
def test_delete_others_project_is_not_allowed(
    user_id, cookies, project, client_v2, inserted_projects_v2, db
):
    """No user can delete projects they don't administer at /v2/me/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        project_id = project["_id"]
        url = f"/v2/me/projects/{project_id}"

        assert get_db_record(db, Project, project_id) is not None
        response = client.delete(url, cookies=cookies)

        got = response.json()
        expected = {"detail": "Forbidden"}

        assert response.status_code == 403
        assert got == expected
        assert get_db_record(db, Project, project_id) is not None


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_generate_app_token(payload, inserted_projects_v2, client_v2):
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
def test_unauthenticated_app_token_generation(payload, inserted_projects_v2, client_v2):
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
def test_unauthorized_app_token_generation(
    body, cookies, inserted_projects_v2, client_v2
):
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
    payload, db, client_v2, inserted_projects_v2, inserted_app_tokens
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
def test_destroy_expired_app_token(
    payload, db, client_v2, inserted_projects_v2, inserted_app_tokens
):
    """At /v2/me/tokens/{token}, user can destroy their own expired app token"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        _id = payload["_id"]
        user_id = payload["user_id"]
        token = get_db_record(db, AppToken, _id)
        assert token is not None

        # shift back the created_at date to a time that would make this token expired
        new_created_at = datetime.now(timezone.utc) - timedelta(
            seconds=token["lifespan_seconds"] + 1
        )
        update_obj = {"$set": {"created_at": new_created_at.isoformat(sep="T")}}
        update_db_record(db, AppToken, _id, update=update_obj)

        url = f"/v2/me/tokens/{_id}"
        cookies = get_auth_cookie(user_id)
        response = client.delete(url, cookies=cookies)

        assert response.status_code == 204
        assert get_db_record(db, AppToken, _id) is None


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_unauthenticated_app_token_deletion(
    payload, db, client_v2, inserted_projects_v2, inserted_app_tokens
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
    payload, cookies, db, client_v2, inserted_projects_v2, inserted_app_tokens
):
    """403 error raised at /v2/me/tokens/{_id}, for a project to which a user is not attached"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        _id = payload["_id"]
        url = f"/v2/me/tokens/{_id}"
        response = client.delete(url, cookies=cookies)

        got = response.json()
        expected = {"detail": "app token does not exist."}
        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("user_id, cookies", _USER_ID_COOKIES_FIXTURE)
def test_view_own_app_tokens_in_less_detail(
    user_id, cookies, client_v2, inserted_projects_v2, inserted_app_tokens, freezer
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
                "created_at": get_timestamp_str(datetime.now(timezone.utc)),
            }
            for v in [TEST_APP_TOKEN_DICT, TEST_NO_QPU_APP_TOKEN_DICT]
            + inserted_app_tokens
            if str(v["user_id"]) == user_id
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": expected_data}


@pytest.mark.parametrize("user_id, cookies, token", _MY_TOKENS_REQUESTS)
def test_view_my_app_token_in_less_detail(
    user_id,
    cookies,
    token,
    client_v2,
    inserted_projects_v2,
    inserted_app_tokens,
    freezer,
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
            "created_at": get_timestamp_str(datetime.now(timezone.utc)),
        }

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("user_id, cookies, token", _OTHERS_TOKENS_REQUESTS)
def test_view_others_tokens_is_not_allowed(
    user_id,
    cookies,
    token,
    client_v2,
    inserted_projects_v2,
    inserted_app_tokens,
    freezer,
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


@pytest.mark.parametrize("token", APP_TOKEN_LIST)
def test_extend_own_token_lifespan(
    db,
    token,
    client_v2,
    inserted_projects_v2,
    inserted_app_tokens,
    freezer,
):
    """PUT at /v2/me/tokens/{token_id}, user can update an app token for project they are attached to"""
    lifespan_secs = randint(1000, 300000)
    user_id = token["user_id"]
    cookies = {"some-cookie": get_jwt_token(user_id, ttl=lifespan_secs)}
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=lifespan_secs)
    payload = {
        "lifespan_seconds": 0,
        "title": "foo bar",
        "created_at": "1997-11-25T14:25:47.239Z",
        "id": "anot-p",
        "expires_at": get_timestamp_str(expires_at),
        "project_ext_id": "a-certain-proj",
    }
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        token_id = token["_id"]
        url = f"/v2/me/tokens/{token_id}"

        original_token = get_db_record(db, AppToken, token_id)
        response = client.put(url, cookies=cookies, json=payload)

        got = response.json()
        got["lifespan_seconds"] = round(got["lifespan_seconds"])
        expected_response = {
            "id": token_id,
            "project_ext_id": token["project_ext_id"],
            "title": token["title"],
            "lifespan_seconds": lifespan_secs,
            "created_at": get_timestamp_str(datetime.now(timezone.utc)),
        }
        token_after_update = get_db_record(db, AppToken, token_id)
        token_after_update["lifespan_seconds"] = round(
            token_after_update["lifespan_seconds"]
        )

        assert response.status_code == 200
        assert got == expected_response
        assert token_after_update == {
            **original_token,
            "lifespan_seconds": lifespan_secs,
        }


@pytest.mark.parametrize("token", APP_TOKEN_LIST)
def test_extend_own_expired_token_lifespan(
    db,
    token,
    client_v2,
    inserted_projects_v2,
    app_tokens_with_timestamps,
):
    """Updating expired app tokens raises 404 HTTP error"""
    lifespan_secs = randint(1000, 300000)
    user_id = token["user_id"]
    app_token_ttl = token["lifespan_seconds"]
    cookies = {"some-cookie": get_jwt_token(user_id, ttl=app_token_ttl + lifespan_secs)}
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=lifespan_secs)
    payload = {
        "lifespan_seconds": lifespan_secs + 10000,
        "title": "foo bar",
        "created_at": "1997-11-25T14:25:47.239Z",
        "id": "anot-p",
        "expires_at": expires_at.isoformat("T"),
        "project_ext_id": "a-certain-proj",
    }

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        token_id = token["_id"]
        url = f"/v2/me/tokens/{token_id}"
        original_token = get_db_record(db, AppToken, token_id)
        app_token_ttl = token["lifespan_seconds"]

        # shift back the created_at date to a time that would make this token expired
        new_created_at = datetime.now(timezone.utc) - timedelta(
            seconds=app_token_ttl + 1
        )
        update_db_record(
            db,
            AppToken,
            token_id,
            update={"$set": {"created_at": new_created_at.isoformat(sep="T")}},
        )

        response = client.put(url, cookies=cookies, json=payload)
        token_after_request = get_db_record(db, AppToken, token_id)

        got = response.json()
        expected = {"detail": "Not Found"}

        assert response.status_code == 404
        assert got == expected
        assert original_token is not None
        assert token_after_request is None


@pytest.mark.parametrize("app_token", APP_TOKEN_LIST)
def test_expired_app_token_fails(
    db, app_token, client_v2, inserted_projects_v2, app_tokens_with_timestamps
):
    """Expired app tokens raise 401 HTTP error"""
    token_id = app_token["_id"]
    app_token_ttl = app_token["lifespan_seconds"]
    cookies = {"some-token": app_token["token"]}

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        # shift back the created_at date to a time that would make this token expired
        new_created_at = datetime.now(timezone.utc) - timedelta(
            seconds=app_token_ttl + 1
        )
        update_db_record(
            db,
            AppToken,
            token_id,
            update={"$set": {"created_at": new_created_at.isoformat(sep="T")}},
        )

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
            "detail": f"{float(project['qpu_seconds'])} QPU seconds left on project {project['ext_id']}"
        }

        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("user_id, cookies", _USER_ID_COOKIES_FIXTURE)
def test_read_all_my_jobs(db, client_v2, user_id, cookies):
    """Get to /v2/me/jobs returns the jobs for the current user"""
    # FIXME: the jobs need a user_id property on them
    insert_in_collection(
        database=db, collection_name=_JOBS_COLLECTION, data=_JOBS_LIST_IN_DB
    )

    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get(f"/v2/me/jobs", cookies=cookies)
        got = order_by(response.json(), field="job_id")
        expected = order_by(
            [
                job
                for job in _JOBS_LIST_AS_RESPONSES
                if "user_id" in job and job["user_id"] == user_id
            ],
            field="job_id",
        )

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("user_id, cookies, project", _MY_PROJECT_REQUESTS)
def test_read_all_my_jobs_of_given_project(db, client_v2, user_id, cookies, project):
    """Get to /v2/me/jobs returns the jobs for the current user for the given project"""
    insert_in_collection(
        database=db, collection_name=_JOBS_COLLECTION, data=_JOBS_LIST_IN_DB
    )

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
                for job in _JOBS_LIST_AS_RESPONSES
                if "user_id" in job
                and job["user_id"] == user_id
                and job["project_id"] == project_id
            ],
            field="job_id",
        )

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("user, cookies", _MY_USER_INFO_REQUESTS)
def test_view_my_user_info(user, cookies, client_v2):
    """Any user can view only their own single user information at /v2/me"""
    # using context manager to ensure on_startup runs
    with client_v2 as client:
        response = client.get("/v2/me", cookies=cookies)

        raw_data = response.json()
        got = {**raw_data, "roles": sorted(raw_data.get("roles", []))}
        expected = {
            "id": str(user["_id"]),
            "email": user["email"],
            "is_active": user.get("is_active", True),
            "is_verified": user.get("is_verified", False),
            "is_superuser": user.get("is_superuser", False),
            "roles": sorted(user.get("roles", [])),
        }

        assert response.status_code == 200
        assert got == expected

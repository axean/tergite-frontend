"""Integration tests for the auth router"""
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
import pytest
from pytest_lazyfixture import lazy_fixture

from services.auth import AppToken, Project
from services.auth.projects.dtos import DeletedProject
from tests._utils.auth import (
    TEST_APP_TOKEN_DICT,
    TEST_NO_QPU_APP_TOKEN_DICT,
    TEST_NO_QPU_PROJECT_DICT,
    TEST_PROJECT_DICT,
    TEST_PROJECT_ID,
    TEST_SUPERUSER_EMAIL,
    TEST_SUPERUSER_ID,
    TEST_USER_EMAIL,
    TEST_USER_ID,
    get_db_record,
    is_valid_jwt,
)
from tests._utils.date_time import get_timestamp_str
from tests._utils.fixtures import load_json_fixture
from tests._utils.records import prune
from tests.conftest import (
    APP_TOKEN_LIST,
    PROJECT_LIST,
    TEST_NEXT_COOKIE_URL,
    get_auth_header,
    get_unauthorized_app_token_post,
)

_PROJECT_CREATE_LIST = load_json_fixture("project_create_list.json")
_PROJECT_UPDATE_LIST = load_json_fixture("project_update_list.json")
_USER_EMAIL_INDEX = {
    TEST_SUPERUSER_EMAIL: TEST_SUPERUSER_ID,
    TEST_USER_EMAIL: TEST_USER_ID,
}
_MY_PROJECT_REQUESTS = [
    (email, get_auth_header(_USER_EMAIL_INDEX[email]), project)
    for project in PROJECT_LIST
    for email in project["user_emails"]
]
_OTHERS_PROJECT_REQUESTS = [
    (email, get_auth_header(_USER_EMAIL_INDEX[email]), project)
    for project in PROJECT_LIST
    for email in [TEST_USER_EMAIL, TEST_SUPERUSER_EMAIL]
    if email not in project["user_emails"]
]
_USER_EMAIL_HEADERS_FIXTURE = [
    (TEST_USER_EMAIL, lazy_fixture("user_jwt_header")),
    (TEST_SUPERUSER_EMAIL, lazy_fixture("admin_jwt_header")),
]
_MY_TOKENS_REQUESTS = [
    (token["user_id"], get_auth_header(token["user_id"]), token)
    for token in APP_TOKEN_LIST
]
_OTHERS_TOKENS_REQUESTS = [
    (user_id, get_auth_header(user_id), token)
    for token in APP_TOKEN_LIST
    for user_id in [TEST_USER_ID, TEST_SUPERUSER_ID]
    if user_id != token["user_id"]
]

_AUTH_COOKIE_REGEX = re.compile(
    r"some-cookie=(.*); Domain=testserver; HttpOnly; Max-Age=3600; Path=/; SameSite=lax; Secure"
)

_EXTRA_PROJECT_DEFAULTS = {
    "user_ids": None,
    "source": "internal",
    "name": None,
    "description": None,
    "version": None,
    "admin_id": None,
    "resource_ids": [],
}


def test_is_auth_enabled(client):
    """When `auth.is_enabled=true` in config, application cannot be accessed without authentication"""
    with client as client:
        response = client.get("/")
        assert response.status_code == 401


def test_not_is_auth_enabled(no_auth_client):
    """When `auth.is_enabled=false` in config, application can be accessed without authentication"""
    with no_auth_client as client:
        response = client.get("/")
        assert response.status_code == 200


def test_admin_authorize(client):
    """Admin users can authorize at /auth/github/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/github/authorize")
        auth_url_pattern = r"^https\:\/\/github\.com\/login\/oauth\/authorize\?response_type\=code\&client_id\=test-tergite-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fgithub\%2Fcallback\&state=.*&scope=user\+user\%3Aemail$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_admin_cookie_authorize(client):
    """Admin users can authorize at /auth/app/github/authorize using cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/app/github/authorize?next={TEST_NEXT_COOKIE_URL}")
        auth_url_pattern = r"^https\:\/\/github\.com\/login\/oauth\/authorize\?response_type\=code\&client_id\=test-tergite-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fapp\%2Fgithub\%2Fcallback\&state=.*&scope=user\+user\%3Aemail$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_chalmers_authorize(client):
    """Chalmers' users can authorize at /auth/chalmers/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/chalmers/authorize")
        auth_url_pattern = r"^https\:\/\/login\.microsoftonline\.com\/common\/oauth2\/v.*\/authorize\?response_type\=code\&client_id\=test-chalmers-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fchalmers\%2Fcallback\&state=.*\&scope\=User\.Read\&response_mode\=query$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_chalmers_cookie_authorize(client):
    """Chalmers' users can authorize at /auth/app/chalmers/authorize using cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/app/chalmers/authorize?next={TEST_NEXT_COOKIE_URL}"
        )
        auth_url_pattern = r"^https\:\/\/login\.microsoftonline\.com\/common\/oauth2\/v.*\/authorize\?response_type\=code\&client_id\=test-chalmers-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fapp\%2Fchalmers\%2Fcallback\&state=.*\&scope\=User\.Read\&response_mode\=query$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_puhuri_authorize(client):
    """Puhuri users can authorize at /auth/puhuri/authorize"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/puhuri/authorize")
        auth_url_pattern = r"^https:\/\/proxy.acc.puhuri.eduteams.org\/OIDC\/authorization\?response_type\=code\&client_id\=test-puhuri-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fpuhuri\%2Fcallback\&state=.*\&scope\=openid\+email$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_puhuri_cookie_authorize(client):
    """Puhuri users can authorize at /auth/app/puhuri/authorize using cookies"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/app/puhuri/authorize?next={TEST_NEXT_COOKIE_URL}")
        auth_url_pattern = r"^https:\/\/proxy.acc.puhuri.eduteams.org\/OIDC\/authorization\?response_type\=code\&client_id\=test-puhuri-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fapp\%2Fpuhuri\%2Fcallback\&state=.*\&scope\=openid\+email$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_admin_callback(client, github_user, oauth_state):
    """Admin users can be redirected to /auth/github/callback to get their JWT tokens"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/github/callback?code=test&state={oauth_state}")

        got = response.json()
        assert response.status_code == 200
        assert is_valid_jwt(got["access_token"])


def test_admin_cookie_callback(client, github_user, cookie_oauth_state):
    """Admin users can be redirected to /auth/app/github/callback to get their JWT cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/app/github/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        assert response.headers["location"] == TEST_NEXT_COOKIE_URL
        assert response.status_code == 307
        access_token = _get_token_from_cookie(response)
        assert is_valid_jwt(access_token)


def test_admin_callback_disallowed_email(client, invalid_github_user, oauth_state):
    """Forbidden error raised when user email returned does not match Admin email regex"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/github/callback?code=test&state={oauth_state}")

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_admin_cookie_callback_disallowed_email(
    client, invalid_github_user, cookie_oauth_state
):
    """Forbidden error raised when user email returned does not match Admin email regex even with cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/app/github/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_chalmers_callback(client, chalmers_user, oauth_state):
    """Chalmers' users can be redirected to /auth/chalmers/callback to get their JWT tokens"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/chalmers/callback?code=test&state={oauth_state}")

        got = response.json()
        assert response.status_code == 200
        assert is_valid_jwt(got["access_token"])


def test_chalmers_cookie_callback(client, chalmers_user, cookie_oauth_state):
    """Chalmers' users can be redirected to /auth/app/chalmers/callback to get their cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/app/chalmers/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        assert response.headers["location"] == TEST_NEXT_COOKIE_URL
        assert response.status_code == 307
        access_token = _get_token_from_cookie(response)
        assert is_valid_jwt(access_token)


def test_chalmers_callback_disallowed_email(client, invalid_chalmers_user, oauth_state):
    """Forbidden error raised when user email returned does not match Chalmers email regex"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/chalmers/callback?code=test&state={oauth_state}")

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_chalmers_cookie_callback_disallowed_email(
    client, invalid_chalmers_user, cookie_oauth_state
):
    """Forbidden error raised when user email returned does not match Chalmers email regex even with cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/app/chalmers/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_puhuri_callback(client, puhuri_user, oauth_state):
    """Puhuri users can be redirected to /auth/puhuri/callback to get their JWT tokens"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/puhuri/callback?code=test&state={oauth_state}")

        got = response.json()
        assert response.status_code == 200
        assert is_valid_jwt(got["access_token"])


def test_puhuri_cookie_callback(client, puhuri_user, cookie_oauth_state):
    """Puhuri users can be redirected to /auth/app/puhuri/callback to get their cookies"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/app/puhuri/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        assert response.headers["location"] == TEST_NEXT_COOKIE_URL
        assert response.status_code == 307
        access_token = _get_token_from_cookie(response)
        assert is_valid_jwt(access_token)


def test_puhuri_callback_disallowed_email(client, invalid_puhuri_user, oauth_state):
    """Forbidden error raised when user email returned does not match Puhuri email regex"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/puhuri/callback?code=test&state={oauth_state}")

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_puhuri_cookie_callback_disallowed_email(
    client, invalid_puhuri_user, cookie_oauth_state
):
    """Forbidden error raised when user email returned does not match Puhuri email regex even with cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/app/puhuri/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


@pytest.mark.parametrize("project", _PROJECT_CREATE_LIST)
def test_admin_create_project(project, client, admin_jwt_header, freezer):
    """Admins can create projects at /auth/projects/"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post("/auth/projects", json=project, headers=admin_jwt_header)

        got = response.json()
        assert response.status_code == 201
        got.pop("id")
        now = get_timestamp_str(datetime.now(timezone.utc))
        expected = {**project, "is_active": True, "created_at": now, "updated_at": now}
        assert got == expected


@pytest.mark.parametrize("project", _PROJECT_CREATE_LIST)
def test_non_admin_cannot_create_project(project, client, user_jwt_header):
    """Non-admins cannot create projects at /auth/projects/"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post("/auth/projects", json=project, headers=user_jwt_header)

        got = response.json()
        assert response.status_code == 403
        expected = {"detail": "Forbidden"}
        assert got == expected


@pytest.mark.parametrize("payload", _PROJECT_UPDATE_LIST)
def test_admin_update_project(payload, client, admin_jwt_header, freezer):
    """Admins can create projects at /auth/projects/{id}"""
    created_at = get_timestamp_str(datetime.now(timezone.utc))
    # using context manager to ensure on_startup runs
    with client as client:
        post_body = _PROJECT_CREATE_LIST[0]
        response = client.post(
            "/auth/projects", json=post_body, headers=admin_jwt_header
        )
        assert response.status_code == 201
        project = response.json()
        project_id = project["id"]

        freezer.move_to("2024-05-20")
        updated_at = get_timestamp_str(datetime.now(timezone.utc))
        url = f"/auth/projects/{project_id}"
        response = client.patch(url, json=payload, headers=admin_jwt_header)

        expected = {
            "id": project_id,
            "ext_id": project["ext_id"],
            "is_active": True,
            "qpu_seconds": payload.get("qpu_seconds", project["qpu_seconds"]),
            "user_emails": payload.get("user_emails", project["user_emails"]),
            "created_at": created_at,
            "updated_at": updated_at,
        }

        got = response.json()
        assert response.status_code == 200
        assert got == expected
        assert updated_at != created_at


@pytest.mark.parametrize("payload", _PROJECT_UPDATE_LIST)
def test_non_admin_cannot_update_project(payload, client, user_jwt_header):
    """Non-admins cannot create projects at /auth/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        url = f"/auth/projects/{TEST_PROJECT_ID}"
        response = client.patch(url, json=payload, headers=user_jwt_header)

        got = response.json()
        assert response.status_code == 403
        expected = {"detail": "Forbidden"}
        assert got == expected


@pytest.mark.parametrize("project", PROJECT_LIST)
def test_admin_delete_project(
    project, db, client, inserted_project_ids, admin_jwt_header, freezer
):
    """Admins can delete projects at /auth/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        _id = project["_id"]
        original = get_db_record(db, Project, _id)
        assert original is not None

        url = f"/auth/projects/{_id}"
        response = client.delete(url, headers=admin_jwt_header)

        now = get_timestamp_str(datetime.now(timezone.utc))
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


@pytest.mark.parametrize("project", PROJECT_LIST)
def test_non_admin_cannot_delete_project(
    project, db, client, inserted_project_ids, user_jwt_header
):
    """Non-admins cannot delete projects at /auth/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        _id = project["_id"]
        assert get_db_record(db, Project, _id) is not None

        url = f"/auth/projects/{_id}"
        response = client.delete(url, headers=user_jwt_header)

        got = response.json()
        expected = {"detail": "Forbidden"}
        assert response.status_code == 403
        assert got == expected
        assert get_db_record(db, Project, _id) is not None


def test_admin_view_all_projects_in_detail(
    client, inserted_project_ids, admin_jwt_header, freezer
):
    """Admins can view projects at /auth/projects/ in full detail"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/projects", headers=admin_jwt_header)

        now = get_timestamp_str(datetime.now(timezone.utc))
        got = response.json()
        project_list = [
            {
                "id": str(item["_id"]),
                "ext_id": item["ext_id"],
                "qpu_seconds": item["qpu_seconds"],
                "is_active": item.get("is_active", True),
                "user_emails": item["user_emails"],
                "created_at": now,
                "updated_at": now,
            }
            for item in [TEST_PROJECT_DICT, TEST_NO_QPU_PROJECT_DICT] + PROJECT_LIST
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": project_list}


@pytest.mark.parametrize("project", PROJECT_LIST)
def test_non_admin_cannot_view_all_projects_in_detail(
    project, db, client, inserted_project_ids, user_jwt_header
):
    """Non-admins cannot view projects at /auth/projects"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/projects", headers=user_jwt_header)

        got = response.json()
        expected = {"detail": "Forbidden"}
        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("user_email, headers", _USER_EMAIL_HEADERS_FIXTURE)
def test_view_own_projects_in_less_detail(
    user_email, headers, client, inserted_project_ids, freezer
):
    """Any user can view only their own projects at /auth/me/projects/
    without user_emails"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/me/projects", headers=headers)

        now = get_timestamp_str(datetime.now(timezone.utc))
        got = response.json()
        project_list = [
            {
                "id": str(item["_id"]),
                "ext_id": item["ext_id"],
                "qpu_seconds": item["qpu_seconds"],
                "is_active": item.get("is_active", True),
                "created_at": now,
                "updated_at": now,
            }
            for item in [TEST_PROJECT_DICT, TEST_NO_QPU_PROJECT_DICT] + PROJECT_LIST
            if user_email in item["user_emails"]
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": project_list}


@pytest.mark.parametrize("project", PROJECT_LIST)
def test_admin_view_single_project_in_detail(
    project, client, inserted_projects, admin_jwt_header, freezer
):
    """Admins can view single project at /auth/projects/{id} in full detail"""
    # using context manager to ensure on_startup runs
    with client as client:
        _id = project["_id"]
        url = f"/auth/projects/{_id}"
        response = client.get(url, headers=admin_jwt_header)

        now = get_timestamp_str(datetime.now(timezone.utc))
        got = response.json()
        expected = {
            "id": _id,
            "ext_id": project["ext_id"],
            "qpu_seconds": project["qpu_seconds"],
            "is_active": project["is_active"],
            "user_emails": project["user_emails"],
            "created_at": now,
            "updated_at": now,
        }

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("project", PROJECT_LIST)
def test_non_admin_cannot_view_single_project_in_detail(
    project, db, client, inserted_project_ids, user_jwt_header
):
    """Non-admins cannot view single project at /auth/projects/{_id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        _id = project["_id"]
        url = f"/auth/projects/{_id}"
        response = client.get(url, headers=user_jwt_header)

        got = response.json()
        expected = {"detail": "Forbidden"}
        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("user_email, headers, project", _MY_PROJECT_REQUESTS)
def test_view_my_project_in_less_detail(
    user_email, headers, project, client, inserted_projects, freezer
):
    """Any user can view only their own single project at /auth/me/projects/{id}
    without user_emails"""
    # using context manager to ensure on_startup runs
    with client as client:
        project_id = project["_id"]
        url = f"/auth/me/projects/{project_id}"
        response = client.get(url, headers=headers)

        now = get_timestamp_str(datetime.now(timezone.utc))
        got = response.json()
        expected = {
            "id": project_id,
            "ext_id": project["ext_id"],
            "qpu_seconds": project["qpu_seconds"],
            "is_active": project["is_active"],
            "created_at": now,
            "updated_at": now,
        }

        assert response.status_code == 200
        assert got == expected


@pytest.mark.parametrize("user_email, headers, project", _OTHERS_PROJECT_REQUESTS)
def test_view_others_project_in_not_allowed(
    user_email, headers, project, client, inserted_projects
):
    """No user can view only other's projects at /auth/me/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        project_id = project["_id"]
        url = f"/auth/me/projects/{project_id}"
        response = client.get(url, headers=headers)

        got = response.json()
        expected = {"detail": "the project does not exist."}

        assert response.status_code == 404
        assert got == expected


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_generate_app_token(payload, inserted_projects, client):
    """At /auth/me/app-tokens/, user can generate app token for project they are attached to"""
    headers = get_auth_header(payload["user_id"])

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post("/auth/me/app-tokens/", headers=headers, json=payload)

        got = response.json()

        assert response.status_code == 200
        assert isinstance(got["access_token"], str)
        assert len(got["access_token"]) > 12


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_unauthenticated_app_token_generation(payload, inserted_projects, client):
    """401 error raised at /auth/me/app-tokens/ when no user jwt is sent"""

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post("/auth/me/app-tokens/", json=payload)

        got = response.json()
        expected = {"detail": "Unauthorized"}
        assert response.status_code == 401
        assert got == expected


@pytest.mark.parametrize("body, headers", get_unauthorized_app_token_post())
def test_unauthorized_app_token_generation(body, headers, inserted_projects, client):
    """403 error raised at /auth/me/app-tokens/, for a project to which a user is not attached"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post("/auth/me/app-tokens/", headers=headers, json=body)

        got = response.json()
        expected = {"detail": "Forbidden"}
        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_destroy_app_token(payload, db, client, inserted_projects, inserted_app_tokens):
    """At /auth/me/app-tokens/{token}, user can destroy their own app token"""
    # using context manager to ensure on_startup runs
    with client as client:
        _id = payload["_id"]
        user_id = payload["user_id"]
        assert get_db_record(db, AppToken, _id) is not None

        url = f"/auth/me/app-tokens/{_id}"
        headers = get_auth_header(user_id)
        response = client.delete(url, headers=headers)

        assert response.status_code == 204
        assert get_db_record(db, AppToken, _id) is None


@pytest.mark.parametrize("payload", APP_TOKEN_LIST)
def test_unauthenticated_app_token_deletion(
    payload, db, client, inserted_projects, inserted_app_tokens
):
    """401 error raised at /auth/me/app-tokens/{token} if no JWT token is passed"""
    # using context manager to ensure on_startup runs
    with client as client:
        _id = payload["_id"]
        assert get_db_record(db, AppToken, _id) is not None

        url = f"/auth/me/app-tokens/{_id}"
        response = client.delete(url)
        got = response.json()
        expected = {"detail": "Unauthorized"}

        assert response.status_code == 401
        assert got == expected
        assert get_db_record(db, AppToken, _id) is not None


@pytest.mark.parametrize("payload, headers", get_unauthorized_app_token_post())
def test_unauthorized_app_token_deletion(
    payload, headers, db, client, inserted_projects, inserted_app_tokens
):
    """403 error raised at /auth/me/app-tokens/{)id}, for a project to which a user is not attached"""
    # using context manager to ensure on_startup runs
    with client as client:
        _id = payload["_id"]
        url = f"/auth/me/app-tokens/{_id}"
        response = client.delete(url, headers=headers)

        got = response.json()
        expected = {"detail": "app token does not exist or is expired."}
        assert response.status_code == 403
        assert got == expected


@pytest.mark.parametrize("user_email, headers", _USER_EMAIL_HEADERS_FIXTURE)
def test_view_own_app_tokens_in_less_detail(
    user_email, headers, client, inserted_projects, inserted_app_tokens, freezer
):
    """At /auth/me/app-tokens/, user can view their own app tokens
    without the token itself displayed"""
    # using context manager to ensure on_startup runs
    with client as client:
        user_id = _USER_EMAIL_INDEX[user_email]
        headers = get_auth_header(user_id)
        response = client.get("/auth/me/app-tokens/", headers=headers)

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


@pytest.mark.parametrize("user_id, headers, token", _MY_TOKENS_REQUESTS)
def test_view_my_app_token_in_less_detail(
    user_id, headers, token, client, inserted_projects, inserted_app_tokens, freezer
):
    """Any user can view only their own single app token at /auth/me/app-tokens/{id}
    without token itself displayed"""
    # using context manager to ensure on_startup runs
    with client as client:
        token_id = token["_id"]
        url = f"/auth/me/app-tokens/{token_id}"
        response = client.get(url, headers=headers)

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


@pytest.mark.parametrize("user_id, headers, token", _OTHERS_TOKENS_REQUESTS)
def test_view_others_tokens_in_not_allowed(
    user_id, headers, token, client, inserted_projects, inserted_app_tokens, freezer
):
    """No user can view only other's app tokens at /auth/me/app-tokens/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        token_id = token["_id"]
        url = f"/auth/me/app-tokens/{token_id}"
        response = client.get(url, headers=headers)

        got = response.json()
        expected = {"detail": "the token does not exist."}

        assert response.status_code == 404
        assert got == expected


@pytest.mark.parametrize("app_token", APP_TOKEN_LIST)
def test_expired_app_token_fails(
    app_token, client, inserted_projects, app_tokens_with_timestamps, freezer
):
    """Expired app tokens raise 401 HTTP error"""
    app_token_ttl = app_token["lifespan_seconds"]
    headers = {"Authorization": f"Bearer {app_token['token']}"}
    time_in_future = datetime.now(timezone.utc) + timedelta(seconds=app_token_ttl + 1)

    # using context manager to ensure on_startup runs
    with client as client:
        # shift time to the future after startup has run
        freezer.move_to(time_in_future.isoformat())

        response = client.get("/", headers=headers)

        got = response.json()
        expected = {"detail": "Unauthorized"}

        assert response.status_code == 401
        assert got == expected


@pytest.mark.parametrize("app_token", APP_TOKEN_LIST)
def test_app_token_of_unallocated_projects_fails(
    app_token, client, unallocated_projects, inserted_app_tokens
):
    """App tokens for projects with qpu_seconds <= 0 raise 403 HTTP error"""
    headers = {"Authorization": f"Bearer {app_token['token']}"}
    project = unallocated_projects[app_token["project_ext_id"]]

    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/", headers=headers)

        got = response.json()
        expected = {
            "detail": f"{project['qpu_seconds']} QPU seconds left on project {project['ext_id']}"
        }

        assert response.status_code == 403
        assert got == expected


def _get_token_from_cookie(resp: httpx.Response) -> Optional[str]:
    """Extracts the acces token from the cookie"""
    return _AUTH_COOKIE_REGEX.match(resp.headers["set-cookie"]).group(1)

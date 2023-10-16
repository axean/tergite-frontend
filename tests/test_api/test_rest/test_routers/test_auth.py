"""Integration tests for the auth router"""
import re

import pytest

from services.auth import AppToken, Project
from tests._utils.auth import (
    TEST_PROJECT_DICT,
    TEST_PROJECT_ID,
    get_db_record,
    is_valid_jwt,
)
from tests._utils.fixtures import load_json_fixture
from tests.test_api.test_rest.conftest import (
    APP_TOKEN_LIST,
    PROJECT_LIST,
    USER_ID_HEADERS_FIXTURE,
    get_auth_header,
    get_unauthorized_app_token_post,
)

_PROJECT_CREATE_LIST = load_json_fixture("project_create_list.json")
_PROJECT_UPDATE_LIST = load_json_fixture("project_update_list.json")


def test_admin_authorize(client):
    """Admin users can authorize at /auth/github/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/github/authorize")
        auth_url_pattern = "^https\:\/\/github\.com\/login\/oauth\/authorize\?response_type\=code\&client_id\=test-tergite-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fgithub\%2Fcallback\&state=.*&scope=user\+user\%3Aemail$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_chalmers_authorize(client):
    """Chalmers' users can authorize at /auth/chalmers/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/chalmers/authorize")
        auth_url_pattern = "^https\:\/\/login\.microsoftonline\.com\/common\/oauth2\/v.*\/authorize\?response_type\=code\&client_id\=test-chalmers-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fchalmers\%2Fcallback\&state=.*\&scope\=User\.Read\&response_mode\=query$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_puhuri_authorize(client):
    """Puhuri users can authorize at /auth/puhuri/authorize"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/puhuri/authorize")
        auth_url_pattern = "^https:\/\/proxy.acc.puhuri.eduteams.org\/OIDC\/authorization\?response_type\=code\&client_id\=test-puhuri-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fpuhuri\%2Fcallback\&state=.*\&scope\=openid\+email$"

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


def test_admin_callback_disallowed_email(client, invalid_github_user, oauth_state):
    """Forbidden error raised when user email returned does not match Admin email regex"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/github/callback?code=test&state={oauth_state}")

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


def test_chalmers_callback_disallowed_email(client, invalid_chalmers_user, oauth_state):
    """Forbidden error raised when user email returned does not match Chalmers email regex"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/chalmers/callback?code=test&state={oauth_state}")

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


def test_puhuri_callback_disallowed_email(client, invalid_puhuri_user, oauth_state):
    """Forbidden error raised when user email returned does not match Puhuri email regex"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/puhuri/callback?code=test&state={oauth_state}")

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


@pytest.mark.parametrize("project", _PROJECT_CREATE_LIST)
def test_admin_create_project(project, client, admin_jwt_header):
    """Admins can create projects at /auth/projects/"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post("/auth/projects", json=project, headers=admin_jwt_header)

        got = response.json()
        assert response.status_code == 201
        got.pop("id")
        expected = {**project, "is_active": True}
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
def test_admin_update_project(payload, client, admin_jwt_header):
    """Admins can create projects at /auth/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        url = f"/auth/projects/{TEST_PROJECT_ID}"
        response = client.patch(url, json=payload, headers=admin_jwt_header)
        expected = {
            "id": TEST_PROJECT_ID,
            "ext_id": TEST_PROJECT_DICT["ext_id"],
            "is_active": True,
            "qpu_seconds": payload.get("qpu_seconds", TEST_PROJECT_DICT["qpu_seconds"]),
            "user_ids": payload.get("user_ids", TEST_PROJECT_DICT["user_ids"]),
        }

        got = response.json()
        assert response.status_code == 200
        assert got == expected


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


def test_admin_delete_project(db, client, inserted_project_ids, admin_jwt_header):
    """Admins can delete projects at /auth/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        for _id in inserted_project_ids:
            assert get_db_record(db, Project, _id) is not None

            url = f"/auth/projects/{_id}"
            response = client.delete(url, headers=admin_jwt_header)

            assert response.status_code == 204
            assert get_db_record(db, Project, _id) is None


def test_non_admin_cannot_delete_project(client, user_jwt_header):
    """Non-admins cannot delete projects at /auth/projects/{id}"""
    # using context manager to ensure on_startup runs
    with client as client:
        url = f"/auth/projects/{TEST_PROJECT_ID}"
        response = client.delete(url, headers=user_jwt_header)

        got = response.json()
        assert response.status_code == 403
        expected = {"detail": "Forbidden"}
        assert got == expected


def test_admin_view_all_projects_in_detail(
    client, inserted_project_ids, admin_jwt_header
):
    """Admins can view projects at /auth/projects/ in full detail"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/projects", headers=admin_jwt_header)

        got = response.json()
        project_list = [
            {
                "id": str(item["_id"]),
                "ext_id": item["ext_id"],
                "qpu_seconds": item["qpu_seconds"],
                "is_active": item.get("is_active", True),
                "user_ids": item["user_ids"],
            }
            for item in [TEST_PROJECT_DICT] + PROJECT_LIST
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": project_list}


@pytest.mark.parametrize("user_id, headers", USER_ID_HEADERS_FIXTURE)
def test_view_own_projects_in_less_detail(
    user_id, headers, client, inserted_project_ids
):
    """Any user can view only their own projects at /auth/me/projects/
    without user_ids"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/me/projects", headers=headers)

        got = response.json()
        project_list = [
            {
                "id": str(item["_id"]),
                "ext_id": item["ext_id"],
                "qpu_seconds": item["qpu_seconds"],
                "is_active": item.get("is_active", True),
            }
            for item in [TEST_PROJECT_DICT] + PROJECT_LIST
            if user_id in item["user_ids"]
        ]

        assert response.status_code == 200
        assert got == {"skip": 0, "limit": None, "data": project_list}


def test_admin_view_single_project_in_detail(
    client, inserted_projects, admin_jwt_header
):
    """Admins can view single project at /auth/projects/{id} in full detail"""
    # using context manager to ensure on_startup runs
    with client as client:
        for _id, project in inserted_projects.items():
            url = f"/auth/projects/{_id}"
            response = client.get(url, headers=admin_jwt_header)

            got = response.json()
            expected = {
                "id": _id,
                "ext_id": project["ext_id"],
                "qpu_seconds": project["qpu_seconds"],
                "is_active": project["is_active"],
                "user_ids": project["user_ids"],
            }

            assert response.status_code == 200
            assert got == expected


@pytest.mark.parametrize("user_id, headers", USER_ID_HEADERS_FIXTURE)
def test_view_own_project_in_less_detail(user_id, headers, client, inserted_projects):
    """Any user can view only their own single project at /auth/me/projects/{id}
    without user_ids"""
    # using context manager to ensure on_startup runs
    with client as client:
        for _id, project in inserted_projects.items():
            url = f"/auth/me/projects/{_id}"
            response = client.get(url, headers=headers)

            got = response.json()
            if user_id in project["user_ids"]:
                expected_status = 200
                expected = {
                    "id": _id,
                    "ext_id": project["ext_id"],
                    "qpu_seconds": project["qpu_seconds"],
                    "is_active": project["is_active"],
                }
            else:
                expected_status = 404
                expected = {"detail": "the project does not exist."}

            assert response.status_code == expected_status
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
        token = payload["token"]
        assert get_db_record(db, AppToken, _id) is not None

        url = f"/auth/me/app-tokens/{token}"
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
        token = payload["token"]
        assert get_db_record(db, AppToken, _id) is not None

        url = f"/auth/me/app-tokens/{token}"
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
    """403 error raised at /auth/me/app-tokens/{token}, for a project to which a user is not attached"""
    # using context manager to ensure on_startup runs
    with client as client:
        token = payload["token"]
        url = f"/auth/me/app-tokens/{token}"
        response = client.delete(url, headers=headers)

        got = response.json()
        expected = {"detail": "app token does not exist or is expired."}
        assert response.status_code == 403
        assert got == expected


def test_view_own_app_token_in_less_detail():
    """At /auth/me/app-tokens/, user can view their own app tokens
    without the token itself displayed"""
    # using context manager to ensure on_startup runs
    pass


def test_expired_app_token_fails():
    """Expired app tokens raise 401 HTTP error"""
    # using context manager to ensure on_startup runs
    pass


def test_app_token_of_unallocated_projects_fails():
    """App tokens for projects with qpu_seconds <= 0 raise 403 HTTP error"""
    # using context manager to ensure on_startup runs
    pass

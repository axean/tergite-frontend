"""Integration tests for the auth router"""
import re

import pytest

from services.auth import Project
from tests._utils.auth import TEST_PROJECT_DICT, TEST_PROJECT_ID, get_db_record
from tests._utils.fixtures import load_json_fixture

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
    """Chalmers users can authorize at /auth/chalmers/authorize"""
    with client as client:
        response = client.get("/auth/chalmers/authorize")
        auth_url_pattern = "^https\:\/\/login\.microsoftonline\.com\/common\/oauth2\/v.*\/authorize\?response_type\=code\&client_id\=test-chalmers-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fchalmers\%2Fcallback\&state=.*\&scope\=User\.Read\&response_mode\=query$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_puhuri_authorize(client):
    """Puhuri users can authorize at /auth/puhuri/authorize"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    with client as client:
        response = client.get("/auth/puhuri/authorize")
        auth_url_pattern = "^https:\/\/proxy.acc.puhuri.eduteams.org\/OIDC\/authorization\?response_type\=code\&client_id\=test-puhuri-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fpuhuri\%2Fcallback\&state=.*\&scope\=openid\+email$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


@pytest.mark.parametrize("project", _PROJECT_CREATE_LIST)
def test_admin_create_project(project, client, admin_jwt_header):
    """Admins can create projects at /auth/projects/"""
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
    with client as client:
        response = client.post("/auth/projects", json=project, headers=user_jwt_header)

        got = response.json()
        assert response.status_code == 403
        expected = {"detail": "Forbidden"}
        assert got == expected


@pytest.mark.parametrize("payload", _PROJECT_UPDATE_LIST)
def test_admin_update_project(payload, client, admin_jwt_header):
    """Admins can create projects at /auth/projects/{id}"""
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
    with client as client:
        url = f"/auth/projects/{TEST_PROJECT_ID}"
        response = client.patch(url, json=payload, headers=user_jwt_header)

        got = response.json()
        assert response.status_code == 403
        expected = {"detail": "Forbidden"}
        assert got == expected


def test_admin_delete_project(db, client, inserted_project_ids, admin_jwt_header):
    """Admins can delete projects at /auth/projects/{id}"""
    with client as client:
        for _id in inserted_project_ids:
            assert get_db_record(db, Project, _id) is not None

            url = f"/auth/projects/{_id}"
            response = client.delete(url, headers=admin_jwt_header)

            assert response.status_code == 204
            assert get_db_record(db, Project, _id) is None


def test_non_admin_cannot_delete_project(client, user_jwt_header):
    """Non-admins cannot delete projects at /auth/projects/{id}"""
    with client as client:
        url = f"/auth/projects/{TEST_PROJECT_ID}"
        response = client.delete(url, headers=user_jwt_header)

        got = response.json()
        assert response.status_code == 403
        expected = {"detail": "Forbidden"}
        assert got == expected


def test_admin_view_all_projects_in_detail():
    """Admins can view projects at /auth/projects/ in full detail"""
    pass


def test_non_admin_view_own_projects_in_less_detail():
    """Non admins can view only their own projects at /auth/me/projects/
    without user_ids"""
    pass


def test_admin_view_single_project_in_detail():
    """Admins can view single project at /auth/projects/{id} in full detail"""
    pass


def test_non_admin_view_own_project_in_less_detail():
    """Non admins can view only their own single project at /auth/me/projects/{id}
    without user_ids"""
    pass


def test_generate_app_token():
    """At /auth/me/app-tokens/, user can generate app token for project they are attached to"""
    pass


def test_destroy_app_token():
    """At /auth/me/app-tokens/{token}, user can destroy their own app token"""
    pass


def test_view_own_app_token_in_less_detail():
    """At /auth/me/app-tokens/, user can view their own app tokens
    without the token itself displayed"""
    pass


def test_expired_app_token_fails():
    """Expired app tokens raise 401 HTTP error"""
    pass


def test_app_token_of_unallocated_projects_fails():
    """App tokens for projects with qpu_seconds <= 0 raise 403 HTTP error"""
    pass

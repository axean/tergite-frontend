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
"""Integration tests for the auth router"""
import re
from typing import Optional

import httpx
import pytest
from pytest_lazyfixture import lazy_fixture

from tests._utils.auth import (
    TEST_SUPERUSER_EMAIL,
    TEST_USER_EMAIL,
    is_valid_jwt,
)
from tests.conftest import TEST_NEXT_COOKIE_URL

_USER_EMAIL_COOKIES_FIXTURE = [
    (TEST_USER_EMAIL, lazy_fixture("user_jwt_cookie")),
    (TEST_SUPERUSER_EMAIL, lazy_fixture("admin_jwt_cookie")),
]

_AUTH_PROVIDER_DOMAIN_PAIRS = [
    (
        "example.com",
        [
            dict(
                name="github",
                url="http://testserver/auth/github/auto-authorize",
            ),
            dict(
                name="gitlab",
                url="http://testserver/auth/gitlab/auto-authorize",
            ),
        ],
    ),
    (
        "example.se",
        [
            dict(
                name="puhuri",
                url="http://testserver/auth/puhuri/auto-authorize",
            )
        ],
    ),
    (
        "chalmers.com",
        [
            dict(
                name="chalmers",
                url="http://testserver/auth/chalmers/auto-authorize",
            )
        ],
    ),
]

_AUTH_COOKIE_REGEX = re.compile(
    r"some-cookie=(.*); Domain=testserver; HttpOnly; Max-Age=3600; Path=/; SameSite=lax; Secure"
)
_STALE_AUTH_COOKIE_REGEX = re.compile(
    r'some-cookie=""; Domain=testserver; HttpOnly; Max-Age=0; Path=/; SameSite=lax; Secure'
)


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


def test_github_cookie_authorize(client):
    """github users can authorize at /auth/github/authorize using cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/github/authorize?next={TEST_NEXT_COOKIE_URL}")
        auth_url_pattern = r"^https\:\/\/github\.com\/login\/oauth\/authorize\?response_type\=code\&client_id\=test-tergite-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fgithub\%2Fcallback\&state=.*&scope=user\+user\%3Aemail$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_github_cookie_auto_authorize(client):
    """github users can automatically be redirected to auth url at /auth/github/auto-authorize using cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/github/auto-authorize?next={TEST_NEXT_COOKIE_URL}",
            follow_redirects=False,
        )
        auth_url_pattern = r"^https\:\/\/github\.com\/login\/oauth\/authorize\?response_type\=code\&client_id\=test-tergite-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fgithub\%2Fcallback\&state=.*&scope=user\+user\%3Aemail$"

        got = response.headers["location"]
        assert response.status_code == 307
        assert re.match(auth_url_pattern, got) is not None


def test_chalmers_cookie_authorize(client):
    """Chalmers' users can authorize at /auth/chalmers/authorize using cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/chalmers/authorize?next={TEST_NEXT_COOKIE_URL}")
        auth_url_pattern = r"^https\:\/\/login\.microsoftonline\.com\/common\/oauth2\/v.*\/authorize\?response_type\=code\&client_id\=test-chalmers-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fchalmers\%2Fcallback\&state=.*\&scope\=User\.Read\&response_mode\=query$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_chalmers_cookie_auto_authorize(client):
    """Chalmers' users can be automatically redirected at /auth/chalmers/auto-authorize using cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/chalmers/auto-authorize?next={TEST_NEXT_COOKIE_URL}",
            follow_redirects=False,
        )
        auth_url_pattern = r"^https\:\/\/login\.microsoftonline\.com\/common\/oauth2\/v.*\/authorize\?response_type\=code\&client_id\=test-chalmers-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fchalmers\%2Fcallback\&state=.*\&scope\=User\.Read\&response_mode\=query$"

        got = response.headers["location"]
        assert response.status_code == 307
        assert re.match(auth_url_pattern, got) is not None


def test_puhuri_cookie_authorize(client):
    """Puhuri users can authorize at /auth/puhuri/authorize using cookies"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(f"/auth/puhuri/authorize?next={TEST_NEXT_COOKIE_URL}")
        auth_url_pattern = r"^https:\/\/proxy.acc.puhuri.eduteams.org\/OIDC\/authorization\?response_type\=code\&client_id\=test-puhuri-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fpuhuri\%2Fcallback\&state=.*\&scope\=openid\+email$"

        got = response.json()
        assert response.status_code == 200
        assert re.match(auth_url_pattern, got["authorization_url"]) is not None


def test_puhuri_cookie_auto_authorize(client):
    """Puhuri users can automatically be redirected at /auth/puhuri/auto-authorize using cookies"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/puhuri/auto-authorize?next={TEST_NEXT_COOKIE_URL}",
            follow_redirects=False,
        )
        auth_url_pattern = r"^https:\/\/proxy.acc.puhuri.eduteams.org\/OIDC\/authorization\?response_type\=code\&client_id\=test-puhuri-client-id\&redirect_uri\=http\%3A\%2F\%2Ftestserver\%2Fauth\%2Fpuhuri\%2Fcallback\&state=.*\&scope\=openid\+email$"

        got = response.headers["location"]
        assert response.status_code == 307
        assert re.match(auth_url_pattern, got) is not None


def test_github_cookie_callback(client, github_user, cookie_oauth_state):
    """Github users can be redirected to /auth/github/callback to get their JWT cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/github/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        assert response.headers["location"] == TEST_NEXT_COOKIE_URL
        assert response.status_code == 307
        access_token = _get_token_from_cookie(response)
        assert is_valid_jwt(access_token)


def test_github_cookie_callback_disallowed_email(
    client, invalid_github_user, cookie_oauth_state
):
    """Forbidden error raised when user email returned does not match Github user email regex even with cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/github/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_chalmers_cookie_callback(client, chalmers_user, cookie_oauth_state):
    """Chalmers' users can be redirected to /auth/app/chalmers/callback to get their cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/chalmers/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        assert response.headers["location"] == TEST_NEXT_COOKIE_URL
        assert response.status_code == 307
        access_token = _get_token_from_cookie(response)
        assert is_valid_jwt(access_token)


def test_chalmers_cookie_callback_disallowed_email(
    client, invalid_chalmers_user, cookie_oauth_state
):
    """Forbidden error raised when user email returned does not match Chalmers email regex even with cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/chalmers/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_puhuri_cookie_callback(client, puhuri_user, cookie_oauth_state):
    """Puhuri users can be redirected to /auth/puhuri/callback to get their cookies"""
    """Any random partner users can authorize at /auth/{partner}/authorize"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/puhuri/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        assert response.headers["location"] == TEST_NEXT_COOKIE_URL
        assert response.status_code == 307
        access_token = _get_token_from_cookie(response)
        assert is_valid_jwt(access_token)


def test_puhuri_cookie_callback_disallowed_email(
    client, invalid_puhuri_user, cookie_oauth_state
):
    """Forbidden error raised when user email returned does not match Puhuri email regex even with cookies"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get(
            f"/auth/puhuri/callback?code=test&state={cookie_oauth_state}",
            follow_redirects=False,
        )

        got = response.json()
        assert response.status_code == 403
        assert got == {"detail": "user not permitted"}


def test_login(client):
    """POST to /auth/login returns 404"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post(f"/auth/login", json={})

        got = response.json()
        assert response.status_code == 404
        assert got == {"detail": "Not Found"}


@pytest.mark.parametrize("user_email, cookies", _USER_EMAIL_COOKIES_FIXTURE)
def test_logout(
    user_email, cookies, client, inserted_projects, inserted_app_tokens, freezer
):
    """POST /auth/logout/ logs out current user"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.post("/auth/logout", cookies=cookies)
        set_cookie_header = response.headers["set-cookie"]
        assert _STALE_AUTH_COOKIE_REGEX.match(set_cookie_header) is not None
        assert response.json() == {"message": "logged out"}


@pytest.mark.parametrize("email_domain, expected", _AUTH_PROVIDER_DOMAIN_PAIRS)
def test_get_auth_providers(client, email_domain, expected):
    """GET /auth/providers returns the auth providers for the given email domain"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/providers/", params={"domain": email_domain})
        got = response.json()
        assert got == expected


@pytest.mark.parametrize("email_domain", ["s.com", "some.es", "blablah.foo"])
def test_get_auth_providers_unsupported_domains(client, email_domain):
    """GET /auth/providers returns 404 for unsupported email domain"""
    # using context manager to ensure on_startup runs
    with client as client:
        response = client.get("/auth/providers/", params={"domain": email_domain})
        got = response.json()
        assert got == {"detail": "Not Found"}
        assert response.status_code == 404


def _get_token_from_cookie(resp: httpx.Response) -> Optional[str]:
    """Extracts the access token from the cookie"""
    return _AUTH_COOKIE_REGEX.match(resp.headers["set-cookie"]).group(1)

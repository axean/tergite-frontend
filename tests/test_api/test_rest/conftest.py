from tests._utils.env import (
    TEST_DB_NAME,
    TEST_JWT_SECRET,
    TEST_MONGODB_URL,
    TEST_PUHURI_CONFIG_ENDPOINT,
    setup_test_env,
)

# Set up the test environment before any other imports are made
setup_test_env()

from typing import Dict, List

import httpx
import pymongo.database
import pytest
from beanie import PydanticObjectId
from fastapi.testclient import TestClient
from fastapi_users.router.oauth import generate_state_token
from httpx_oauth.clients import github, microsoft

from tests._utils.auth import (
    INVALID_CHALMERS_PROFILE,
    INVALID_GITHUB_PROFILE,
    INVALID_PUHURI_PROFILE,
    TEST_APP_TOKEN_STRING,
    TEST_CHALMERS_PROFILE,
    TEST_CHALMERS_TOKEN_RESP,
    TEST_GITHUB_PROFILE,
    TEST_GITHUB_TOKEN_RESP,
    TEST_PUHURI_PROFILE,
    TEST_PUHURI_TOKEN_RESP,
    TEST_SUPERUSER_ID,
    TEST_USER_ID,
    get_jwt_token,
    init_test_auth,
    insert_if_not_exist,
)
from tests._utils.fixtures import load_json_fixture

_PUHURI_OPENID_CONFIG = load_json_fixture("puhuri_openid_config.json")
_PROJECT_LIST = load_json_fixture("project_list.json")


@pytest.fixture
def mock_puhuri_openid(respx_mock):
    """Mock of the puhuri openid config url"""
    respx_mock.get(TEST_PUHURI_CONFIG_ENDPOINT).mock(
        return_value=httpx.Response(status_code=200, json=_PUHURI_OPENID_CONFIG)
    )
    yield respx_mock


@pytest.fixture
def db(mock_puhuri_openid) -> pymongo.database.Database:
    """The mongo db instance for testing"""
    mongo_client = pymongo.MongoClient(TEST_MONGODB_URL)
    database = mongo_client[TEST_DB_NAME]

    yield database
    # clean up
    mongo_client.drop_database(TEST_DB_NAME)


@pytest.fixture
def app_token_header() -> Dict[str, str]:
    """the auth header for the client when app tokens are used"""
    yield {"Authorization": f"Bearer {TEST_APP_TOKEN_STRING}"}


@pytest.fixture
def user_jwt_header() -> Dict[str, str]:
    """the auth header for the client when JWT of user is used"""
    token = get_jwt_token(TEST_USER_ID)
    yield {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_jwt_header() -> Dict[str, str]:
    """the auth header for the client when JWT of an admin is used"""
    token = get_jwt_token(TEST_SUPERUSER_ID)
    yield {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client(db) -> TestClient:
    """A test client for fast api"""
    from rest_api import app

    init_test_auth(db)
    yield TestClient(app)


@pytest.fixture
def inserted_project_ids(db) -> List[str]:
    """A list of inserted project ids"""
    from services.auth import Project

    ids = []
    for item in _PROJECT_LIST:
        ids.append(item["_id"])
        item["_id"] = PydanticObjectId(item["_id"])
        insert_if_not_exist(db, Project, item)

    yield ids


@pytest.fixture
def oauth_state() -> str:
    """The state to use to make oauth2 requests"""
    yield generate_state_token({}, secret=TEST_JWT_SECRET)


@pytest.fixture
def puhuri_user(respx_mock):
    """A valid puhuri user with right email format"""
    respx_mock.get(_PUHURI_OPENID_CONFIG["userinfo_endpoint"]).mock(
        return_value=httpx.Response(status_code=200, json=TEST_PUHURI_PROFILE)
    )

    respx_mock.post(_PUHURI_OPENID_CONFIG["token_endpoint"]).mock(
        return_value=httpx.Response(status_code=200, json=TEST_PUHURI_TOKEN_RESP)
    )

    yield respx_mock


@pytest.fixture
def invalid_puhuri_user(respx_mock):
    """An invalid puhuri user with wrong email format"""
    respx_mock.get(_PUHURI_OPENID_CONFIG["userinfo_endpoint"]).mock(
        return_value=httpx.Response(status_code=200, json=INVALID_PUHURI_PROFILE)
    )

    respx_mock.post(_PUHURI_OPENID_CONFIG["token_endpoint"]).mock(
        return_value=httpx.Response(status_code=200, json=TEST_PUHURI_TOKEN_RESP)
    )

    yield respx_mock


@pytest.fixture
def github_user(respx_mock):
    """A valid admin user with right email format"""
    respx_mock.get(github.PROFILE_ENDPOINT).mock(
        return_value=httpx.Response(status_code=200, json=TEST_GITHUB_PROFILE)
    )

    respx_mock.post(github.ACCESS_TOKEN_ENDPOINT).mock(
        return_value=httpx.Response(status_code=200, json=TEST_GITHUB_TOKEN_RESP)
    )

    yield respx_mock


@pytest.fixture
def invalid_github_user(respx_mock):
    """An invalid admin user with wrong email format"""
    respx_mock.get(github.PROFILE_ENDPOINT).mock(
        return_value=httpx.Response(status_code=200, json=INVALID_GITHUB_PROFILE)
    )

    respx_mock.post(github.ACCESS_TOKEN_ENDPOINT).mock(
        return_value=httpx.Response(status_code=200, json=TEST_GITHUB_TOKEN_RESP)
    )

    yield respx_mock


@pytest.fixture
def chalmers_user(respx_mock):
    """A valid Chalmers' user with right email format"""
    respx_mock.get(microsoft.PROFILE_ENDPOINT).mock(
        return_value=httpx.Response(status_code=200, json=TEST_CHALMERS_PROFILE)
    )

    access_token_url = microsoft.ACCESS_TOKEN_ENDPOINT.format(tenant="common")
    respx_mock.post(access_token_url).mock(
        return_value=httpx.Response(status_code=200, json=TEST_CHALMERS_TOKEN_RESP)
    )

    yield respx_mock


@pytest.fixture
def invalid_chalmers_user(respx_mock):
    """An invalid Chalmers' user with wrong email format"""
    respx_mock.get(microsoft.PROFILE_ENDPOINT).mock(
        return_value=httpx.Response(status_code=200, json=INVALID_CHALMERS_PROFILE)
    )

    access_token_url = microsoft.ACCESS_TOKEN_ENDPOINT.format(tenant="common")
    respx_mock.post(access_token_url).mock(
        return_value=httpx.Response(status_code=200, json=TEST_CHALMERS_TOKEN_RESP)
    )

    yield respx_mock

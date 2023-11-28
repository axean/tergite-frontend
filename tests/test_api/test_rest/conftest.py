from tests._utils.env import (
    TEST_DB_NAME,
    TEST_JWT_SECRET,
    TEST_MONGODB_URL,
    TEST_PUHURI_CONFIG_ENDPOINT,
    setup_test_env,
)

# Set up the test environment before any other imports are made
setup_test_env()

import importlib
import random
from datetime import datetime, timezone
from os import environ
from typing import Any, Dict, List

import httpx
import pymongo.database
import pytest
from beanie import PydanticObjectId
from fastapi.testclient import TestClient
from fastapi_users.router.oauth import generate_state_token
from httpx_oauth.clients import github, microsoft

import settings
from tests._utils.auth import (
    INVALID_CHALMERS_PROFILE,
    INVALID_GITHUB_PROFILE,
    INVALID_PUHURI_PROFILE,
    TEST_APP_TOKEN_STRING,
    TEST_CHALMERS_PROFILE,
    TEST_CHALMERS_TOKEN_RESP,
    TEST_GITHUB_PROFILE,
    TEST_GITHUB_TOKEN_RESP,
    TEST_NO_QPU_APP_TOKEN_STRING,
    TEST_PUHURI_PROFILE,
    TEST_PUHURI_TOKEN_RESP,
    TEST_SUPERUSER_EMAIL,
    TEST_SUPERUSER_ID,
    TEST_SYSTEM_USER_APP_TOKEN_STRING,
    TEST_SYSTEM_USER_ID,
    TEST_USER_EMAIL,
    TEST_USER_ID,
    get_jwt_token,
    init_test_auth,
    insert_if_not_exist,
)
from tests._utils.fixtures import load_json_fixture

_PUHURI_OPENID_CONFIG = load_json_fixture("puhuri_openid_config.json")
PROJECT_LIST = load_json_fixture("project_list.json")
APP_TOKEN_LIST = load_json_fixture("app_token_list.json")
TEST_NEXT_COOKIE_URL = "https://testserver/"


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
def no_qpu_app_token_header() -> Dict[str, str]:
    """the auth header for the client when the project has negative qpu seconds"""
    yield {"Authorization": f"Bearer {TEST_NO_QPU_APP_TOKEN_STRING}"}


@pytest.fixture
def system_app_token_header() -> Dict[str, str]:
    """the auth header for the client when the user is a system user"""
    yield {"Authorization": f"Bearer {TEST_SYSTEM_USER_APP_TOKEN_STRING}"}


@pytest.fixture
def user_jwt_header() -> Dict[str, str]:
    """the auth header for the client when JWT of user is used"""
    yield get_auth_header(TEST_USER_ID)


@pytest.fixture
def admin_jwt_header() -> Dict[str, str]:
    """the auth header for the client when JWT of an admin is used"""
    yield get_auth_header(TEST_SUPERUSER_ID)


@pytest.fixture
def client(db) -> TestClient:
    """A test client for fast api"""
    from api.rest import app

    init_test_auth(db)
    yield TestClient(app)


@pytest.fixture
def no_auth_client(db) -> TestClient:
    """A test client for fast api without auth"""
    environ["IS_AUTH_ENABLED"] = "False"
    importlib.reload(settings)
    from api.rest import app

    init_test_auth(db)
    yield TestClient(app)

    # reset
    environ["IS_AUTH_ENABLED"] = "True"
    importlib.reload(settings)


@pytest.fixture
def inserted_projects(db) -> Dict[str, Dict[str, Any]]:
    """A dictionary of inserted project"""
    from services.auth import Project

    projects = {}
    for item in PROJECT_LIST:
        projects[item["_id"]] = {**item}
        insert_if_not_exist(db, Project, {**item, "_id": PydanticObjectId(item["_id"])})

    yield projects


@pytest.fixture
def inserted_project_ids(inserted_projects) -> List[str]:
    """A list of inserted project ids"""
    yield list(inserted_projects.keys())


@pytest.fixture
def unallocated_projects(db) -> Dict[str, Dict[str, Any]]:
    """A dictionary of project with qpu_seconds less or equal to zero"""
    from services.auth import Project

    projects = {}
    for item in PROJECT_LIST:
        qpu_seconds = int(random.uniform(-54000, 0))
        projects[item["ext_id"]] = {**item, "qpu_seconds": qpu_seconds}
        insert_if_not_exist(
            db,
            Project,
            {**item, "_id": PydanticObjectId(item["_id"]), "qpu_seconds": qpu_seconds},
        )

    yield projects


@pytest.fixture
def app_tokens_with_timestamps(db) -> List[Dict[str, Any]]:
    """A list of inserted app tokens"""
    from services.auth import AppToken

    tokens = []
    for item in APP_TOKEN_LIST:
        created_at = datetime.now(timezone.utc)

        # ensure you don't mutate the original item in APP_TOKEN_LIST
        tokens.append({**item, "created_at": created_at})
        db_item = {
            **item,
            "_id": PydanticObjectId(item["_id"]),
            "user_id": PydanticObjectId(item["user_id"]),
            "created_at": created_at,
        }
        insert_if_not_exist(db, AppToken, db_item)

    yield tokens


@pytest.fixture
def inserted_app_tokens(db) -> List[Dict[str, Any]]:
    """A list of inserted app tokens"""
    from services.auth import AppToken

    tokens = []
    for item in APP_TOKEN_LIST:
        # ensure you don't mutate the original item in APP_TOKEN_LIST
        tokens.append({**item})
        db_item = {
            **item,
            "_id": PydanticObjectId(item["_id"]),
            "user_id": PydanticObjectId(item["user_id"]),
        }
        insert_if_not_exist(db, AppToken, db_item)

    yield tokens


@pytest.fixture
def oauth_state() -> str:
    """The state to use to make oauth2 requests"""
    yield generate_state_token({}, secret=TEST_JWT_SECRET)


@pytest.fixture
def cookie_oauth_state() -> str:
    """The state to use to make oauth2 requests when using cookies"""
    yield generate_state_token({"next": TEST_NEXT_COOKIE_URL}, secret=TEST_JWT_SECRET)


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


def get_auth_header(user_id: str) -> Dict[str, Any]:
    """Retrieves the authorization header for the given user_id"""
    return {"Authorization": f"Bearer {get_jwt_token(user_id)}"}


def get_unauthorized_app_token_post():
    """Returns the body and headers for unauthorized app token generation POST

    The auth header provided is for a user who does not have access
    to the given project
    """
    admin_only_projects = [
        project["ext_id"]
        for project in PROJECT_LIST
        if project["user_emails"] == [TEST_SUPERUSER_EMAIL]
    ]

    user_only_projects = [
        project["ext_id"]
        for project in PROJECT_LIST
        if project["user_emails"] == [TEST_USER_EMAIL]
    ]

    admin_only_post_data = [
        (body, get_auth_header(TEST_USER_ID))
        for body in APP_TOKEN_LIST
        if body["project_ext_id"] in admin_only_projects
    ]

    user_only_post_data = [
        (body, get_auth_header(TEST_SUPERUSER_ID))
        for body in APP_TOKEN_LIST
        if body["project_ext_id"] in user_only_projects
    ]

    return admin_only_post_data + user_only_post_data

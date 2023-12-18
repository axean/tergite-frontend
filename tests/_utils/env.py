from os import environ
from pathlib import Path

import tomli

from .fixtures import get_fixture_path

TEST_MONGODB_URL = "mongodb://localhost:27017"
TEST_BCC_URL = "http://localhost:8000"
TEST_DB_NAME = "testdb"
TEST_WS_PORT = 6534
TEST_MSS_PORT = 8002
# mongodb saves datetimes to only the millisecond precision
TEST_DATETIME_PRECISION = "milliseconds"
# auth
TEST_JWT_SECRET = "e8141bffc71337276986a6f93e33df3d214632f71f700f35d38311ce99ce"

TEST_AUTH_CONFIG_FILE = get_fixture_path("auth_config.test.toml")
TEST_NO_AUTH_CONFIG_FILE = get_fixture_path("no_auth_config.test.toml")
with Path(TEST_AUTH_CONFIG_FILE).open(mode="rb") as _oauth_conf_file:
    _OAUTH_CONFIG = tomli.load(_oauth_conf_file)


TEST_PUHURI_CONFIG_ENDPOINT = _OAUTH_CONFIG["clients"][2][
    "openid_configuration_endpoint"
]


def setup_test_env():
    """Sets up the test environment.

    It should be run before any imports
    """
    environ["APP_SETTINGS"] = "test"
    environ["DB_NAME"] = TEST_DB_NAME
    environ["TEST_DB_MACHINE_ROOT_URL"] = TEST_MONGODB_URL
    environ["TEST_BCC_MACHINE_ROOT_URL"] = TEST_BCC_URL
    environ["WS_PORT"] = f"{TEST_WS_PORT}"
    environ["MSS_PORT"] = f"{TEST_MSS_PORT}"
    environ["DATETIME_PRECISION"] = TEST_DATETIME_PRECISION

    environ["JWT_SECRET"] = TEST_JWT_SECRET
    environ["AUTH_CONFIG_FILE"] = TEST_AUTH_CONFIG_FILE

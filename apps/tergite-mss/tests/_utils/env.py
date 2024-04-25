# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

"""Test utilities for environment variables"""
from os import environ
from pathlib import Path
from typing import Dict, List, TypedDict

import tomli

from .fixtures import get_fixture_path

# TEST_MONGODB_URL = "mongodb://localhost:27017"
# TEST_BCC_URL = "http://localhost:8000"
# TEST_DB_NAME = "testdb"
# TEST_WS_PORT = 6534
# TEST_MSS_PORT = 8002
# # mongodb saves datetimes to only the millisecond precision
# TEST_DATETIME_PRECISION = "milliseconds"
# auth
# TEST_JWT_SECRET = "e8141bffc71337276986a6f93e33df3d214632f71f700f35d38311ce99ce"

TEST_CONFIG_FILE = get_fixture_path("config.test.toml")
TEST_PROD_NO_AUTH_CONFIG_FILE = get_fixture_path("prod_config_with_no_auth.test.toml")
TEST_NO_AUTH_CONFIG_FILE = get_fixture_path("config_with_no_auth.test.toml")
TEST_DISABLED_PUHURI_CONFIG_FILE = get_fixture_path("disabled_puhuri_config.test.toml")
with Path(TEST_CONFIG_FILE).open(mode="rb") as _oauth_conf_file:
    TEST_APP_CONFIG = tomli.load(_oauth_conf_file)


TEST_PUHURI_CONFIG_ENDPOINT = TEST_APP_CONFIG["auth"]["clients"][2][
    "openid_configuration_endpoint"
]
TEST_DB_NAME: str = TEST_APP_CONFIG["database"]["name"]
TEST_MONGODB_URL: str = TEST_APP_CONFIG["database"]["url"]
TEST_JWT_SECRET: str = TEST_APP_CONFIG["auth"]["jwt_secret"]
TEST_BACKENDS: List["BackendConfDict"] = TEST_APP_CONFIG["backends"]
TEST_BACKENDS_MAP: Dict[str, "BackendConfDict"] = {
    item["name"]: item for item in TEST_BACKENDS
}
TEST_PUHURI_POLL_INTERVAL: int = TEST_APP_CONFIG["puhuri"]["poll_interval"]

# Puhuri sync
# TEST_IS_PUHURI_SYNC_ENABLED = True
# TEST_PUHURI_POLL_INTERVAL = 2
# TEST_PUHURI_WALDUR_API_URI = "http://puhuri.example.com"
# TEST_PUHURI_WALDUR_CLIENT_TOKEN = "some-test-token"
# TEST_PUHURI_PROVIDER_UUID = "some-test-provider-uuid"


def setup_test_env():
    """Sets up the test environment.

    It should be run before any imports
    """
    environ["CONFIG_FILE"] = TEST_CONFIG_FILE
    # environ["APP_SETTINGS"] = "test"
    # environ["DB_NAME"] = TEST_DB_NAME
    # environ["TEST_DB_MACHINE_ROOT_URL"] = TEST_MONGODB_URL
    # environ["TEST_BCC_MACHINE_ROOT_URL"] = TEST_BCC_URL
    # environ["WS_PORT"] = f"{TEST_WS_PORT}"
    # environ["MSS_PORT"] = f"{TEST_MSS_PORT}"
    # environ["DATETIME_PRECISION"] = TEST_DATETIME_PRECISION

    # environ["JWT_SECRET"] = TEST_JWT_SECRET
    # environ["AUTH_CONFIG_FILE"] = TEST_AUTH_CONFIG_FILE
    #
    # environ["IS_PUHURI_SYNC_ENABLED"] = f"{TEST_IS_PUHURI_SYNC_ENABLED}"
    # environ["PUHURI_POLL_INTERVAL"] = f"{TEST_PUHURI_POLL_INTERVAL}"
    # environ["PUHURI_WALDUR_API_URI"] = TEST_PUHURI_WALDUR_API_URI
    # environ["PUHURI_WALDUR_CLIENT_TOKEN"] = TEST_PUHURI_WALDUR_CLIENT_TOKEN
    # environ["PUHURI_PROVIDER_UUID"] = TEST_PUHURI_PROVIDER_UUID


class BackendConfDict(TypedDict):
    name: str
    url: str

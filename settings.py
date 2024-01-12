# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2021
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import logging
from pathlib import Path
from typing import Any, Dict, List

import tomli
from starlette.config import Config
from starlette.datastructures import URL

# NOTE: shell env variables take precedence over the configuration file
config = Config(".env")

APP_SETTINGS = config("APP_SETTINGS", cast=str, default="production")

# auth
AUTH_CONFIG_FILE = config("AUTH_CONFIG_FILE", cast=str, default="auth_config.toml")
with Path(AUTH_CONFIG_FILE).open(mode="rb") as auth_conf_file:
    _AUTH_CONFIG = tomli.load(auth_conf_file)
# auth clients
OAUTH2_CLIENTS_CONFS: List[Dict[str, Any]] = _AUTH_CONFIG.get("clients", [])
# auth general config
_GENERAL_AUTH_CONFIG = _AUTH_CONFIG.get("general", {})
IS_AUTH_ENABLED = _GENERAL_AUTH_CONFIG.get("is_enabled", True)
JWT_SECRET = _GENERAL_AUTH_CONFIG.get("jwt_secret", None)
JWT_TTL = _GENERAL_AUTH_CONFIG.get("jwt_ttl", 3600)
COOKIE_DOMAIN = _GENERAL_AUTH_CONFIG.get("cookie_domain", None)
COOKIE_NAME = _GENERAL_AUTH_CONFIG.get("cookie_name", "tergiteauth")

_logger_level = logging.DEBUG
_bcc_machine_root_url_env = "BCC_MACHINE_ROOT_URL"
_db_machine_root_url_env = "DB_MACHINE_ROOT_URL"
_is_production = APP_SETTINGS == "production"

if not IS_AUTH_ENABLED and _is_production:
    raise ValueError(
        "'IS_AUTH_ENABLED' environment variable has been set to false in production."
    )

if _is_production:
    _logger_level = logging.INFO

if APP_SETTINGS == "test":
    _bcc_machine_root_url_env = "TEST_BCC_MACHINE_ROOT_URL"
    _db_machine_root_url_env = "TEST_DB_MACHINE_ROOT_URL"

BCC_MACHINE_ROOT_URL = config(_bcc_machine_root_url_env, cast=URL)
DB_MACHINE_ROOT_URL = config(_db_machine_root_url_env, cast=URL)
DB_NAME = config("DB_NAME", cast=str)
WS_PORT = config("WS_PORT", cast=int)
MSS_PORT = config("MSS_PORT", cast=int)
DATETIME_PRECISION = config("DATETIME_PRECISION", cast=str, default="auto")
root_logger = logging.getLogger()
root_logger.setLevel(_logger_level)

# PUHURI synchronization
IS_PUHURI_SYNC_ENABLED = config("IS_PUHURI_SYNC_ENABLED", cast=bool, default=True)
PUHURI_POLL_INTERVAL_MINS = config("PUHURI_POLL_INTERVAL_MINS", cast=float, default=15)
MAX_PUHURI_SUBMISSION_ATTEMPTS = config(
    "MAX_PUHURI_SUBMISSION_ATTEMPTS", cast=float, default=3
)

PUHURI_WALDUR_API_URI = config("PUHURI_WALDUR_API_URI", cast=str, default="")
if IS_PUHURI_SYNC_ENABLED and not PUHURI_WALDUR_API_URI:
    raise ValueError(
        "'PUHURI_WALDUR_API_URI' environment variable must be set if 'IS_PUHURI_SYNC_ENABLED' is True."
    )

PUHURI_WALDUR_CLIENT_TOKEN = config("PUHURI_WALDUR_CLIENT_TOKEN", cast=str, default="")
if IS_PUHURI_SYNC_ENABLED and not PUHURI_WALDUR_CLIENT_TOKEN:
    raise ValueError(
        "'PUHURI_WALDUR_CLIENT_TOKEN' environment variable must be set if 'IS_PUHURI_SYNC_ENABLED' is True."
    )

PUHURI_PROVIDER_UUID = config("PUHURI_PROVIDER_UUID", cast=str, default="")
if IS_PUHURI_SYNC_ENABLED and not PUHURI_PROVIDER_UUID:
    raise ValueError(
        "'PUHURI_PROVIDER_UUID' environment variable must be set if 'IS_PUHURI_SYNC_ENABLED' is True."
    )

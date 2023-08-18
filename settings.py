# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2021
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import logging

from starlette.config import Config
from starlette.datastructures import URL

# NOTE: shell env variables take precedence over the configuration file
config = Config(".env")

APP_SETTINGS = config("APP_SETTINGS", cast=str, default="production")

_logger_level = logging.DEBUG
_bcc_machine_root_url_env = "BCC_MACHINE_ROOT_URL"
_db_machine_root_url_env = "DB_MACHINE_ROOT_URL"

if APP_SETTINGS == "production":
    _logger_level = logging.INFO

if APP_SETTINGS == "test":
    _bcc_machine_root_url_env = "TEST_BCC_MACHINE_ROOT_URL"
    _db_machine_root_url_env = "TEST_DB_MACHINE_ROOT_URL"

BCC_MACHINE_ROOT_URL = config(_bcc_machine_root_url_env, cast=URL)
DB_MACHINE_ROOT_URL = config(_db_machine_root_url_env, cast=URL)
DB_NAME = config("DB_NAME", cast=str)
WS_PORT = config("WS_PORT", cast=int)
DATETIME_PRECISION = config("DATETIME_PRECISION", cast=str, default="auto")
root_logger = logging.getLogger()
root_logger.setLevel(_logger_level)

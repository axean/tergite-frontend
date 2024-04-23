# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2021
# (C) Copyright Martin Ahindura 2023, 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import logging
import os

from utils.config import AppConfig

_CONFIG_FILE = os.environ.get("CONFIG_FILE", default="config.toml")
CONFIG = AppConfig.from_toml(_CONFIG_FILE)

_is_production = CONFIG.environment == "production"
_is_auth_enabled = CONFIG.auth.is_enabled
_is_puhuri_enabled = CONFIG.puhuri.is_enabled

# Logger
_logger_level = logging.INFO if _is_production else logging.DEBUG
root_logger = logging.getLogger()
root_logger.setLevel(_logger_level)

# raise errors in case of wrong settings
if not _is_auth_enabled and _is_production:
    raise ValueError(
        "'auth.is_enabled' has been set to false in production."
    )

# PUHURI synchronization
if _is_puhuri_enabled and not CONFIG.puhuri.waldur_api_uri:
    raise ValueError(
        "'puhuri.waldur_api_uri' config variable must be set if 'puhuri.is_enabled' is true."
    )

if _is_puhuri_enabled and not CONFIG.puhuri.waldur_client_token:
    raise ValueError(
        "'puhuri.waldur_client_token' environment variable must be set if 'puhuri.is_enabled' is true."
    )

if _is_puhuri_enabled and not CONFIG.puhuri.provider_uuid:
    raise ValueError(
        "'puhuri.provider_uuid' config variable must be set if 'puhuri.is_enabled' is true."
    )

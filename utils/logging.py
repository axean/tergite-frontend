# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Utilities for logging"""
import logging

import settings

# error logger
err_logger = logging.getLogger("uvicorn.error")
# work around for testing to allow errors to be seen in terminal
if settings.APP_SETTINGS == "test":
    err_logger.error = print
    err_logger.info = print
    err_logger.warning = print
    err_logger.debug = print

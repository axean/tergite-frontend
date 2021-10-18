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


from starlette.config import Config
from starlette.datastructures import URL

# NOTE: shell env variables take precedence over the configuration file
config = Config(".env")

BCC_MACHINE_ROOT_URL = config("BCC_MACHINE_ROOT_URL", cast=URL)
DB_MACHINE_ROOT_URL = config("DB_MACHINE_ROOT_URL", cast=URL)
DB_NAME = config("DB_NAME", cast=str)

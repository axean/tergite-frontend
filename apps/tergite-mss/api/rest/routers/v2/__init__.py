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

"""Entry point for the v2 router of the API"""

from fastapi import APIRouter

from .auth import router as auth_router
from .calibrations import router as calibrations_router
from .devices import router as devices_router
from .me import router as my_router

v2_router = APIRouter(prefix="/v2")

v2_router.include_router(auth_router)
v2_router.include_router(calibrations_router)
v2_router.include_router(devices_router)
v2_router.include_router(my_router)

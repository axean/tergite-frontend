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

"""Router for auth related operations"""
from fastapi import APIRouter

import settings
from services.auth import (
    APP_TOKEN_AUTH,
    APP_TOKEN_BACKEND,
    CHALMERS_OAUTH_CLIENT,
    JWT_AUTH,
    JWT_BACKEND,
    PUHURI_OAUTH_CLIENT,
    TERGITE_OAUTH_CLIENT,
)

router = APIRouter(prefix="/auth", tags=["auth"])

router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=TERGITE_OAUTH_CLIENT,
        backend=JWT_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/{TERGITE_OAUTH_CLIENT.name}",
    tags=["auth"],
)

router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=CHALMERS_OAUTH_CLIENT,
        backend=JWT_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/{CHALMERS_OAUTH_CLIENT.name}",
    tags=["auth"],
)

router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=PUHURI_OAUTH_CLIENT,
        backend=JWT_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/{PUHURI_OAUTH_CLIENT.name}",
    tags=["auth"],
)

router.include_router(
    APP_TOKEN_AUTH.get_app_tokens_router(backend=APP_TOKEN_BACKEND),
    prefix="/app-tokens",
    tags=["auth"],
)

router.include_router(
    APP_TOKEN_AUTH.get_projects_router(),
    prefix="/projects",
    tags=["auth"],
)

router.include_router(
    APP_TOKEN_AUTH.get_my_projects_router(),
    prefix="/me/projects",
    tags=["auth"],
)

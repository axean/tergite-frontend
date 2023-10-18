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
from services.auth import get_github_client, get_microsoft_client, get_openid_client
from services.auth.service import (
    APP_TOKEN_AUTH,
    APP_TOKEN_BACKEND,
    JWT_AUTH,
    JWT_COOKIE_BACKEND,
    JWT_HEADER_BACKEND,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Oauth clients for authentication
_TERGITE_OAUTH_CLIENT = get_github_client(
    client_id=settings.TERGITE_CLIENT_ID,
    client_secret=settings.TERGITE_CLIENT_SECRET,
    name=settings.TERGITE_CLIENT_NAME,
)

_CHALMERS_OAUTH_CLIENT = get_microsoft_client(
    client_id=settings.CHALMERS_CLIENT_ID,
    client_secret=settings.CHALMERS_CLIENT_SECRET,
    name=settings.CHALMERS_CLIENT_NAME,
)

_PUHURI_OAUTH_CLIENT = get_openid_client(
    client_id=settings.PUHURI_CLIENT_ID,
    client_secret=settings.PUHURI_CLIENT_SECRET,
    openid_configuration_endpoint=settings.PUHURI_CONFIG_ENDPOINT,
    name=settings.PUHURI_CLIENT_NAME,
)

router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_TERGITE_OAUTH_CLIENT,
        backend=JWT_HEADER_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/{_TERGITE_OAUTH_CLIENT.name}",
    tags=["auth"],
)

router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_CHALMERS_OAUTH_CLIENT,
        backend=JWT_HEADER_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/{_CHALMERS_OAUTH_CLIENT.name}",
    tags=["auth"],
)

router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_PUHURI_OAUTH_CLIENT,
        backend=JWT_HEADER_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/{_PUHURI_OAUTH_CLIENT.name}",
    tags=["auth"],
)

# For browser based auth
router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_TERGITE_OAUTH_CLIENT,
        backend=JWT_COOKIE_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/app/{_TERGITE_OAUTH_CLIENT.name}",
    tags=["auth"],
)

# For browser based auth
router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_CHALMERS_OAUTH_CLIENT,
        backend=JWT_COOKIE_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/app/{_CHALMERS_OAUTH_CLIENT.name}",
    tags=["auth"],
)

# For browser based auth
router.include_router(
    JWT_AUTH.get_oauth_router(
        oauth_client=_PUHURI_OAUTH_CLIENT,
        backend=JWT_COOKIE_BACKEND,
        state_secret=settings.JWT_SECRET,
        is_verified_by_default=True,
    ),
    prefix=f"/app/{_PUHURI_OAUTH_CLIENT.name}",
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

router.include_router(
    APP_TOKEN_AUTH.get_app_tokens_router(backend=APP_TOKEN_BACKEND),
    prefix="/me/app-tokens",
    tags=["auth"],
)

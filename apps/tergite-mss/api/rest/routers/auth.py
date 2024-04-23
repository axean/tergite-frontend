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
    JWT_AUTH,
    JWT_COOKIE_BACKEND,
    JWT_HEADER_BACKEND,
    register_oauth2_client,
)
from utils.config import Oauth2ClientConfig

router = APIRouter(prefix="/auth", tags=["auth"])

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

# Oauth clients for authentication
for client in settings.OAUTH2_CLIENTS_CONFS:
    register_oauth2_client(
        router,
        controller=JWT_AUTH,
        auth_header_backend=JWT_HEADER_BACKEND,
        auth_cookie_backend=JWT_COOKIE_BACKEND,
        jwt_secret=settings.JWT_SECRET,
        conf=Oauth2ClientConfig.parse_obj(client),
        tags=["auth"],
    )

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
from typing import Union

from fastapi import APIRouter, FastAPI

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


def include_auth_router(root_router: Union[APIRouter, FastAPI], is_enabled: bool):
    """Includes auth router on the root router if `is_enabled` is True

    Args:
        root_router: the root router to add the auth router to
        is_enabled: whether the router is enabled or not
    """
    if not is_enabled:
        return

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
    for client in settings.CONFIG.auth.clients:
        register_oauth2_client(
            router,
            controller=JWT_AUTH,
            auth_header_backend=JWT_HEADER_BACKEND,
            auth_cookie_backend=JWT_COOKIE_BACKEND,
            jwt_secret=settings.CONFIG.auth.jwt_secret,
            conf=Oauth2ClientConfig.model_validate(client),
            tags=["auth"],
        )

    root_router.include_router(router)

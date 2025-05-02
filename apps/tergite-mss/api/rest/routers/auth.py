# This code is part of Tergite
#
# (C) Chalmers Next Labs AB 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

"""Router for auth related operations"""
from typing import List, Union

from fastapi import APIRouter, FastAPI, HTTPException, status

import settings
from services.auth import JWT_AUTH, JWT_COOKIE_BACKEND, providers
from services.auth.service import register_oauth2_client
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

    # Oauth clients for authentication
    for client in settings.CONFIG.auth.clients:
        register_oauth2_client(
            router,
            controller=JWT_AUTH,
            auth_cookie_backend=JWT_COOKIE_BACKEND,
            jwt_secret=settings.CONFIG.auth.jwt_secret,
            conf=Oauth2ClientConfig.model_validate(client),
            tags=["auth"],
        )

    # both login and logout
    router.include_router(
        JWT_AUTH.get_auth_router(
            backend=JWT_COOKIE_BACKEND, requires_verification=True
        ),
        prefix="",
        tags=["auth"],
    )

    @router.get("/providers", response_model=List[providers.AuthProviderRead])
    def get_auth_providers(domain: str):
        """Returns the auth provider given an existing email domain"""
        data = providers.get_many_by_domain(domain)
        if len(data) == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return data

    root_router.include_router(router)

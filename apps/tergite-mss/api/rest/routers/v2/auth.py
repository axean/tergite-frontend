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

"""Router for auth related operations"""

from fastapi import APIRouter, HTTPException, status

import settings
from services.auth import JWT_AUTH, JWT_COOKIE_BACKEND
from services.auth.service import providers, register_oauth2_client_v2
from utils.config import Oauth2ClientConfig

router = APIRouter(prefix="/auth", tags=["auth"])


# Oauth clients for authentication
for client in settings.CONFIG.auth.clients:
    register_oauth2_client_v2(
        router,
        controller=JWT_AUTH,
        auth_cookie_backend=JWT_COOKIE_BACKEND,
        jwt_secret=settings.CONFIG.auth.jwt_secret,
        conf=Oauth2ClientConfig.parse_obj(client),
        tags=["auth"],
    )


# both login and logout
router.include_router(
    JWT_AUTH.get_auth_router(backend=JWT_COOKIE_BACKEND, requires_verification=True),
    prefix="",
    tags=["auth"],
)


@router.get("/providers")
def get_auth_providers(domain: str):
    """Returns the auth provider given an existing email domain"""
    data = providers.get_many_by_domain(domain)
    if len(data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return data

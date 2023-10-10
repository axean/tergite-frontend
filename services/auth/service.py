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

"""Service for oauth2 authentication and project-based authorization"""

import motor.motor_asyncio
from beanie import PydanticObjectId, init_beanie
from fastapi_users import FastAPIUsers

import settings

from . import projects, users

# JWT-based authentication
JWT_BACKEND = users.get_jwt_backend(
    login_url="/auth/jwt/login",
    jwt_secret=settings.JWT_SECRET,
    lifetime_seconds=settings.JWT_TTL,
)

JWT_AUTH = FastAPIUsers[users.dtos.User, PydanticObjectId](
    users.get_user_manager, [JWT_BACKEND]
)

GET_CURRENT_USER = JWT_AUTH.current_user(active=True)
GET_CURRENT_SUPERUSER = JWT_AUTH.current_user(active=True, superuser=True)

# Oauth clients for authentication
TERGITE_OAUTH_CLIENT = users.get_github_client(
    client_id=settings.TERGITE_CLIENT_ID,
    client_secret=settings.TERGITE_CLIENT_SECRET,
    name=settings.TERGITE_CLIENT_NAME,
)

CHALMERS_OAUTH_CLIENT = users.get_microsoft_client(
    client_id=settings.CHALMERS_CLIENT_ID,
    client_secret=settings.CHALMERS_CLIENT_SECRET,
    name=settings.CHALMERS_CLIENT_NAME,
)

PUHURI_OAUTH_CLIENT = users.get_openid_client(
    client_id=settings.PUHURI_CLIENT_ID,
    client_secret=settings.PUHURI_CLIENT_SECRET,
    openid_configuration_endpoint=settings.PUHURI_CONFIG_ENDPOINT,
    name=settings.PUHURI_CLIENT_NAME,
)

# Project-based app token auth
APP_TOKEN_BACKEND = projects.get_app_token_backend("auth/app-tokens/generate")
APP_TOKEN_AUTH = projects.ProjectBasedAuth(
    get_project_manager_dep=projects.get_project_manager,
    get_current_user_dep=GET_CURRENT_USER,
    get_current_superuser_dep=GET_CURRENT_SUPERUSER,
    auth_backends=[APP_TOKEN_BACKEND],
)
GET_CURRENT_PROJECT = APP_TOKEN_AUTH.current_project(active=True)


async def on_startup(db: motor.motor_asyncio.AsyncIOMotorDatabase):
    """Runs init operations when the application is starting up"""
    await init_beanie(
        database=db,
        document_models=[
            users.dtos.User,
            projects.dtos.AppToken,
            projects.dtos.Project,
        ],
    )

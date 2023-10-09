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
"""Entry point for the users submodule of the auth module"""
from functools import lru_cache
from typing import Optional

from beanie import PydanticObjectId
from fastapi import Depends
from fastapi.requests import Request
from fastapi_users import BaseUserManager
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users_db_beanie import BeanieUserDatabase, ObjectIDIDMixin
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.microsoft import MicrosoftGraphOAuth2
from httpx_oauth.clients.openid import OpenID

from services.auth import User
from services.auth.users.dtos import OAuthAccount


def get_jwt_backend(
    login_url: str,
    jwt_secret: str,
    lifetime_seconds: int = 3600,
) -> AuthenticationBackend:
    """Creates an auth backend that uses JWT to handle auth."""
    bearer_transport = BearerTransport(tokenUrl=login_url)

    def get_jwt_strategy() -> JWTStrategy:
        return JWTStrategy(secret=jwt_secret, lifetime_seconds=lifetime_seconds)

    return AuthenticationBackend(
        name="jwt",
        transport=bearer_transport,
        get_strategy=get_jwt_strategy,
    )


async def get_user_db():
    """Dependency injector of the users database"""
    yield BeanieUserDatabase(User, OAuthAccount)


async def get_user_manager(user_db: BeanieUserDatabase = Depends(get_user_db)):
    """Dependency injector for UserManager"""
    yield UserManager(user_db)


@lru_cache()
def get_github_client(client_id: str, client_secret: str, **kwargs) -> GitHubOAuth2:
    """Gets the GitHubOAuth2 corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.
    """
    return GitHubOAuth2(client_id, client_secret, **kwargs)


@lru_cache()
def get_microsoft_client(
    client_id: str, client_secret: str, **kwargs
) -> MicrosoftGraphOAuth2:
    """Gets the MicrosoftGraphOAuth2 corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.
    """
    return MicrosoftGraphOAuth2(client_id, client_secret, **kwargs)


@lru_cache()
def get_openid_client(
    client_id: str, client_secret: str, openid_configuration_endpoint: str, **kwargs
) -> OpenID:
    """Gets the OpenID corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.
    """
    return OpenID(client_id, client_secret, openid_configuration_endpoint, **kwargs)


class UserManager(ObjectIDIDMixin, BaseUserManager[User, PydanticObjectId]):
    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has registered.")

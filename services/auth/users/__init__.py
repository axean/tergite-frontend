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
from typing import Optional, Sequence, Tuple

from fastapi import Depends, HTTPException, status
from fastapi_users import FastAPIUsers, models
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    CookieTransport,
)
from fastapi_users.manager import UserManagerDependency
from fastapi_users_db_beanie import BeanieUserDatabase
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.microsoft import MicrosoftGraphOAuth2
from httpx_oauth.clients.openid import OpenID

import settings

from . import exc
from .authenticator import UserAuthenticator
from .database import UserDatabase
from .dtos import ID, UP, CurrentUserDependency, OAuthAccount, User, UserRole
from .manager import UserManager
from .strategy import CustomJWTStrategy
from .validators import EmailRegexValidator, Validator


def get_jwt_header_backend(
    login_url: str,
    jwt_secret: str,
    lifetime_seconds: int = 3600,
) -> AuthenticationBackend:
    """Creates an auth backend that uses JWT in bearer header to handle auth."""
    bearer_transport = BearerTransport(tokenUrl=login_url)

    def get_jwt_strategy() -> CustomJWTStrategy:
        return CustomJWTStrategy(secret=jwt_secret, lifetime_seconds=lifetime_seconds)

    return AuthenticationBackend(
        name="jwt",
        transport=bearer_transport,
        get_strategy=get_jwt_strategy,
    )


def get_jwt_cookie_backend(
    jwt_secret: str,
    cookie_name: str,
    cookie_domain: Optional[str] = None,
    cookie_max_age: Optional[int] = None,
) -> AuthenticationBackend:
    """Creates an auth backend that uses JWT in cookie to handle auth."""
    transport = CookieTransport(
        cookie_name=cookie_name,
        cookie_domain=cookie_domain,
        cookie_max_age=cookie_max_age,
    )

    def get_jwt_strategy() -> CustomJWTStrategy:
        lifetime_seconds = cookie_max_age if cookie_max_age is not None else 3600
        return CustomJWTStrategy(secret=jwt_secret, lifetime_seconds=lifetime_seconds)

    return AuthenticationBackend(
        name="jwt-cookie",
        transport=transport,
        get_strategy=get_jwt_strategy,
    )


async def get_user_db():
    """Dependency injector of the users database"""
    yield UserDatabase(settings.AUTH_ROLES_MAP)


async def get_email_validator() -> Validator:
    """Dependency injector of the email validators"""
    yield EmailRegexValidator(settings.AUTH_EMAIL_REGEX_MAP)


async def get_user_manager(
    user_db: BeanieUserDatabase = Depends(get_user_db),
    email_validator: Validator = Depends(get_email_validator),
):
    """Dependency injector for UserManager"""
    yield UserManager(user_db, email_validator=email_validator)


def get_current_user_of_any(
    roles: Tuple[UserRole], get_current_user: CurrentUserDependency
):
    """Creates dependency injector of current user if user has any of the given roles

    Args:
        roles: the roles to check for
        get_current_user: the dependency injector that retrieves the current user

    Returns:
        the dependency injector function
    """

    async def get_user(user: User = Depends(get_current_user)):
        is_permitted = False
        for role in roles:
            if role in user.roles:
                is_permitted = True
                break

        if not is_permitted:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

        yield user

    return get_user


@lru_cache()
def get_github_client(
    client_id: str, client_secret: str, name: str, **kwargs
) -> GitHubOAuth2:
    """Gets the GitHubOAuth2 corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.

    Args:
        client_id: the Github Oauth2 client id
        client_secret: the Github Oauth2 client secret
        name: the name of this oauth2 client
        kwargs: other options to pass to the GitHubOAuth2

    Returns:
        the Github Oauth2 client
    """
    return GitHubOAuth2(client_id, client_secret, name=name, **kwargs)


@lru_cache()
def get_microsoft_client(
    client_id: str, client_secret: str, name: str, **kwargs
) -> MicrosoftGraphOAuth2:
    """Gets the MicrosoftGraphOAuth2 corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.

    Args:
        client_id: the microsoft graph oauth2 client id
        client_secret: the microsoft graph oauth2 client secret
        name: the name of this oauth client
        kwargs: other options to pass to the MicrosoftGraphOAuth2

    Returns:
        the microsoft graph oauth2 client
    """
    return MicrosoftGraphOAuth2(client_id, client_secret, name=name, **kwargs)


@lru_cache()
def get_openid_client(
    client_id: str,
    client_secret: str,
    openid_configuration_endpoint: str,
    name: str,
    **kwargs,
) -> OpenID:
    """Gets the OpenID corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.

    Args:
        client_id: the openID connect client id
        client_secret: the OpenID Connect client secret
        openid_configuration_endpoint: the OpenID Connect configuration endpoint
        name: the name of this oauth client
        kwargs: other options to pass to the OpenID

    Returns:
        the OpenID client
    """
    return OpenID(
        client_id, client_secret, openid_configuration_endpoint, name=name, **kwargs
    )


class UserBasedAuth(FastAPIUsers[models.UP, models.ID]):
    authenticator: UserAuthenticator

    def __init__(
        self,
        get_user_manager_dep: UserManagerDependency[models.UP, models.ID],
        auth_backends: Sequence[AuthenticationBackend],
    ):
        super().__init__(get_user_manager, auth_backends)
        self.authenticator = UserAuthenticator(auth_backends, get_user_manager_dep)
        self.get_user_manager = get_user_manager_dep
        self.current_user = self.authenticator.current_user
        self.current_user_id = self.authenticator.current_user_id

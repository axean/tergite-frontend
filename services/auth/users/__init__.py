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
from typing import Any, Dict, Optional, Sequence, Tuple

from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from fastapi.requests import Request
from fastapi_users import BaseUserManager, models
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import BaseUserDatabase
from fastapi_users.password import PasswordHelperProtocol
from fastapi_users.types import DependencyCallable
from fastapi_users_db_beanie import BeanieUserDatabase, ObjectIDIDMixin
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.microsoft import MicrosoftGraphOAuth2
from httpx_oauth.clients.openid import OpenID
from starlette import status

import settings
from services.auth.users import exc
from services.auth.users.dtos import OAuthAccount, User, UserRole
from services.auth.users.validators import EmailRegexValidator, Validator

CurrentUserDependency = DependencyCallable[User]


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


class UserManager(ObjectIDIDMixin, BaseUserManager[User, PydanticObjectId]):
    def __init__(
        self,
        user_db: BaseUserDatabase[models.UP, models.ID],
        password_helper: Optional[PasswordHelperProtocol] = None,
        email_validator: Optional[Validator] = None,
    ):
        super().__init__(user_db=user_db, password_helper=password_helper)
        self.__email_validator = (
            email_validator if email_validator else EmailRegexValidator()
        )

    async def oauth_callback(
        self,
        oauth_name: str,
        access_token: str,
        account_id: str,
        account_email: str,
        expires_at: Optional[int] = None,
        refresh_token: Optional[str] = None,
        request: Optional[Request] = None,
        *,
        associate_by_email: bool = False,
        is_verified_by_default: bool = False,
    ) -> models.UOAP:
        await self.__email_validator.validate(account_email, oauth_name=oauth_name)
        return await super().oauth_callback(
            oauth_name,
            access_token,
            account_id,
            account_email,
            expires_at,
            refresh_token,
            request,
            associate_by_email=associate_by_email,
            is_verified_by_default=is_verified_by_default,
        )


class UserDatabase(BeanieUserDatabase):
    def __init__(self, user_roles_config: Dict[str, Optional[Sequence[str]]] = None):
        super().__init__(
            user_model=User,
            oauth_account_model=OAuthAccount,
        )
        self.__roles_map = user_roles_config if user_roles_config else {}

    async def add_oauth_account(self, user: User, create_dict: Dict[str, Any]) -> User:
        try:
            oauth_name = create_dict["oauth_name"]
            user_roles = self.__roles_map[oauth_name]
            user.roles.update({UserRole(v) for v in user_roles if v})
        except (KeyError, TypeError):
            pass

        return await super().add_oauth_account(user, create_dict)

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

"""Data Transafer Objects for the users submodule of the auth service"""
import enum
from typing import Dict, List, Optional, Set, Type, TypeVar

from beanie import Document, PydanticObjectId
from fastapi_users import schemas
from fastapi_users.types import DependencyCallable
from fastapi_users_db_beanie import BaseOAuthAccount
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.google import GoogleOAuth2
from httpx_oauth.clients.microsoft import MicrosoftGraphOAuth2
from httpx_oauth.clients.okta import OktaOAuth2
from httpx_oauth.clients.openid import OpenID
from httpx_oauth.oauth2 import BaseOAuth2
from pydantic import BaseModel, Extra, Field
from pymongo import IndexModel
from pymongo.collation import Collation


class UserRole(str, enum.Enum):
    USER = "user"
    RESEARCHER = "researcher"
    ADMIN = "admin"
    PARTNER = "partner"
    SYSTEM = "system"


class UserRead(schemas.BaseUser[PydanticObjectId]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class OAuthAccount(BaseOAuthAccount):
    pass


class User(Document):
    email: str
    hashed_password: str
    is_active: bool = True
    is_verified: bool = False
    oauth_accounts: List[OAuthAccount] = Field(default_factory=list)
    roles: Set[UserRole] = {UserRole.USER}

    class Settings:
        name = "auth_users"
        email_collation = Collation("en", strength=2)
        indexes = [
            IndexModel("email", unique=True),
            IndexModel(
                "email", name="case_insensitive_email_index", collation=email_collation
            ),
        ]

    @property
    def is_superuser(self):
        return UserRole.ADMIN in self.roles

    @is_superuser.setter
    def is_superuser(self, value: bool):
        if value:
            self.roles.add(UserRole.ADMIN)
        elif not value:
            try:
                self.roles.remove(UserRole.ADMIN)
            except KeyError:
                pass


class Oauth2ClientType(str, enum.Enum):
    """The Oauth2 client type"""

    MICROSOFT = "microsoft"
    GITHUB = "github"
    GOOGLE = "google"
    OPENID = "openid"
    OKTA = "okta"


_OAUTH2_CLIENT_CLASS_MAP: Dict[Oauth2ClientType, Type[BaseOAuth2]] = {
    Oauth2ClientType.GITHUB: GitHubOAuth2,
    Oauth2ClientType.GOOGLE: GoogleOAuth2,
    Oauth2ClientType.MICROSOFT: MicrosoftGraphOAuth2,
    Oauth2ClientType.OPENID: OpenID,
    Oauth2ClientType.OKTA: OktaOAuth2,
}


class Oauth2ClientConfig(BaseModel, extra=Extra.allow):
    """The configuration for an Oauth2 Client i.e. a BaseOAuth2 instance"""

    client_id: str
    client_secret: str
    name: str
    openid_configuration_endpoint: Optional[str] = None
    client_type: Oauth2ClientType
    redirect_url: str
    email_regex: str = ".*"
    roles: List[UserRole] = [UserRole.USER]

    # config fields that are not used to create the client
    _non_client_fields = {"client_type", "redirect_url", "email_regex", "roles"}

    def get_client(self):
        """Gets the Oauth2 client from this configuration"""
        client_constructor = _OAUTH2_CLIENT_CLASS_MAP[self.client_type]
        kwargs = self.dict(exclude_none=True, exclude=self._non_client_fields)
        return client_constructor(**kwargs)


CurrentUserDependency = DependencyCallable[User]
CurrentSuperUserDependency = DependencyCallable[User]
CurrentUserIdDependency = DependencyCallable[str]
UP = TypeVar("UP", bound=User)
ID = TypeVar("ID")

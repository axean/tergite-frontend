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
from typing import List

from beanie import Document, PydanticObjectId
from fastapi_users import db, schemas
from pydantic import Field


class UserRead(schemas.BaseUser[PydanticObjectId]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class OAuthAccount(db.BaseOAuthAccount):
    pass


class User(db.BeanieBaseUser, Document):
    oauth_accounts: List[OAuthAccount] = Field(default_factory=list)

    class Settings(db.BeanieBaseUser.Settings):
        name = "auth_users"

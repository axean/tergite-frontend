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
"""Data Transfer Objects for app tokens submodule in the auth service"""
import pymongo
from beanie import Document
from fastapi_users_db_beanie.access_token import BeanieBaseAccessToken
from pydantic import BaseModel
from pymongo import IndexModel


class AppTokenCreate(BaseModel):
    """The payload passed when generating an app token"""

    title: str
    project_ext_id: str
    lifespan_seconds: int


class AppToken(BeanieBaseAccessToken, AppTokenCreate, Document):
    """App token stored in the database"""

    class Settings(BeanieBaseAccessToken.Settings):
        name = "auth_app_tokens"
        indexes = BeanieBaseAccessToken.Settings.indexes + [
            IndexModel(
                [("project_ext_id", pymongo.ASCENDING), ("user_id", pymongo.ASCENDING)],
            ),
        ]

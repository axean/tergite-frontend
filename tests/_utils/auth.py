"""Utilities specific to auth when testing"""
from typing import Any, Dict, Type

from beanie import Document, PydanticObjectId
from fastapi_users.password import PasswordHelper
from pymongo import collection, database, errors

from services.auth.app_tokens.dtos import AppToken
from services.auth.projects.dtos import Project
from services.auth.users.dtos import User, UserRole

TEST_PROJECT_ID = "bf4876d01e60f05ebc9fac9e"
TEST_PROJECT_EXT_ID = "test-project-1"
TEST_USER_ID = "8154077d9cb952b92453d575"
TEST_SUPERUSER_ID = "de7ddbd2500951be940356a2"
TEST_APP_TOKEN_STRING = "46-0Jhgb1_thq8MqIF0SlVHoS8rFPiLBFL33XO_eJ7I"

_password_helper = PasswordHelper()


TEST_SUPERUSER_DICT = dict(
    id=PydanticObjectId(TEST_SUPERUSER_ID),
    email="jane.doe@example.com",
    roles=[UserRole.USER, UserRole.ADMIN],
    hashed_password=_password_helper.hash(_password_helper.generate()),
    is_verified=True,
)
TEST_USER_DICT = dict(
    id=PydanticObjectId(TEST_USER_ID),
    email="john.doe@example.com",
    roles=[UserRole.USER],
    hashed_password=_password_helper.hash(_password_helper.generate()),
    is_verified=True,
)
TEST_PROJECT_DICT = dict(
    id=PydanticObjectId(TEST_PROJECT_ID),
    ext_id=TEST_PROJECT_EXT_ID,
    user_ids=[TEST_USER_ID],
    qpu_seconds=108000,
)

TEST_APP_TOKEN_DICT = dict(
    title="test-token",
    token=TEST_APP_TOKEN_STRING,
    user_id=TEST_USER_DICT["id"],
    project_ext_id=TEST_PROJECT_EXT_ID,
    lifespan_seconds=3600,
)
TEST_SUPERUSER_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZTdkZGJkMjUwMDk1MWJlOTQwMzU2YTIiLCJhdWQiOlsiZmFzdGFwaS11c2VyczphdXRoIl0sImV4cCI6MTY5NzE5MTczNn0.pCk9coa4a4YXbVZV98ArH5_NVNChzsMXAvdb6x_kMg4"
TEST_USER_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MTU0MDc3ZDljYjk1MmI5MjQ1M2Q1NzUiLCJhdWQiOlsiZmFzdGFwaS11c2VyczphdXRoIl0sImV4cCI6MTY5NzE5MTY0OX0.R5m4LBuglIcsVoSSYJALhyFJag4VfvJQpeuB-RUtmAo"


def init_test_auth(db: database.Database):
    """Initializes the auth items in the test database"""
    insert_if_not_exist(db, User, TEST_USER_DICT)
    insert_if_not_exist(db, User, TEST_SUPERUSER_DICT)
    insert_if_not_exist(db, Project, TEST_PROJECT_DICT)
    insert_if_not_exist(db, AppToken, TEST_APP_TOKEN_DICT)


def insert_if_not_exist(
    db: database.Database, schema: Type[Document], data: Dict[str, Any]
):
    """Inserts a given auth document into the database if it does not exist"""
    try:
        col: collection.Collection = db[schema.Settings.name]
        col.insert_one(data)
    except errors.DuplicateKeyError:
        pass

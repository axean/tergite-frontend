"""Utilities specific to auth when testing"""
from typing import Any, Dict, Optional, Type, TypeVar

import jwt
from beanie import Document, PydanticObjectId
from fastapi_users.jwt import decode_jwt, generate_jwt
from fastapi_users.password import PasswordHelper
from pymongo import collection, database, errors

from services.auth.app_tokens.dtos import AppToken
from services.auth.projects.dtos import Project
from services.auth.users.dtos import User, UserRole
from tests._utils.env import TEST_JWT_SECRET

TEST_PROJECT_ID = "bf4876d01e60f05ebc9fac9e"
TEST_PROJECT_EXT_ID = "test-project-1"
TEST_USER_ID = "8154077d9cb952b92453d575"
TEST_SUPERUSER_ID = "de7ddbd2500951be940356a2"
TEST_APP_TOKEN_STRING = "46-0Jhgb1_thq8MqIF0SlVHoS8rFPiLBFL33XO_eJ7I"

_password_helper = PasswordHelper()

TEST_GITHUB_PROFILE = dict(id="test-github-user", email="paul.doe@example.com")
INVALID_GITHUB_PROFILE = dict(id="invalid-github-user", email="julie.doe@example.com")

TEST_PUHURI_PROFILE = dict(sub="test-puhuri-user", email="paul.doe@example.se")
INVALID_PUHURI_PROFILE = dict(sub="invalid-puhuri-user", email="ruth.doe@example.com")

TEST_CHALMERS_PROFILE = dict(
    id="test-chalmers-user", userPrincipalName="paul.doe@chalmers.com"
)
INVALID_CHALMERS_PROFILE = dict(
    id="invalid-chalmers-user", userPrincipalName="paul.doe@chalmers.org"
)

TEST_GITHUB_TOKEN_RESP = {
    "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
    "scope": "user,user:email",
    "token_type": "bearer",
}

TEST_CHALMERS_TOKEN_RESP = {
    "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
    "scope": "User.Read",
    "token_type": "bearer",
}

TEST_PUHURI_TOKEN_RESP = {
    "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
    "scope": "openid,email",
    "token_type": "bearer",
}


TEST_SUPERUSER_DICT = dict(
    _id=PydanticObjectId(TEST_SUPERUSER_ID),
    email="jane.doe@example.com",
    roles=[UserRole.USER, UserRole.ADMIN],
    hashed_password=_password_helper.hash(_password_helper.generate()),
    is_verified=True,
)
TEST_USER_DICT = dict(
    _id=PydanticObjectId(TEST_USER_ID),
    email="john.doe@example.com",
    roles=[UserRole.USER],
    hashed_password=_password_helper.hash(_password_helper.generate()),
    is_verified=True,
)
TEST_PROJECT_DICT = dict(
    _id=PydanticObjectId(TEST_PROJECT_ID),
    ext_id=TEST_PROJECT_EXT_ID,
    user_ids=[TEST_USER_ID],
    qpu_seconds=108000,
)

TEST_APP_TOKEN_DICT = dict(
    title="test-token",
    token=TEST_APP_TOKEN_STRING,
    user_id=TEST_USER_DICT["_id"],
    project_ext_id=TEST_PROJECT_EXT_ID,
    lifespan_seconds=3600,
)


def init_test_auth(db: database.Database):
    """Initializes the auth items in the test database"""
    insert_if_not_exist(db, User, TEST_USER_DICT)
    insert_if_not_exist(db, User, TEST_SUPERUSER_DICT)
    insert_if_not_exist(db, Project, TEST_PROJECT_DICT)
    insert_if_not_exist(db, AppToken, TEST_APP_TOKEN_DICT)


T = TypeVar("T", bound=Document)


def insert_if_not_exist(db: database.Database, schema: Type[T], data: Dict[str, Any]):
    """Inserts a given auth document into the database if it does not exist"""
    try:
        col: collection.Collection = db[schema.Settings.name]
        col.insert_one(data)
    except errors.DuplicateKeyError:
        pass


def get_db_record(db: database.Database, schema: Type[T], _id: str) -> Optional[T]:
    """Gets a given auth document from the database or None if it does not exist"""
    col: collection.Collection = db[schema.Settings.name]
    return col.find_one({"_id": PydanticObjectId(_id)})


def get_jwt_token(user_id: str, ttl: int = 3600, secret: str = TEST_JWT_SECRET) -> str:
    """Generates a valid JWT token for the given user_id"""
    data = {"sub": user_id, "aud": ["fastapi-users:auth"]}

    return generate_jwt(
        data=data, secret=secret, lifetime_seconds=ttl, algorithm="HS256"
    )


def is_valid_jwt(token: str, secret: str = TEST_JWT_SECRET) -> bool:
    """Checks that the given JWT is a valid JWT

    Args:
        token: the JWT token to be checked
        secret: the JWT secret used to encode the JWT
    """
    audience = ["fastapi-users:auth"]
    algorithms = ["HS256"]

    try:
        data = decode_jwt(
            token, secret=secret, audience=audience, algorithms=algorithms
        )
        return "sub" in data
    except jwt.PyJWTError:
        return False

from beanie import PydanticObjectId
from fastapi_users import FastAPIUsers

import settings
from services.auth import service
from services.auth.dtos import (
    User,
    Project,
    ProjectUpdate,
    ProjectCreate,
    UserRead,
    UserCreate,
    UserUpdate,
)

JWT_BACKEND = service.get_jwt_backend(
    login_url="/auth/jwt/login",
    jwt_secret=settings.JWT_SECRET,
    lifetime_seconds=settings.JWT_TTL,
)

APP_TOKEN_BACKEND = service.get_app_token_backend("auth/app-tokens/generate")

JWT_AUTH_INSTANCE = FastAPIUsers[User, PydanticObjectId](
    service.get_user_manager, [JWT_BACKEND]
)

GET_CURRENT_USER = JWT_AUTH_INSTANCE.current_user(active=True)
GET_CURRENT_SUPERUSER = JWT_AUTH_INSTANCE.current_user(active=True, superuser=True)

APP_TOKEN_AUTH_INSTANCE = service.FastAPIProjects(
    get_project_manager_dep=service.get_project_manager,
    get_current_user_dep=GET_CURRENT_USER,
    get_current_superuser_dep=GET_CURRENT_SUPERUSER,
    auth_backends=[APP_TOKEN_BACKEND],
)
GET_CURRENT_PROJECT = APP_TOKEN_AUTH_INSTANCE.current_project(active=True)

GITHUB_OAUTH_CLIENT = service.get_github_oauth_client(
    client_id=settings.GITHUB_CLIENT_ID, client_secret=settings.GITHUB_CLIENT_SECRET
)

MICROSOFT_OAUTH_CLIENT = service.get_microsoft_oauth_client(
    client_id=settings.MICROSOFT_CLIENT_ID,
    client_secret=settings.MICROSOFT_CLIENT_SECRET,
)

PUHURI_OAUTH_CLIENT = service.get_openid_client(
    client_id=settings.PUHURI_CLIENT_ID,
    client_secret=settings.PUHURI_CLIENT_SECRET,
    openid_configuration_endpoint=settings.PUHURI_CONFIG_ENDPOINT,
)

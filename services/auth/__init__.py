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
from .app_tokens.dtos import (
    AppToken,
    AppTokenCreate,
    AppTokenListResponse,
    AppTokenRead,
)
from .projects import ProjectDatabase, get_project_db
from .projects.dtos import (
    Project,
    ProjectAdminView,
    ProjectCreate,
    ProjectListResponse,
    ProjectRead,
    ProjectUpdate,
)
from .service import (
    APP_TOKEN_AUTH,
    APP_TOKEN_BACKEND,
    GET_CURRENT_LAX_PROJECT,
    GET_CURRENT_PROJECT,
    GET_CURRENT_SUPERUSER,
    GET_CURRENT_USER,
    GET_CURRENT_USER_ID,
    JWT_AUTH,
    JWT_COOKIE_BACKEND,
    JWT_HEADER_BACKEND,
    on_startup,
    register_oauth2_client,
)
from .users.dtos import (
    Oauth2ClientConfig,
    User,
    UserCreate,
    UserRead,
    UserRole,
    UserUpdate,
)

__all__ = [
    # DTOs
    UserRead,
    UserCreate,
    UserUpdate,
    User,
    UserRole,
    Oauth2ClientConfig,
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectRead,
    ProjectAdminView,
    ProjectListResponse,
    ProjectDatabase,
    AppToken,
    AppTokenRead,
    AppTokenCreate,
    AppTokenListResponse,
    # service
    "service",
    JWT_HEADER_BACKEND,
    JWT_COOKIE_BACKEND,
    JWT_AUTH,
    GET_CURRENT_USER,
    GET_CURRENT_USER_ID,
    GET_CURRENT_SUPERUSER,
    APP_TOKEN_BACKEND,
    APP_TOKEN_AUTH,
    GET_CURRENT_PROJECT,
    GET_CURRENT_LAX_PROJECT,
    on_startup,
    register_oauth2_client,
    get_project_db,
]

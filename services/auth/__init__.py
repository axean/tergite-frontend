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
from .projects.dtos import Project, ProjectCreate, ProjectUpdate
from .service import (
    APP_TOKEN_AUTH,
    APP_TOKEN_BACKEND,
    CHALMERS_OAUTH_CLIENT,
    GET_CURRENT_PROJECT,
    GET_CURRENT_SUPERUSER,
    GET_CURRENT_USER,
    JWT_AUTH,
    JWT_BACKEND,
    PUHURI_OAUTH_CLIENT,
    TERGITE_OAUTH_CLIENT,
    on_startup,
)
from .users.dtos import User, UserCreate, UserRead, UserUpdate

__all__ = [
    # DTOs
    UserRead,
    UserCreate,
    UserUpdate,
    User,
    Project,
    ProjectCreate,
    ProjectUpdate,
    # service
    JWT_BACKEND,
    JWT_AUTH,
    APP_TOKEN_BACKEND,
    GET_CURRENT_USER,
    GET_CURRENT_SUPERUSER,
    APP_TOKEN_AUTH,
    GET_CURRENT_PROJECT,
    TERGITE_OAUTH_CLIENT,
    CHALMERS_OAUTH_CLIENT,
    PUHURI_OAUTH_CLIENT,
    on_startup,
]

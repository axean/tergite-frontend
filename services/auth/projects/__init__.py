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
from typing import Sequence

from fastapi import APIRouter, Depends
from fastapi_users.authentication import AuthenticationBackend, BearerTransport

from . import routers
from .app_tokens import (
    AppTokenAuthenticator,
    AppTokenDatabase,
    AppTokenStrategy,
    ProjectManagerDependency,
)
from .dtos import Project, ProjectAdminView, ProjectCreate, ProjectRead, ProjectUpdate
from .manager import ProjectDatabase, ProjectManager
from .routers import (
    CurrentSuperUserDependency,
    CurrentUserDependency,
    CurrentUserIdDependency,
)


async def get_project_db():
    """Dependency injector of the users database"""
    yield ProjectDatabase()


async def get_project_manager(project_db: ProjectDatabase = Depends(get_project_db)):
    """Dependency injector for ProjectManager"""
    yield ProjectManager(project_db)


class ProjectBasedAuth:
    def __init__(
        self,
        get_project_manager_dep: ProjectManagerDependency,
        get_current_user_dep: CurrentUserDependency,
        get_current_user_id_dep: CurrentUserIdDependency,
        get_current_superuser_dep: CurrentSuperUserDependency,
        auth_backends: Sequence[AuthenticationBackend],
    ):
        self.authenticator = AppTokenAuthenticator(
            backends=auth_backends, get_project_manager_dep=get_project_manager_dep
        )
        self.get_project_manager = get_project_manager_dep
        self.get_current_user = get_current_user_dep
        self.get_current_user_id = get_current_user_id_dep
        self.get_current_superuser = get_current_superuser_dep
        self.current_project = self.authenticator.current_project

    def get_app_tokens_router(self, backend: AuthenticationBackend) -> APIRouter:
        """
        Return an auth router for a given authentication backend.

        Args:
            backend: The authentication backend instance.
        """
        return routers.get_app_tokens_router(
            backend=backend,
            get_project_manager=self.get_project_manager,
            get_current_user=self.get_current_user,
            authenticator=self.authenticator,
        )

    def get_projects_router(self) -> APIRouter:
        """Return a router with routes to manage projects."""
        return routers.get_projects_router(
            get_project_manager=self.get_project_manager,
            get_current_superuser=self.get_current_superuser,
            project_schema=ProjectAdminView,
            project_update_schema=ProjectUpdate,
            project_create_schema=ProjectCreate,
        )

    def get_my_projects_router(self) -> APIRouter:
        """Return a router for viewing current user's projects."""
        return routers.get_my_projects_router(
            get_project_manager=self.get_project_manager,
            get_current_user_id=self.get_current_user_id,
            project_schema=ProjectRead,
        )


def get_app_token_backend(app_token_generation_url: str) -> AuthenticationBackend:
    """Creates an auth backend that uses database app tokens to authenticate"""
    bearer_transport = BearerTransport(tokenUrl=app_token_generation_url)

    def get_app_token_strategy(
        token_db: AppTokenDatabase = Depends(get_app_token_db),
    ) -> AppTokenStrategy:
        return AppTokenStrategy(token_db)

    return AuthenticationBackend(
        name="app-token",
        transport=bearer_transport,
        get_strategy=get_app_token_strategy,
    )


async def get_app_token_db():
    """Dependency injector for getting app token database"""
    yield AppTokenDatabase()

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

"""A collection of routers for the projects submodule of the auth service"""
from enum import Enum
from typing import TYPE_CHECKING, Tuple, Type

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response
from fastapi_users import exceptions, schemas
from fastapi_users.authentication import AuthenticationBackend
from fastapi_users.openapi import OpenAPIResponseType
from fastapi_users.router.common import ErrorCode, ErrorModel
from fastapi_users.types import DependencyCallable

from ..users.dtos import User
from . import exc
from .dtos import AppTokenCreate, Project, ProjectCreate, ProjectUpdate
from .app_tokens import (
    AppTokenAuthenticator,
    AppTokenStrategy,
    ProjectManagerDependency,
)
from .manager import ProjectManager


CurrentUserDependency = DependencyCallable[User]
CurrentSuperUserDependency = DependencyCallable[User]


class ExtendedErrorCode(str, Enum):
    PROJECT_ALREADY_EXISTS = "PROJECT_ALREADY_EXISTS"
    BAD_CREDENTIALS = "BAD_CREDENTIALS"
    UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS = "UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS"


def get_app_tokens_router(
    backend: AuthenticationBackend,
    get_project_manager: "ProjectManagerDependency",
    get_current_user: "CurrentUserDependency",
    authenticator: "AppTokenAuthenticator",
    **kwargs,
) -> APIRouter:
    """Generate a router with login/logout routes for an authentication backend."""
    router = APIRouter()
    get_current_project_token = authenticator.current_project_token(active=True)

    login_responses: OpenAPIResponseType = {
        status.HTTP_400_BAD_REQUEST: {
            "model": ErrorModel,
            "content": {
                "application/json": {
                    "examples": {
                        ExtendedErrorCode.BAD_CREDENTIALS: {
                            "summary": "Bad credentials or you don't have access to project.",
                            "value": {"detail": ExtendedErrorCode.BAD_CREDENTIALS},
                        },
                    }
                }
            },
        },
        **backend.transport.get_openapi_login_responses_success(),
    }

    @router.post(
        "/generate",
        name=f"app_tokens:{backend.name}.generate_token",
        responses=login_responses,
    )
    async def generate_app_token(
        request: Request,
        payload: AppTokenCreate,
        project_manager: ProjectManager = Depends(get_project_manager),
        strategy: AppTokenStrategy = Depends(backend.get_strategy),
        current_user: User = Depends(get_current_user),
    ):
        project = await project_manager.authenticate(
            details=payload, current_user=current_user
        )

        if project is None or not project.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorCode.LOGIN_BAD_CREDENTIALS,
            )

        response = await backend.login(strategy, project)
        await project_manager.on_after_login(project, request, response)
        return response

    logout_responses: OpenAPIResponseType = {
        **{
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Missing token or inactive project or no access to project."
            }
        },
        **backend.transport.get_openapi_logout_responses_success(),
    }

    @router.post(
        "/destroy",
        name=f"app_tokens:{backend.name}.destroy_token",
        responses=logout_responses,
    )
    async def logout(
        project_token: Tuple[Project, str] = Depends(get_current_project_token),
        strategy: AppTokenStrategy = Depends(backend.get_strategy),
    ):
        project, token = project_token
        return await backend.logout(strategy, project, token)

    return router


def get_projects_router(
    get_project_manager: ProjectManagerDependency,
    get_current_superuser: CurrentSuperUserDependency,
    project_schema: Type[Project],
    project_update_schema: Type[ProjectUpdate],
    project_create_schema: Type[ProjectCreate],
    **kwargs,
) -> APIRouter:
    """Generate a router with the projects' routes."""
    router = APIRouter()

    async def get_project_or_404(
        id: str,
        project_manager: ProjectManager = Depends(get_project_manager),
    ) -> Project:
        try:
            parsed_id = project_manager.parse_id(id)
            return await project_manager.get(parsed_id)
        except (exc.ProjectNotExists, exceptions.InvalidID) as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from e

    @router.post(
        "/",
        response_model=project_schema,
        dependencies=[Depends(get_current_superuser)],
        status_code=status.HTTP_201_CREATED,
        name="projects:create_project",
        responses={
            status.HTTP_400_BAD_REQUEST: {
                "model": ErrorModel,
                "content": {
                    "application/json": {
                        "examples": {
                            ExtendedErrorCode.PROJECT_ALREADY_EXISTS: {
                                "summary": "A project with this ext_id already exists.",
                                "value": {
                                    "detail": ExtendedErrorCode.PROJECT_ALREADY_EXISTS
                                },
                            },
                        }
                    }
                },
            },
        },
    )
    async def create(
        project_create: project_create_schema,  # type: ignore
        project_manager: ProjectManager = Depends(get_project_manager),
    ):
        try:
            created_project = await project_manager.create(
                project_create,
            )
        except exc.ProjectNotExists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ExtendedErrorCode.PROJECT_ALREADY_EXISTS,
            )

        return schemas.model_validate(project_schema, created_project)

    @router.get(
        "/{id}",
        response_model=project_schema,
        dependencies=[Depends(get_current_superuser)],
        name="projects:projects",
        responses={
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Missing token or inactive project.",
            },
            status.HTTP_403_FORBIDDEN: {
                "description": "Not a superuser.",
            },
            status.HTTP_404_NOT_FOUND: {
                "description": "The project does not exist.",
            },
        },
    )
    async def get_project(project=Depends(get_project_or_404)):
        return schemas.model_validate(project_schema, project)

    @router.patch(
        "/{id}",
        response_model=project_schema,
        dependencies=[Depends(get_current_superuser)],
        name="projects:patch_project",
        responses={
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Missing token or inactive project.",
            },
            status.HTTP_403_FORBIDDEN: {
                "description": "Not a superuser.",
            },
            status.HTTP_404_NOT_FOUND: {
                "description": "The project does not exist.",
            },
            status.HTTP_400_BAD_REQUEST: {
                "model": ErrorModel,
                "content": {
                    "application/json": {
                        "examples": {
                            ExtendedErrorCode.UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS: {
                                "summary": "A project with this ext_id already exists.",
                                "value": {
                                    "detail": ExtendedErrorCode.UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS
                                },
                            },
                        }
                    }
                },
            },
        },
    )
    async def update_project(
        project_update: project_update_schema,  # type: ignore
        request: Request,
        project=Depends(get_project_or_404),
        project_manager: ProjectManager = Depends(get_project_manager),
    ):
        try:
            project = await project_manager.update(
                project_update, project, safe=False, request=request
            )
            return schemas.model_validate(project_schema, project)
        except exc.ProjectNotExists:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=ExtendedErrorCode.UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS,
            )

    @router.delete(
        "/{id}",
        status_code=status.HTTP_204_NO_CONTENT,
        response_class=Response,
        dependencies=[Depends(get_current_superuser)],
        name="projects:delete_project",
        responses={
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Missing token or inactive project.",
            },
            status.HTTP_403_FORBIDDEN: {
                "description": "Not a superuser.",
            },
            status.HTTP_404_NOT_FOUND: {
                "description": "The project does not exist.",
            },
        },
    )
    async def delete_project(
        request: Request,
        project=Depends(get_project_or_404),
        project_manager: ProjectManager = Depends(get_project_manager),
    ):
        await project_manager.delete(project, request=request)
        return None

    return router

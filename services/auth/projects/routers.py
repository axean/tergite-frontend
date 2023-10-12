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
from typing import List, Optional, Tuple, Type

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from fastapi_users import exceptions, schemas
from fastapi_users.authentication import AuthenticationBackend
from fastapi_users.openapi import OpenAPIResponseType
from fastapi_users.router.common import ErrorCode, ErrorModel

from ..app_tokens.authenticator import AppTokenAuthenticator
from ..app_tokens.dtos import AppTokenCreate
from ..app_tokens.strategy import AppTokenStrategy
from ..users.dtos import (
    CurrentSuperUserDependency,
    CurrentUserDependency,
    CurrentUserIdDependency,
    User,
)
from . import exc
from .dtos import (
    Project,
    ProjectAdminView,
    ProjectCreate,
    ProjectListResponse,
    ProjectRead,
    ProjectUpdate,
)
from .manager import ProjectManager, ProjectManagerDependency


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
                        exc.ExtendedErrorCode.BAD_CREDENTIALS: {
                            "summary": "Bad credentials or you don't have access to project.",
                            "value": {"detail": exc.ExtendedErrorCode.BAD_CREDENTIALS},
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
    project_schema: Type[ProjectAdminView],
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
                            exc.ExtendedErrorCode.PROJECT_ALREADY_EXISTS: {
                                "summary": "A project with this ext_id already exists.",
                                "value": {
                                    "detail": exc.ExtendedErrorCode.PROJECT_ALREADY_EXISTS
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
                detail=exc.ExtendedErrorCode.PROJECT_ALREADY_EXISTS,
            )

        return schemas.model_validate(project_schema, created_project)

    @router.get(
        "/{id}",
        response_model=project_schema,
        dependencies=[Depends(get_current_superuser)],
        name="projects:single_project",
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

    @router.get(
        "/",
        response_model=ProjectListResponse[project_schema],
        dependencies=[Depends(get_current_superuser)],
        name="projects:many_projects",
        responses={
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Missing token or inactive project.",
            },
            status.HTTP_403_FORBIDDEN: {
                "description": "Not a superuser.",
            },
        },
    )
    async def get_many_projects(
        project_manager: ProjectManager = Depends(get_project_manager),
        skip: int = Query(0),
        limit: Optional[int] = Query(None),
        ids: Optional[List[PydanticObjectId]] = Query(None, alias="id"),
        user_ids: Optional[List[str]] = Query(None),
        ext_id: Optional[List[str]] = Query(None),
        is_active: Optional[bool] = Query(None),
        min_qpu_seconds: Optional[int] = Query(None),
        max_qpu_seconds: Optional[int] = Query(None),
    ):
        max_list_length = 99

        filter_obj = {}
        if ids is not None:
            if len(ids) > max_list_length:
                raise exc.TooManyListQueryParams(
                    "id", expected=max_list_length, got=len(ids)
                )

            filter_obj["_id"] = {"$in": ids}

        if user_ids is not None:
            if len(user_ids) > max_list_length:
                raise exc.TooManyListQueryParams(
                    "user_ids", expected=max_list_length, got=len(user_ids)
                )

            filter_obj["user_ids"] = {"$in": user_ids}

        if ext_id is not None:
            if len(ext_id) > max_list_length:
                raise exc.TooManyListQueryParams(
                    "ext_id", expected=max_list_length, got=len(ext_id)
                )

            filter_obj["ext_id"] = {"$in": ext_id}

        if is_active is not None:
            filter_obj["is_active"] = is_active

        if min_qpu_seconds is not None:
            filter_obj["qpu_seconds"] = {"$gte": min_qpu_seconds}

        if max_qpu_seconds is not None:
            if "qpu_seconds" not in filter_obj:
                filter_obj["min_qpu_seconds"] = {}

            filter_obj["qpu_seconds"].update({"$lte": max_qpu_seconds})

        projects = await project_manager.get_many(
            filter_obj=filter_obj, skip=skip, limit=limit
        )
        data = [schemas.model_validate(project_schema, project) for project in projects]
        return ProjectListResponse(data=data, skip=skip, limit=limit)

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
                            exc.ExtendedErrorCode.UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS: {
                                "summary": "A project with this ext_id already exists.",
                                "value": {
                                    "detail": exc.ExtendedErrorCode.UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS
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
                detail=exc.ExtendedErrorCode.UPDATE_PROJECT_EXT_ID_ALREADY_EXISTS,
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


def get_my_projects_router(
    get_project_manager: ProjectManagerDependency,
    get_current_user_id: CurrentUserIdDependency,
    project_schema: Type[ProjectRead],
    **kwargs,
) -> APIRouter:
    """Generate a router for viewing my the projects."""
    router = APIRouter()

    @router.get(
        "/",
        response_model=ProjectListResponse[project_schema],
        name="projects:my_many_projects",
        responses={
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Missing token or inactive user.",
            },
        },
    )
    async def get_projects(
        user_id: str = Depends(get_current_user_id),
        project_manager: ProjectManager = Depends(get_project_manager),
        skip: int = Query(0),
        limit: Optional[int] = Query(None),
    ):
        projects = await project_manager.get_many(
            filter_obj={"user_ids": user_id}, skip=skip, limit=limit
        )

        data = [schemas.model_validate(project_schema, project) for project in projects]
        return ProjectListResponse(data=data, skip=skip, limit=limit)

    @router.get(
        "/{id}",
        response_model=project_schema,
        name="projects:my_single_project",
        responses={
            status.HTTP_401_UNAUTHORIZED: {
                "description": "Missing token or inactive user.",
            },
            status.HTTP_404_NOT_FOUND: {
                "description": "The project does not exist.",
            },
        },
    )
    async def get_project(
        id: str,
        user_id: str = Depends(get_current_user_id),
        project_manager: ProjectManager = Depends(get_project_manager),
    ):
        try:
            parsed_id = project_manager.parse_id(id)
            project = await project_manager.get(parsed_id)
        except (exc.ProjectNotExists, exceptions.InvalidID) as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from e

        if user_id not in project.user_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="the project does not exist.",
            )

        return schemas.model_validate(project_schema, project)

    return router

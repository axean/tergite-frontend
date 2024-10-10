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
from typing import List, Optional, Type

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import Response
from fastapi_users import exceptions, schemas
from fastapi_users.router.common import ErrorModel
from pydantic import EmailStr

from ..users.dtos import CurrentSuperUserDependency, CurrentUserIdDependency
from ..users.manager import UserManager, UserManagerDependency
from ..utils import MAX_LIST_QUERY_LEN, TooManyListQueryParams
from . import exc
from .dtos import (
    Project,
    ProjectAdminView,
    ProjectCreate,
    ProjectListResponse,
    ProjectRead,
    ProjectUpdate,
)
from .manager import ProjectAppTokenManager, ProjectManagerDependency


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
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
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
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
    ):
        try:
            created_project = await project_manager.create(
                project_create,
            )
        except exc.ProjectExists:
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
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
        skip: int = Query(0),
        limit: Optional[int] = Query(None),
        ids: Optional[List[PydanticObjectId]] = Query(None, alias="id"),
        user_emails: Optional[List[EmailStr]] = Query(None),
        ext_id: Optional[List[str]] = Query(None),
        is_active: Optional[bool] = Query(None),
        min_qpu_seconds: Optional[int] = Query(None),
        max_qpu_seconds: Optional[int] = Query(None),
    ):
        filter_obj = {}
        if ids is not None:
            if len(ids) > MAX_LIST_QUERY_LEN:
                raise TooManyListQueryParams(
                    "id", expected=MAX_LIST_QUERY_LEN, got=len(ids)
                )

            filter_obj["_id"] = {"$in": ids}

        if user_emails is not None:
            if len(user_emails) > MAX_LIST_QUERY_LEN:
                raise TooManyListQueryParams(
                    "user_emails", expected=MAX_LIST_QUERY_LEN, got=len(user_emails)
                )

            filter_obj["user_emails"] = {"$in": user_emails}

        if ext_id is not None:
            if len(ext_id) > MAX_LIST_QUERY_LEN:
                raise TooManyListQueryParams(
                    "ext_id", expected=MAX_LIST_QUERY_LEN, got=len(ext_id)
                )

            filter_obj["ext_id"] = {"$in": ext_id}

        if is_active is not None:
            filter_obj["is_active"] = is_active

        if min_qpu_seconds is not None:
            filter_obj["qpu_seconds"] = {"$gte": min_qpu_seconds}

        if max_qpu_seconds is not None:
            if "qpu_seconds" not in filter_obj:
                filter_obj["qpu_seconds"] = {}

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
        },
    )
    async def update_project(
        project_update: project_update_schema,  # type: ignore
        request: Request,
        project=Depends(get_project_or_404),
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
    ):
        project = await project_manager.update(
            project_update, project, safe=False, request=request
        )
        return schemas.model_validate(project_schema, project)

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
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
    ):
        await project_manager.delete(project, request=request)
        return None

    return router


def get_my_projects_router(
    get_project_manager: ProjectManagerDependency,
    get_user_manager: UserManagerDependency,
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
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
        user_manager: UserManager = Depends(get_user_manager),
        skip: int = Query(0),
        limit: Optional[int] = Query(None),
    ):
        user = await user_manager.get(PydanticObjectId(user_id))
        projects = await project_manager.get_many(
            filter_obj={"$or": [{"user_emails": user.email}, {"user_ids": user_id}]},
            skip=skip,
            limit=limit,
        )

        data = [
            jsonable_encoder(schemas.model_validate(project_schema, project))
            for project in projects
        ]
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
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
        user_manager: UserManager = Depends(get_user_manager),
    ):
        try:
            parsed_id = project_manager.parse_id(id)
            project = await project_manager.get(parsed_id)
        except (exc.ProjectNotExists, exceptions.InvalidID) as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from e

        user = await user_manager.get(PydanticObjectId(user_id))
        user_emails: List[str] = (
            project.user_emails if project.user_emails is not None else []
        )
        user_ids: List[str] = project.user_ids if project.user_ids is not None else []

        if user is None or (
            user.email not in user_emails and str(user.id) not in user_ids
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="the project does not exist.",
            )

        return schemas.model_validate(project_schema, project)

    # route to destroy tokens
    @router.delete(
        "/{_id}",
        status_code=status.HTTP_204_NO_CONTENT,
        name=f"projects:destroy_my_administered_project",
        responses={
            **{
                status.HTTP_401_UNAUTHORIZED: {
                    "description": "user not authenticated."
                },
                status.HTTP_403_FORBIDDEN: {
                    "description": "token is missing or is expired."
                },
            },
        },
    )
    async def destroy(
        _id: PydanticObjectId,
        user_id: str = Depends(get_current_user_id),
        user_manager: UserManager = Depends(get_user_manager),
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
    ):
        try:
            parsed_id = project_manager.parse_id(_id)
            project = await project_manager.get(parsed_id)
        except (exc.ProjectNotExists, exceptions.InvalidID) as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from e

        user = await user_manager.get(PydanticObjectId(user_id))

        if user is None or str(user.id) != project.admin_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

        await project_manager.delete(project)
        return None

    return router

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
from typing import Dict, List, Optional, Type

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import Response
from fastapi_users import exceptions, schemas
from fastapi_users.password import PasswordHelper
from fastapi_users.router.common import ErrorModel
from pydantic import EmailStr

from ..users.dtos import CurrentSuperUserDependency, CurrentUserIdDependency, User
from ..users.manager import UserManager, UserManagerDependency
from ..utils import MAX_LIST_QUERY_LEN, PaginatedListResponse, TooManyListQueryParams
from . import exc
from .dtos import Project, ProjectAdminView, ProjectCreate, ProjectRead, ProjectUpdate
from .manager import ProjectAppTokenManager, ProjectManagerDependency

_password_helper = PasswordHelper()


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
        response_model=PaginatedListResponse[project_schema],
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
        return PaginatedListResponse(data=data, skip=skip, limit=limit)

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
        response_model=PaginatedListResponse[project_schema],
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
        return PaginatedListResponse(data=data, skip=skip, limit=limit)

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


def get_projects_router_v2(
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
        "",
        response_model=project_schema,
        dependencies=[Depends(get_current_superuser)],
        status_code=status.HTTP_201_CREATED,
        name="projects:create_project_v2",
    )
    async def create(
        project_create: project_create_schema,  # type: ignore
        project_manager: ProjectAppTokenManager = Depends(get_project_manager),
    ):
        try:
            project_create = await _prepare_project_v2_payload(project_create)
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
        name="projects:single_project_v2",
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
        "",
        response_model=PaginatedListResponse[project_schema],
        dependencies=[Depends(get_current_superuser)],
        name="projects:many_projects_v2",
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
        user_ids: Optional[List[str]] = Query(None),
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

        if user_ids is not None:
            if len(user_ids) > MAX_LIST_QUERY_LEN:
                raise TooManyListQueryParams(
                    "user_ids", expected=MAX_LIST_QUERY_LEN, got=len(user_ids)
                )

            filter_obj["user_ids"] = {"$in": user_ids}

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
        return PaginatedListResponse(data=data, skip=skip, limit=limit)

    @router.put(
        "/{id}",
        response_model=project_schema,
        dependencies=[Depends(get_current_superuser)],
        name="projects:put_project",
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
        project_update = await _prepare_update_v2(project, project_update)

        updated_project = await project_manager.update(
            project_update, project, safe=False, request=request
        )

        return schemas.model_validate(project_schema, updated_project)

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


async def _prepare_update_v2(project: Project, payload: ProjectUpdate) -> ProjectUpdate:
    """Prepares the payload for update

    It replaces user_emails and admin_email with user ids

    Args:
        project: the project to update
        payload: the payload to convert

    Returns:
        the ProjectUpdate instance with proper user_ids and admin_id
    """
    payload = payload.copy()  # type: ProjectUpdate
    is_user_ids_updating = payload.user_emails is not None
    is_admin_id_updating = payload.admin_email is not None

    user_emails = (payload.user_emails or []) + [payload.admin_email]
    user_emails = [k for k in user_emails if k is not None]
    email_id_map = await _get_user_email_id_map(user_emails)

    admin_id = str(project.admin_id)
    if is_admin_id_updating:
        payload.admin_id = email_id_map[payload.admin_email]
        admin_id = payload.admin_id

    if is_user_ids_updating:
        payload.user_ids = [email_id_map[email] for email in payload.user_emails]

    if is_user_ids_updating and admin_id not in payload.user_ids:
        payload.user_ids.append(admin_id)

    if not is_user_ids_updating and admin_id not in project.user_ids:
        payload.user_ids = [*project.user_ids, admin_id]

    # clean up the user emails for privacy reasons
    payload.admin_email = None
    payload.user_emails = None

    return payload


async def _prepare_project_v2_payload(payload: ProjectCreate) -> ProjectCreate:
    """Prepares the raw payload to be of Project version 2

    Args:
        payload: the payload to convert

    Returns:
        the ProjectCreate instance with proper version 2 values
    """
    payload = payload.copy()  # type: ProjectCreate
    all_emails = [*payload.user_emails, payload.admin_email]
    email_id_map = await _get_user_email_id_map(all_emails)

    payload.version = 2
    payload.user_ids = [email_id_map[email] for email in payload.user_emails]
    payload.admin_id = email_id_map[payload.admin_email]

    if payload.admin_id not in payload.user_ids:
        payload.user_ids.append(payload.admin_id)

    # remove the emails manually for privacy
    payload.admin_email = None
    payload.user_emails = None

    return payload


async def _get_user_email_id_map(user_emails: List[str]) -> Dict[str, str]:
    """Generates a map of user email and their id

    It creates any users for emails whose users don't exist

    Args:
        user_emails: the emails of the users

    Returns:
        the map of the user emails and their corresponding user ids
    """
    if len(user_emails) == 0:
        # return without doing any db requests
        return {}

    users = await User.find({"email": {"$in": user_emails}}).to_list()
    email_id_map = {v.email: str(v.id) for v in users}

    # create any users who don't exist yet
    new_user_ids = []
    new_emails = [email for email in user_emails if email_id_map.get(email) is None]
    new_users = [
        User(
            email=email,
            hashed_password=_password_helper.hash(_password_helper.generate()),
        )
        for email in new_emails
    ]
    if len(new_users) > 0:
        inserted_users = await User.insert_many(new_users, ordered=True)
        new_user_ids = inserted_users.inserted_ids

    # update the email map
    email_id_map.update(
        {email: str(_id) for email, _id in zip(new_emails, new_user_ids)}
    )

    return email_id_map

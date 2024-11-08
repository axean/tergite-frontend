# This code is part of Tergite
#
# (C) Chalmers Next Labs AB 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

"""Routes for admin related operations"""
from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Query
from fastapi import status as http_status

from services.auth import (
    APP_TOKEN_AUTH,
    PaginatedListResponse,
    Project,
    User,
    user_requests,
)
from utils.mongodb import DocumentNotFoundError

from ...dependencies import CurrentSuperuserDep, CurrentUserDep, CurrentUserIdDep

router = APIRouter(prefix="/admin")

router.include_router(
    APP_TOKEN_AUTH.get_projects_router_v2(),
    prefix="/projects",
    tags=["projects"],
)


@router.get(
    "/qpu-time-requests", tags=["user-requests"], dependencies=[CurrentUserIdDep]
)
async def get_qpu_time_requests(
    project_ids: Optional[List[str]] = Query(None, alias="project_id"),
    status: Optional[user_requests.UserRequestStatus] = Query(None),
    skip: int = Query(0),
    limit: Optional[int] = Query(None),
):
    """Retrieves the qpu time requests filtered by the given query params"""
    filters = {}
    if isinstance(project_ids, list):
        filters["request.project_id"] = {"$in": project_ids}
    if status is not None:
        filters["status"] = status
    data = await user_requests.get_many_qpu_time_requests(
        filters, skip=skip, limit=limit
    )
    return PaginatedListResponse(
        data=[item.dict() for item in data], skip=skip, limit=limit
    )


@router.post(
    "/qpu-time-requests",
    tags=["user-requests"],
    status_code=http_status.HTTP_201_CREATED,
)
async def create_qpu_time_request(
    request_body: user_requests.QpuTimeExtensionPostBody,
    requester: User = CurrentUserDep,
):
    """Creates a new QPU time request"""
    project = await Project.find_one(
        {
            "_id": PydanticObjectId(request_body.project_id),
            "user_ids": str(requester.id),
        }
    )
    if project is None:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN)

    request_body.project_name = project.name
    result = await user_requests.create_qpu_time_request(
        request_body=request_body,
        requester=requester,
    )
    return result.dict()


@router.get(
    "/user-requests", tags=["user-requests"], dependencies=[CurrentSuperuserDep]
)
async def get_user_requests(
    status: Optional[user_requests.UserRequestStatus] = Query(None),
    skip: int = Query(0),
    limit: Optional[int] = Query(None),
):
    """Gets the user requests that match the given filters"""
    filters = {}
    if status is not None:
        filters["status"] = status
    data = await user_requests.get_many(filters, skip=skip, limit=limit)
    return PaginatedListResponse(
        data=[item.dict() for item in data], skip=skip, limit=limit
    )


@router.put("/user-requests/{_id}", tags=["user-requests"])
async def update_user_request(
    _id: PydanticObjectId,
    body: user_requests.UserRequestUpdate,
    user: User = CurrentSuperuserDep,
):
    """Updates the user request of the given id with the body content

    This also does any necessary operations in case this update is an approval
    """
    try:
        result = await user_requests.update(_id, payload=body, admin_user=user)
        return result.dict()
    except DocumentNotFoundError as exp:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail=f"{exp}")

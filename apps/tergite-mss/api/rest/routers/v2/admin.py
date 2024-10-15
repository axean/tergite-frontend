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
from fastapi import APIRouter, HTTPException, Query, status

from services.auth import PaginatedListResponse, Project, user_requests

from ...dependencies import CurrentUserIdDep

router = APIRouter(prefix="/admin")


@router.get(
    "/qpu-time-requests/", tags=["user-requests"], dependencies=[CurrentUserIdDep]
)
async def get_qpu_time_requests(
    project_ids: Optional[List[str]] = Query(None, alias="project_id"),
    status: Optional[user_requests.UserRequestStatus] = Query(None),
    skip: int = Query(0),
    limit: Optional[int] = Query(None),
):
    """Retrieves the jobs belonging to the current user in the current project"""
    filters = {}
    if isinstance(project_ids, list):
        filters["request.project_id"] = {"$in": project_ids}
    if status is not None:
        filters["status"] = status
    data = await user_requests.get_many_qpu_time_requests(filters)
    return PaginatedListResponse(
        data=[item.dict() for item in data], skip=skip, limit=limit
    )


@router.post(
    "/qpu-time-requests/",
    tags=["user-requests"],
    status_code=status.HTTP_201_CREATED,
)
async def create_qpu_time_request(
    request_body: user_requests.QpuTimeExtensionPostBody,
    requester_id: str = CurrentUserIdDep,
):
    """Creates a new QPU time request"""
    project = await Project.find_one(
        {"_id": PydanticObjectId(request_body.project_id), "user_ids": requester_id}
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    result = await user_requests.create_qpu_time_request(
        request_body=request_body, requester_id=requester_id
    )
    return result.dict()

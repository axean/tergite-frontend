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
from typing import Any, Dict, List, Optional, Union

from beanie import PydanticObjectId

from .dtos import (
    QpuTimeExtensionPostBody,
    UserRequest,
    UserRequestStatus,
    UserRequestType,
)


async def get_many_qpu_time_requests(
    filter_obj: Optional[Dict[str, Any]] = None,
    skip: int = 0,
    limit: Optional[int] = None,
) -> List[UserRequest]:
    """Retrieves the user requests that match the given filter

    Args:
        filter_obj: the PyMongo-like filter object e.g. `{"approver_id": "some-guys-id"}`.
        skip: the number of matched records to skip
        limit: the maximum number of records to return.
                If None, all possible records are returned.

    Returns:
        the list of user request objects
    """
    _filter = {} if filter_obj is None else {**filter_obj}
    _filter.update({"type": UserRequestType.PROJECT_QPU_SECONDS})
    return await get_many(_filter, skip=skip, limit=limit)


async def create_qpu_time_request(
    request_body: QpuTimeExtensionPostBody, requester_id: Union[PydanticObjectId, str]
) -> UserRequest:
    """Creates a new user request given the request body, requester_id and request type

    Args:
        request_body: the POST body of the request
        requester_id: the ID of the user making the request

    Returns:
        the created UserRequest object
    """
    return await create(
        request_body=request_body,
        requester_id=str(requester_id),
        request_type=UserRequestType.PROJECT_QPU_SECONDS,
    )


async def get_many(
    filter_obj: Dict[str, Any], skip: int = 0, limit: Optional[int] = None
) -> List[UserRequest]:
    """Retrieves the user requests that match the given filter

    Args:
        filter_obj: the PyMongo-like filter object e.g. `{"type": "project-qpu-seconds"}`.
        skip: the number of matched records to skip
        limit: the maximum number of records to return.
                If None, all possible records are returned.

    Returns:
        the list of user request objects
    """
    return await UserRequest.find(filter_obj, skip=skip, limit=limit).to_list()


async def create(
    request_body: Union[QpuTimeExtensionPostBody, Dict[str, Any]],
    requester_id: Union[PydanticObjectId, str],
    request_type: UserRequestType,
) -> UserRequest:
    """Creates a new user request given the request body, requester_id and request type

    Args:
        request_body: the POST body of the request
        requester_id: the ID of the user making the request
        request_type: the type of request being made

    Returns:
        the created UserRequest object
    """
    record = UserRequest(
        request=request_body, requester_id=str(requester_id), type=request_type
    )
    await record.create()
    return record

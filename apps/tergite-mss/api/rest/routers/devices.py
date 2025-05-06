# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Abdullah-Al Amin 2022
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
#
# Refactored by Martin Ahindura - 2023-11-08, 2024-08-01


from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from api.rest.dependencies import CurrentSystemUserProjectDep, MongoDbDep
from services import devices
from services.devices.dtos import DeviceQuery
from utils.api import PaginatedListResponse

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("/")
async def read_many(
    db: MongoDbDep,
    query: DeviceQuery = Depends(),
    skip: int = 0,
    limit: Optional[int] = None,
    sort: List[str] = Query(("-created_at",)),
):
    """Gets a paginated list of devices that fulfill a given set of filters

    Args:
        db: the mongo db database from which to get the device data
        query: the query params for getting the device data
        skip: the number of records to skip
        limit: the maximum number of records to return
        sort: the fields to sort by, prefixing any with a '-' means descending; default = ("-created_at",)
            To add multiple fields to sort by, repeat the same query parameter in the url e.g. "query=tom&q=dick&q=harry"

    Returns:
        the paginated result of the matched device data
    """
    filters = query.model_dump()

    data = await devices.get_all_devices(
        db, filters=filters, skip=skip, limit=limit, sort=sort
    )

    return PaginatedListResponse(skip=skip, limit=limit, data=data).model_dump(
        mode="json", exclude_data_none_fields=False
    )


@router.get("/{name}")
async def read_one(db: MongoDbDep, name: str):
    record = await devices.get_one_device(db, name=name)
    return record.model_dump(mode="json")


@router.put("/")
async def upsert(
    db: MongoDbDep,
    user: CurrentSystemUserProjectDep,
    payload: devices.DeviceUpsert,
):
    """Creates a new backend if it does not exist already or updates it.

    It also appends this resultant backend config into the backends log.
    """
    record = await devices.upsert_device(db, payload=payload)
    return record.model_dump(mode="json")


@router.put("/{name}")
async def update(
    db: MongoDbDep, user: CurrentSystemUserProjectDep, name: str, body: dict
):
    """Updates the given backend with the new body supplied."""
    record = await devices.patch_device(db, name, payload=body)
    return record.model_dump(mode="json")

# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023
# (C) Copyright Chalmers Next Labs 2025
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.requests import Request

import settings
from api.rest.dependencies import (
    BccClientsMapDep,
    CurrentLaxProjectDep,
    CurrentStrictProjectDep,
    CurrentStrictProjectUserIds,
    MongoDbDep,
    ProjectDbDep,
)
from services import jobs as jobs_service
from services.external import puhuri as puhuri_service
from services.jobs.dtos import (
    JobCreate,
    JobStatusResponse,
    JobV2,
    JobV2Query,
    JobV2Update,
)
from utils.api import PaginatedListResponse, get_bearer_token
from utils.exc import UnknownBccError

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/")
async def get_many(
    db: MongoDbDep,
    project: CurrentLaxProjectDep,
    query: JobV2Query = Depends(),
    skip: int = 0,
    limit: Optional[int] = None,
    sort: List[str] = Query(("-created_at",)),
):
    """Gets a paginated list of jobs that fulfill a given set of filters

    Args:
        db: the mongo db database from which to get the job
        project: the current project that the associated API token is associated with
        query: the query params for getting the jobs
        skip: the number of records to skip
        limit: the maximum number of records to return
        sort: the fields to sort by, prefixing any with a '-' means descending; default = ("-created_at",)
            To add multiple fields to sort by, repeat the same query parameter in the url e.g. "query=tom&q=dick&q=harry"
    """
    filters = query.model_dump()
    data = await jobs_service.get_latest_many(
        db,
        filters=filters,
        limit=limit,
        sort=sort,
        skip=skip,
    )
    return PaginatedListResponse(skip=skip, limit=limit, data=data).model_dump(
        mode="json"
    )


@router.get("/{job_id}")
async def get_one(db: MongoDbDep, project: CurrentLaxProjectDep, job_id: UUID):
    """Gets the job of the given job_id

    Args:
        db: the mongo db database from which to get the job
        project: the current project that the associated API token is associated with
        job_id: the job_id of the job
    """
    return await jobs_service.get_one(db, job_id=job_id)


@router.get("/{job_id}/status")
async def get_job_status(db: MongoDbDep, project: CurrentLaxProjectDep, job_id: UUID):
    """Gets the status of the job for the given job_id

    Args:
        db: the mongo database to get the job data from
        project: the project associated to the API token that is passed during requests
        job_id: the ID of the job

    Returns:
        the status as one value

    Raises:
        utils.exc.NotFoundError: no matches for '{search_filter}'.
        ValidationError: the document does not satisfy the schema passed
    """
    job = await jobs_service.get_one(db, job_id=job_id)
    return JobStatusResponse.from_job(job)


@router.post("/")
async def create_one(
    request: Request,
    db: MongoDbDep,
    bcc_clients_map: BccClientsMapDep,
    project_user_id_pair: CurrentStrictProjectUserIds,
    payload: JobCreate,
):
    """Creates a job in the given backend and given calibration_date in the body"""
    app_token = get_bearer_token(
        request, raise_if_error=settings.CONFIG.auth.is_enabled
    )
    try:
        bcc_client = bcc_clients_map[payload.device]
    except KeyError:
        raise UnknownBccError(f"Unknown backend '{payload.device}'")

    project_id, user_id = project_user_id_pair
    job = JobV2(**payload.model_dump(), project_id=project_id, user_id=user_id)
    return await jobs_service.create_job(
        db, bcc_client=bcc_client, job=job, app_token=app_token
    )


@router.put("/{job_id}")
async def update_one(
    db: MongoDbDep,
    project_db: ProjectDbDep,
    project: CurrentStrictProjectDep,
    job_id: UUID,
    payload: JobV2Update,
):
    """Updates the job of the given job_id with the payload

    This may raise pydantic.error_wrappers.ValidationError in case
    the timestamps have an unexpected structure

    Returns:
        the updated job
    """
    old_job = await jobs_service.update_job(db, job_id=job_id, payload=payload)

    recorded_qpu_usage = getattr(old_job.timestamps, "resource_usage", None)
    qpu_usage = getattr(payload.timestamps, "resource_usage", None)

    if recorded_qpu_usage is None and qpu_usage is not None:
        project = await jobs_service.update_qpu_usage(
            db, project_db=project_db, job_id=job_id, qpu_usage=qpu_usage
        )

        if settings.CONFIG.puhuri.is_enabled:
            await puhuri_service.save_qpu_usage(
                db, job_id=job_id, project=project, qpu_usage=qpu_usage
            )
    return await jobs_service.get_one(db, job_id=job_id)

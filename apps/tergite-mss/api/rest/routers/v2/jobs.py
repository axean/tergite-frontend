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
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Query
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
from services.jobs import JobCreate, JobTimestamps, JobV2
from services.jobs.dtos import JobStatusResponse
from utils.api import PaginatedListResponse, get_bearer_token
from utils.exc import UnknownBccError

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}")
async def get_one(db: MongoDbDep, project: CurrentLaxProjectDep, job_id: UUID):
    """Gets the job of the given job_id

    Args:
        db: the mongo db database from which to get the job
        project: the current project that the associated API token is associated with
        job_id: the job_id of the job
    """
    return await jobs_service.get_one(db, job_id=job_id)


@router.get("/")
async def get_many(
    db: MongoDbDep,
    project: CurrentLaxProjectDep,
    query: Annotated[JobV2, Query()],
    skip: int = 0,
    limit: Optional[int] = None,
):
    """Gets a paginated list of jobs that fulfill a given set of filters

    Args:
        db: the mongo db database from which to get the job
        project: the current project that the associated API token is associated with
        query: the query params for getting the jobs
        skip: the number of records to skip
        limit: the maximum number of records to return
    """
    filters = query.model_dump(mode="json")
    data = await jobs_service.get_latest_many(db, filters=filters, limit=limit)
    return PaginatedListResponse(skip=skip, limit=limit, data=data).model_dump(
        mode="json"
    )


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
    device: str = "pingu",
    calibration_date: Optional[str] = None,
):
    """Creates a job in the given backend and given calibration_date"""
    app_token = get_bearer_token(
        request, raise_if_error=settings.CONFIG.auth.is_enabled
    )
    try:
        bcc_client = bcc_clients_map[device]
    except KeyError:
        raise UnknownBccError(f"Unknown backend '{device}'")

    project_id, user_id = project_user_id_pair
    job = JobCreate(
        backend=device,
        project_id=project_id,
        user_id=user_id,
        calibration_date=calibration_date,
    )
    return await jobs_service.create_job(
        db, bcc_client=bcc_client, job=job, app_token=app_token
    )


@router.put("/{job_id}")
async def update_one(
    db: MongoDbDep,
    project_db: ProjectDbDep,
    project: CurrentStrictProjectDep,
    job_id: UUID,
    payload: dict,
):
    """Updates the job of the given job_id with the payload

    This may raise pydantic.error_wrappers.ValidationError in case
    the timestamps have an unexpected structure

    Returns:
        the updated job
    """
    old_job = await jobs_service.update_job(db, job_id=job_id, payload=payload)
    old_timestamps: JobTimestamps = JobTimestamps.model_validate(
        old_job.get("timestamps", {})
    )
    if old_timestamps.resource_usage is not None:
        # FIXME: Fix the return type to be the newly updated job
        # if job's resource usage is already set
        return await jobs_service.get_one(db, job_id=job_id)

    # FIXME: Reduce the complexity here. Simplify getting the timestamps
    # FIXME: Simplify the conditionals
    # Retrieve timestamps if they have been passed as part of the update payload
    timestamps: Optional[JobTimestamps] = None
    if "timestamps" in payload:
        timestamps = JobTimestamps.model_validate(payload["timestamps"])
    elif "timestamps.execution" in payload:
        timestamps = JobTimestamps.model_validate(
            {"execution": payload["timestamps.execution"]}
        )

    if timestamps is not None:
        response = await jobs_service.update_resource_usage(
            db,
            project_db=project_db,
            job_id=job_id,
            timestamps=timestamps,
        )

        if settings.CONFIG.puhuri.is_enabled and response and response[0]:
            project, qpu_seconds = response
            await puhuri_service.save_job_resource_usage(
                db,
                job_id=str(job_id),
                project_id=project.ext_id,
                qpu_seconds=qpu_seconds,
            )

    return await jobs_service.get_one(db, job_id=job_id)

# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi import status as http_status
from fastapi.requests import Request

import settings
from api.rest.dependencies import (
    BccClientDep,
    CurrentLaxProjectDep,
    CurrentStrictProjectDep,
    MongoDbDep,
    ProjectDbDep,
)
from services import quantum_jobs as jobs_service
from services.quantum_jobs import JobTimestamps
from utils import mongodb as mongodb_utils
from utils.api import get_bearer_token

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}")
async def read_job(db: MongoDbDep, project: CurrentLaxProjectDep, job_id: UUID):
    """Gets the job for the given job_id"""
    try:
        return await jobs_service.get_one(db, job_id=job_id)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"job id {job_id} not found",
        )


@router.get("/{job_id}/result")
async def read_job_result(db: MongoDbDep, project: CurrentLaxProjectDep, job_id: UUID):
    """Gets the job result for the given job_id"""
    try:
        return await jobs_service.get_job_result(db, job_id=job_id)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"job id {job_id} not found",
        )
    except KeyError:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"job of id {job_id} has no result",
        )


@router.get("/{job_id}/download_url")
async def read_job_download_url(
    db: MongoDbDep, project: CurrentLaxProjectDep, job_id: UUID
):
    """Gets the job download_url for the given job_id"""
    try:
        return await jobs_service.get_job_download_url(db, job_id=job_id)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"job id {job_id} not found",
        )
    except KeyError:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"job of id {job_id} has no download_url",
        )


@router.post("")
async def create_job(
    request: Request,
    db: MongoDbDep,
    bcc_client: BccClientDep,
    project: CurrentStrictProjectDep,
    backend: str = "pingu",
):
    """Creates a job in the given backend"""
    app_token = get_bearer_token(request, raise_if_error=settings.IS_AUTH_ENABLED)
    return await jobs_service.create_job(
        db,
        bcc_client=bcc_client,
        backend=backend,
        project_id=project.id,
        app_token=app_token,
    )


@router.get("")
async def read_jobs(db: MongoDbDep, project: CurrentLaxProjectDep, nlast: int = 10):
    """Gets the latest jobs only upto the given nlast records"""
    return await jobs_service.get_latest_many(db, limit=nlast)


@router.put("/{job_id}")
async def update_job(
    db: MongoDbDep,
    project_db: ProjectDbDep,
    project: CurrentStrictProjectDep,
    job_id: UUID,
    payload: dict,
):
    """Updates the result of the job with the given memory object

    This may raise pydantic.error_wrappers.ValidationError in case
    the timestamps have an unexpected structure
    """
    try:
        await jobs_service.update_job(db, job_id=job_id, payload=payload)
        if "timestamps" in payload:
            timestamps = JobTimestamps.parse_obj(payload["timestamps"])
            await jobs_service.update_resource_usage(
                db,
                project_db=project_db,
                job_id=job_id,
                timestamps=timestamps,
            )
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"job id {job_id} or its project not found",
        )

    return "OK"

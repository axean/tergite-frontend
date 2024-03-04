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
from typing import TYPE_CHECKING, Any, Dict, Optional, Tuple
from uuid import UUID, uuid4

from beanie import PydanticObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

import settings
from services.external.bcc import BccClient
from utils import mongodb as mongodb_utils
from utils.date_time import get_current_timestamp

from ..auth import Project
from .dtos import CreatedJobResponse, JobTimestamps

if TYPE_CHECKING:
    from ..auth.projects.database import ProjectDatabase


async def get_one(db: AsyncIOMotorDatabase, job_id: UUID):
    """Gets a job by job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the `job_id` of the job to be returned

    Raises:
        utils.mongodb.DocumentNotFoundError: No documents matching the filter '{search_filter}'
           were found in the '{collection}' collection.

    Returns:
        the job as a dict
    """
    return await mongodb_utils.find_one(db.jobs, {"job_id": str(job_id)})


async def get_job_result(db: AsyncIOMotorDatabase, job_id: UUID) -> Dict[str, Any]:
    """Retrieves the result of the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the `job_id` of the job to be returned

    Raises:
        utils.mongodb.DocumentNotFoundError: No documents matching the filter '{search_filter}'
           were found in the '{collection}' collection.
        KeyError: 'result'

    Returns:
        the result as a dict
    """
    document = await get_one(db, job_id=job_id)

    # helper printout with first 5 outcomes
    # FIXME: Probably come up with a standard schema for jobs
    print("Measurement results:")
    memory = document["result"]["memory"]
    for experiment_memory in memory:
        s = str(experiment_memory[:5])
        if experiment_memory[5:6]:
            s = s.replace("]", ", ...]")
        print(s)

    return document["result"]


async def get_job_download_url(db: AsyncIOMotorDatabase, job_id: UUID):
    """Retrieves the download url of the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the `job_id` of the job to be returned

    Raises:
        utils.mongodb.DocumentNotFoundError: No documents matching the filter '{search_filter}'
           were found in the '{collection}' collection.
        KeyError: 'download_url'

    Returns:
        the result as a dict
    """
    document = await get_one(db, job_id=job_id)
    return document["download_url"]


async def create_job(
    db: AsyncIOMotorDatabase,
    bcc_client: BccClient,
    backend: str,
    project_id: Optional[PydanticObjectId] = None,
    app_token: Optional[str] = None,
) -> CreatedJobResponse:
    """Creates a new job for the given backend

    Args:
        db: the mongo database from where to create the job
        bcc_client: the HTTP client for accessing BCC
        backend: the backend where the job is to run
        project_id: the ID of the project to which this job is attached
        app_token: the associated with this new job. It is None if no auth is required

    Returns:
        the created job details

    Raises:
            ValueError: job id '{job_id}' already exists
                See :meth:`utils.http_clients.BccClient.save_credentials`
            ServiceUnavailableError: backend is currently unavailable.
                See :meth:`utils.http_clients.BccClient.save_credentials`
    """
    job_id = f"{uuid4()}"
    logging.info(f"Creating new job with id: {job_id}")
    project_id = str(project_id) if project_id is not None else None

    document = {
        "job_id": job_id,
        "project_id": project_id,
        "status": "REGISTERING",
        "backend": backend,
    }

    await bcc_client.save_credentials(job_id=job_id, app_token=f"{app_token}")
    await mongodb_utils.insert_one(collection=db.jobs, document=document)

    return {
        "job_id": job_id,
        "upload_url": f"{settings.BCC_MACHINE_ROOT_URL}/jobs",
    }


async def get_latest_many(db: AsyncIOMotorDatabase, limit: int = 10):
    """Retrieves the latest jobs up to the given limit

    Args:
        db: the mongo database from where to get the jobs
        limit: maximum number of records to return
    """
    return await mongodb_utils.find_all(
        db.jobs, limit=limit, **mongodb_utils.LATEST_FIRST_SORT
    )


async def update_job_result(db: AsyncIOMotorDatabase, job_id: UUID, memory: list):
    """Updates the memory part of the result of the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the job id of the job
        memory: the new memory data to insert into the result of job

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {"job_id": job_id} were found
    """
    return await mongodb_utils.update_many(
        db.jobs,
        _filter={"job_id": str(job_id)},
        payload={"result": {"memory": memory}},
    )


# FIXME: the status might be better modelled as an enum
async def update_job_status(db: AsyncIOMotorDatabase, job_id: UUID, status: str):
    """Updates the memory part of the result of the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the job id of the job
        status: the new status of the job

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {"job_id": job_id} were found
    """
    return await mongodb_utils.update_many(
        db.jobs,
        _filter={"job_id": str(job_id)},
        payload={"status": status},
    )


async def update_job_download_url(db: AsyncIOMotorDatabase, job_id: UUID, url: str):
    """Updates the download_url the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the job id of the job
        url: the new download url of the job

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {"job_id": job_id} were found
    """
    return await mongodb_utils.update_many(
        db.jobs,
        _filter={"job_id": str(job_id)},
        payload={"download_url": url},
    )


async def refresh_timelog_entry(
    db: AsyncIOMotorDatabase, job_id: UUID, event_name: str
):
    """Updates the timelog the job of the given job_id to the current timestamp

    Args:
        db: the mongo database from where to get the job
        job_id: the job id of the job
        event_name: the name of the event whose timelog is to be refreshed

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {"job_id": job_id} were found
    """
    timestamp = get_current_timestamp()
    return await mongodb_utils.update_many(
        db.jobs,
        _filter={"job_id": str(job_id)},
        payload={"timelog." + event_name: timestamp},
    )


async def update_job(db: AsyncIOMotorDatabase, job_id: UUID, payload: dict) -> dict:
    """Updates the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the job id of the job
        payload: the new payload to update in job

    Returns:
        the job document before it was modified

    Raises:
        DocumentNotFoundError: no documents matching {"job_id": job_id} were found
    """
    return await mongodb_utils.update_one(
        db.jobs,
        _filter={"job_id": str(job_id)},
        payload=payload,
    )


async def update_resource_usage(
    db: AsyncIOMotorDatabase,
    project_db: "ProjectDatabase",
    job_id: UUID,
    timestamps: JobTimestamps,
) -> Optional[Tuple[Project, float]]:
    """Updates the resource usage for the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        project_db: the ProjectDatabase instance where projects are found
        job_id: the job id of the job
        timestamps: the collection of timestamps for the given job

    Return:
        tuple of the updated project and the qpu seconds used if the update happened or None if it didn't

    Raises:
        utils.mongodb.DocumentNotFoundError: No documents matching the filter '{"job_id": job_id}'
           were found in the 'jobs' collection.
        utils.mongodb.DocumentNotFoundError: project '{project_id}' for job '{job_id}' not found
        KeyError: 'project_id'
    """
    qpu_seconds_used = timestamps.resource_usage
    if qpu_seconds_used is None:
        # no need to update resource usage is timestamps are None
        return None

    job = await get_one(db, job_id=job_id)
    project_id = job["project_id"]
    project = await project_db.increment_qpu_seconds(
        project_id=project_id, qpu_seconds=-qpu_seconds_used
    )
    if project is None:
        raise mongodb_utils.DocumentNotFoundError(
            f"project '{project_id}' for job '{job_id}' not found"
        )
    return project, qpu_seconds_used

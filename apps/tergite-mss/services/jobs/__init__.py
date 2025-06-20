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
import logging
from typing import TYPE_CHECKING, List, Mapping, Optional, Tuple
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from services.external.bcc import BccClient
from utils import mongodb as mongodb_utils
from utils.exc import NotFoundError

from ..auth import Project
from .dtos import CreatedJobResponse, Job, JobCreate, JobTimestamps, JobUpdate

if TYPE_CHECKING:
    from ..auth.projects.database import ProjectDatabase


async def get_one(db: AsyncIOMotorDatabase, job_id: UUID) -> Job:
    """Gets a job by job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the `job_id` of the job to be returned

    Raises:
        utils.exc.NotFoundError: no matches for '{search_filter}'.
        ValidationError: the document does not satisfy the schema passed

    Returns:
        the job as a dict
    """
    return await mongodb_utils.find_one(
        db.jobs, {"job_id": str(job_id)}, schema=Job, dropped_fields=("_id",)
    )


async def create_job(
    db: AsyncIOMotorDatabase,
    bcc_client: BccClient,
    job: Job,
    app_token: Optional[str] = None,
) -> CreatedJobResponse:
    """Creates a new job for the given backend

    Args:
        db: the mongo database from where to create the job
        bcc_client: the HTTP client for accessing BCC
        job: the job object to create
        app_token: the associated with this new job. It is None if no auth is required

    Returns:
        the created job details

    Raises:
            ValueError: job id '{job_id}' already exists
                See :meth:`utils.http_clients.BccClient.save_credentials`
            ServiceUnavailableError: device is currently unavailable.
                See :meth:`utils.http_clients.BccClient.save_credentials`
    """
    logging.info(f"Creating new job with id: {job.job_id}")
    await bcc_client.save_credentials(job_id=job.job_id, app_token=f"{app_token}")
    await mongodb_utils.insert_one(collection=db.jobs, document=job.model_dump())

    upload_url = _without_special_docker_host_domain(f"{bcc_client.base_url}/jobs")

    return {
        "job_id": job.job_id,
        "upload_url": upload_url,
    }


async def get_latest_many(
    db: AsyncIOMotorDatabase,
    filters: Optional[dict] = None,
    limit: Optional[int] = None,
    skip: int = 0,
    exclude: Tuple[str] = (),
    sort: List[str] = (),
) -> List[Job]:
    """Retrieves the latest jobs up to the given limit

    Args:
        db: the mongo database from where to get the jobs
        filters: the mongodb like filters which all returned records should satisfy
        limit: maximum number of records to return; default = None meaning all of them
        skip: the number of records to skip; default = 0
        exclude: the fields to exclude
        sort: the fields to sort by, prefixing any with a '-' means descending; default = ()
    """
    return await mongodb_utils.find(
        db.jobs,
        filters=filters,
        exclude=exclude,
        limit=limit,
        skip=skip,
        sort=sort,
        schema=Job,
        skip_validation=True,
    )


async def update_job(db: AsyncIOMotorDatabase, job_id: UUID, payload: JobUpdate) -> Job:
    """Updates the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        job_id: the job id of the job
        payload: the new payload to update in job

    Returns:
        the job before it was modified

    Raises:
        NotFoundError: no documents matching {"job_id": job_id} were found
    """
    document = await mongodb_utils.update_one(
        db.jobs,
        _filter={"job_id": str(job_id)},
        payload=payload.model_dump(),
        return_document=ReturnDocument.BEFORE,
    )
    return Job.model_validate(document)


async def update_qpu_usage(
    db: AsyncIOMotorDatabase,
    project_db: "ProjectDatabase",
    job_id: UUID,
    qpu_usage: float,
) -> Optional[Project]:
    """Updates the resource usage for the job of the given job_id

    Args:
        db: the mongo database from where to get the job
        project_db: the ProjectDatabase instance where projects are found
        job_id: the job id of the job
        qpu_usage: the resource usage in seconds

    Return:
        the updated project if the job was attached to a project, else None

    Raises:
        utils.exc.NotFoundError: no matches for '{"job_id": job_id}'.
        utils.exc.NotFoundError: project '{project_id}' for job '{job_id}' not found
        KeyError: 'project_id'
    """
    job = await get_one(db, job_id=job_id)
    project_id = job.project_id
    project = await project_db.increment_qpu_seconds(
        project_id=project_id, qpu_seconds=-qpu_usage
    )
    if project is None and project_id is not None:
        raise NotFoundError(f"project '{project_id}' for job '{job_id}' not found")
    return project


def _without_special_docker_host_domain(url: str) -> str:
    """Removes the docker host's URL special domain 'host.docker.internal'

    This is useful when the url is to be used by an application outside
    the docker instance on which this frontend is running

    Args:
        url: the URL that might contain the docker host's special domain

    Returns:
        the URL updated with the special 'host.docker.internal' removed
    """
    return url.replace("host.docker.internal", "127.0.0.1")

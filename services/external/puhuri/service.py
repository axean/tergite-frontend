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
"""Service for synchronizing with Puhuri, an HPC resource allocation management service

See: https://puhuri.neic.no/SDK%20guide/allocation-management-sp/#getting-a-list-of-resource-allocations

polling is to be done using apscheduler

This client is useful to enable the following user stories
- Puhuri project admin can create new projects that have QAL 9000 offering indirectly in MSS (polling every few minutes or so)
- Puhuri project admin can add new users to a project indirectly in QAL 9000 if that project has a QAL 9000 offering
- Puhuri project admin can order for new QPU seconds for the QAL 9000 and be allocated the same extra QPU seconds in QAL 9000 indirectly
- Puhuri project admin can view the QPU seconds left in their project since QAL 9000 updates Puhuri of per-project 
    resource usage at a given interval or the moment an experiment is done
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import aiohttp
from apscheduler.schedulers.base import BaseScheduler
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReplaceOne
from pymongo.errors import BulkWriteError
from waldur_client import ComponentUsage, WaldurClient

import settings
from utils.mongodb import get_mongodb

from ...auth.projects.dtos import PROJECT_DB_COLLECTION
from .dtos import (
    RESOURCE_USAGE_COLLECTION,
    PuhuriResource,
    PuhuriUsageReport,
    ResourceUsagePost,
)
from .exc import ResourceNotFoundError
from .utils import (
    get_default_component,
    get_project_resources,
    resubmit_usage_report,
    submit_usage_report,
)

# FIXME: To handle usage-based projects, we might need to add a flag like is_prepaid
#   on the project model in the database such that authentication does not fail for
#   projects that have is_prepaid as False

# FIXME: Also to total up a project's qpu_seconds after retrieving data from puhuri,
#   we might need to sum up the "limit" properties.

# FIXME: Question: How does one get the remaining amount of resource from a limit-based
#   resource in puhuri?


def update_internal_project_list(
    api_uri: str = settings.PUHURI_WALDUR_API_URI,
    api_access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
    db_url: str = f"{settings.DB_MACHINE_ROOT_URL}",
    db_name: str = settings.DB_NAME,
    db_collection: str = PROJECT_DB_COLLECTION,
):
    """Updates the projects list in this app with the latest projects in puhuri

    This is typically run in the background if puhuri synchronization is enabled via the
    `IS_PUHURI_SYNC_ENABLED` environment flag.

    Args:
        api_uri: the URI to the Puhuri Waldur server API
        api_access_token: the access token to be used to access the Waldur server API
        db_url: the mongodb URI to the database where projects are stored
        db_name: the name of the database where the projects are stored
        db_collection: the name of the collection where the projects are stored

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    pass


def update_internal_user_list(
    api_uri: str = settings.PUHURI_WALDUR_API_URI,
    api_access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
    db_url: str = f"{settings.DB_MACHINE_ROOT_URL}",
    db_name: str = settings.DB_NAME,
    db_collection: str = PROJECT_DB_COLLECTION,
):
    """Updates the user email list in each project in this app using the user list in puhuri

    This is usually run in the background if puhuri synchronization is enabled via the
    `IS_PUHURI_SYNC_ENABLED` environment flag.

    Args:
        api_uri: the URI to the Puhuri Waldur server API
        api_access_token: the access token to be used to access the Waldur server API
        db_url: the mongodb URI to the database where projects are stored
        db_name: the name of the database where the projects are stored
        db_collection: the name of the collection where the projects are stored

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    pass


def update_internal_resource_allocation(
    api_uri: str = settings.PUHURI_WALDUR_API_URI,
    api_access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
    db_url: str = f"{settings.DB_MACHINE_ROOT_URL}",
    db_name: str = settings.DB_NAME,
    db_collection: str = PROJECT_DB_COLLECTION,
):
    """Updates this app's project's resource allocation using puhuri's resource allocations

    This is usually run in the background if puhuri synchronization is enabled via the
    `IS_PUHURI_SYNC_ENABLED` environment flag.

    Args:
        api_uri: the URI to the Puhuri Waldur server API
        api_access_token: the access token to be used to access the Waldur server API
        db_url: the mongodb URI to the database where projects are stored
        db_name: the name of the database where the projects are stored
        db_collection: the name of the collection where the projects are stored

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    pass


async def send_resource_usage(
    db: AsyncIOMotorDatabase,
    api_client: WaldurClient,
    project_id: str,
    qpu_seconds: float,
    provider_uuid: str = settings.PUHURI_PROVIDER_UUID,
    db_collection: str = RESOURCE_USAGE_COLLECTION,
):
    """Sends the given resource usage to puhuri

    This is usually called after resource usage is reported to MSS
    by BCC. If it fails due to network errors, it is added to a list
    of failed resource usage posts and resent later in the background.

    Args:
        db: the mongodb client to the database where resource usage reports are stored
        api_client: Puhuri Waldur client for accessing the Puhuri Waldur server API
        project_id: the id of the project whose usage is to be reported
        qpu_seconds: the qpu seconds used
        provider_uuid: the unique ID of the service provider associated with this app in puhuri
        db_collection: the name of the collection where the resource usage reports are stored

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    resources = await get_project_resources(
        api_client, provider_uuid=provider_uuid, project_uuid=project_id
    )
    if len(resources) == 0:
        raise ResourceNotFoundError(f"no resource found for project: {project_id}")

    selected_resource: Optional[PuhuriResource] = None
    component_type: Optional[str] = None
    usage_based_resources = []
    limit_based_resources = []

    for item in resources:
        if item.has_limits:
            limit_based_resources.append(item)
        else:
            usage_based_resources.append(item)

    if len(limit_based_resources) == 0:
        selected_resource = resources[0]

    for resource in limit_based_resources:
        unit_value = resource.plan_unit.to_seconds()
        limits_in_seconds = {k: v * unit_value for k, v in resource.limits.items()}

        for key, limit in limits_in_seconds.items():
            if limit >= qpu_seconds:
                selected_resource = resource
                component_type = key
                break

        if selected_resource is not None:
            break

    if selected_resource is None:
        try:
            selected_resource = usage_based_resources[0]
        except IndexError:
            selected_resource = limit_based_resources[0]

    if component_type is None:
        default_component = await get_default_component(
            api_client, offering_uuid=selected_resource.offering_uuid
        )
        component_type = default_component.type

    usage_report = PuhuriUsageReport(
        resource=selected_resource.uuid,
        date=datetime.utcnow().isoformat(),
        plan_period=selected_resource.plan_uuid,
        usages=[
            ComponentUsage(
                type=component_type,
                amount=selected_resource.plan_unit.from_seconds(qpu_seconds),
            )
        ],
    )

    try:
        await submit_usage_report(
            customer_uuid=selected_resource.customer_uuid, usage_report=usage_report
        )
    except Exception as exp:
        logging.error(exp)
        # FIXME: Save the usage report for another attempt later
        timestamp = datetime.now(timezone.utc)
        report_usage_post = ResourceUsagePost(
            customer_uuid=selected_resource.customer_uuid,
            payload=usage_report,
            attempts=1,
            failure_reasons=[f"{exp}"],
            created_on=timestamp,
            last_modified_on=timestamp,
        )
        await db[db_collection].insert_one(report_usage_post.dict(exclude={"id"}))


async def retry_failed_resource_usage_posts(
    api_uri: str = settings.PUHURI_WALDUR_API_URI,
    api_access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
    db_url: str = f"{settings.DB_MACHINE_ROOT_URL}",
    db_name: str = settings.DB_NAME,
    db_collection: str = RESOURCE_USAGE_COLLECTION,
    max_attempts: int = settings.MAX_PUHURI_SUBMISSION_ATTEMPTS,
    secret_code: str = settings.PUHURI_PROVIDER_SECRET_CODE,
):
    """Tries to resend resource usage that failed to be sent

    This is usually run in the background if puhuri synchronization is enabled via the
    `IS_PUHURI_SYNC_ENABLED` environment flag.
    Everytime a resource usage post is retried, its number of attempts is
    incremented, for audit purposes.

    Args:
        api_uri: the URI to the Puhuri Waldur server API
        api_access_token: the access token to be used to access the Waldur server API
        db_url: the mongodb URI to the database where resource usage reports are stored
        db_name: the name of the database where the resource usage reports are stored
        db_collection: the name of the collection where the resource usage reports are stored
        max_attempts: the maximum number of times a given failed post should be tried
        secret_code: the secret code for the service provider associated with this app in puhuri

    """
    db: AsyncIOMotorDatabase = get_mongodb(url=db_url, name=db_name)
    posts_collection = db[db_collection]
    filter_obj = {"is_success": False, "attempts": {"$lt": max_attempts}}
    headers = {"Authorization": f"Token {api_access_token}"}
    async with aiohttp.ClientSession(base_url=api_uri, headers=headers) as session:
        tasks = [
            resubmit_usage_report(session, item, secret_code)
            async for item in posts_collection.find(filter_obj)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    db_operations = [
        ReplaceOne({"_id": item.id}, item.dict())
        for item in results
        if isinstance(item, ResourceUsagePost)
    ]

    try:
        await posts_collection.bulk_write(db_operations, ordered=False)
    except BulkWriteError as exp:
        logging.error(exp)


def register_background_tasks(
    scheduler: BaseScheduler,
    poll_interval_mins: float = settings.PUHURI_POLL_INTERVAL_MINS,
):
    """Registers the background tasks for the puhuri service on the given scheduler

    Args:
        scheduler: the scheduler to run the tasks in the background
        poll_interval_mins: the interval at which puhuri is to be polled in minutes. default is 15
    """
    scheduler.add_job(
        update_internal_project_list,
        "interval",
        minutes=poll_interval_mins,
    )

    scheduler.add_job(
        update_internal_user_list,
        "interval",
        minutes=poll_interval_mins,
    )

    scheduler.add_job(
        update_internal_resource_allocation,
        "interval",
        minutes=poll_interval_mins,
    )

    scheduler.add_job(
        retry_failed_resource_usage_posts,
        "interval",
        minutes=poll_interval_mins,
    )

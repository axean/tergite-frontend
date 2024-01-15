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
from typing import Any, Dict, Optional, Tuple

import aiohttp
from apscheduler.schedulers.base import BaseScheduler
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReplaceOne
from pymongo.errors import BulkWriteError
from waldur_client import ComponentUsage, WaldurClient

import settings
from utils.mongodb import get_mongodb

from ...auth.projects.dtos import PROJECT_DB_COLLECTION
from .dtos import (
    REQUEST_FAILURES_COLLECTION,
    RESOURCE_USAGE_COLLECTION,
    JobResourceUsage,
    PuhuriComponent,
    PuhuriFailedRequest,
    PuhuriResource,
)
from .exc import ResourceNotFoundError
from .utils import (
    approve_pending_orders,
    get_accounting_component,
    get_default_component,
    get_plan_periods,
    get_project_resources,
    send_component_usages,
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


async def save_job_resource_usage(
    db: AsyncIOMotorDatabase,
    api_client: WaldurClient,
    job_id: str,
    project_id: str,
    qpu_seconds: float,
    provider_uuid: str = settings.PUHURI_PROVIDER_UUID,
    db_collection: str = RESOURCE_USAGE_COLLECTION,
):
    """Saves the given job resource usage

    This is usually called after resource usage is reported to MSS
    by BCC.

    It may be later sent to an external resource monitoring service.

    Args:
        db: the mongodb client to the database where job resource usages are stored
        api_client: Puhuri Waldur client for accessing the Puhuri Waldur server API
        job_id: the ID of the given job
        project_id: the id of the project whose usage is to be reported
        qpu_seconds: the qpu seconds used
        provider_uuid: the unique ID of the service provider associated with this app in puhuri
        db_collection: the name of the collection where the job resource usages are stored

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    await approve_pending_orders(
        client=api_client,
        provider_uuid=provider_uuid,
    )

    resources = await get_project_resources(
        api_client,
        provider_uuid=provider_uuid,
        project_uuid=project_id,
    )

    if len(resources) == 0:
        raise ResourceNotFoundError(f"no resource found for project: {project_id}")

    # the resource whose usage is to be updated
    selected_resource: Optional[PuhuriResource] = None
    # the accounting component to use when send resource usage.
    # Note: project -> many resources -> each with an (accounting) plan
    #           -> each with multiple (accounting) components
    # Note: the limit-based resources have a dictionary of "limits" with keys as the "internal names" or
    #   "types" of the components
    #   and the values as the maximum amount for that component. This amount is in units of that component
    #   e.g. 10 for one component, might mean 10 days, while for another it might mean 10 minutes depending
    #   on the 'measurement_unit' of that component.
    #   We will select the component whose limit (in seconds) >= the usage
    selected_component: Optional[PuhuriComponent] = None

    usage_based_resources = []
    limit_based_resources = []

    for item in resources:
        if item.has_limits:
            limit_based_resources.append(item)
        else:
            usage_based_resources.append(item)

    if len(limit_based_resources) == 0:
        selected_resource = resources[0]

    # a cache for components to avoid querying for same component
    # more than once
    components_cache: Dict[Tuple[str, str], PuhuriComponent] = {}

    for resource in limit_based_resources:
        # offering_uuid = resource.offering_uuid

        for comp_type, comp_amount in resource.limits.items():
            component = get_accounting_component(
                client=api_client,
                offering_uuid=resource.offering_uuid,
                component_type=comp_type,
                cache=components_cache,
            )

            unit_value = component.measured_unit.to_seconds()
            limit_in_seconds = comp_amount * unit_value

            # select resource which has at least one limit (or purchased QPU seconds)
            # greater or equal to the seconds to be reported.
            if limit_in_seconds >= qpu_seconds:
                selected_resource = resource
                selected_component = component
                break

        if selected_resource is not None:
            break

    # if there is no selected resource yet, get the first usage-based resource
    #  and resort to the first limit-based resource only if there is no usage-based resource
    if selected_resource is None:
        try:
            selected_resource = usage_based_resources[0]
        except IndexError:
            selected_resource = limit_based_resources[0]

    if selected_component is None:
        selected_component = await get_default_component(
            api_client, offering_uuid=selected_resource.offering_uuid
        )

    now = datetime.now(tz=timezone.utc)
    month = now.month
    year = now.year
    plan_periods = await get_plan_periods(
        client=api_client,
        resource_uuid=selected_resource.uuid,
        month_year=(month, year),
    )
    # get the last plan period in the month, assuming that it is the latest
    plan_period = plan_periods[-1]

    component_amount = selected_component.measured_unit.from_seconds(qpu_seconds)
    job_resource_usage = JobResourceUsage(
        job_id=job_id,
        created_on=now,
        month=month,
        year=year,
        plan_period_uuid=plan_period.uuid,
        component_type=selected_component.type,
        component_amount=component_amount,
        qpu_seconds=qpu_seconds,
    )
    await db[db_collection].insert_one(job_resource_usage.dict())


async def post_resource_usages(
    api_uri: str = settings.PUHURI_WALDUR_API_URI,
    api_access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
    db_url: str = f"{settings.DB_MACHINE_ROOT_URL}",
    db_name: str = settings.DB_NAME,
    usages_collection: str = RESOURCE_USAGE_COLLECTION,
    failures_collection: str = REQUEST_FAILURES_COLLECTION,
):
    """Sends the resource usages for the current month over to Puhuri

    Remember that Puhuri expects only one usage report per resource per month
    Thus we need to aggregate the JobResourceUsage's first

    Args:
        api_uri: the URI to the Puhuri Waldur server API
        api_access_token: the access token to be used to access the Waldur server API
        db_url: the mongodb URI to the database where resource usages are stored
        db_name: the name of the database where the resource usages are stored
        usages_collection: the name of the collection where the job resource usages are stored
        failures_collection: the name of the collection where the failed puhuri requests are stored
    """
    now = datetime.now(tz=timezone.utc)
    db: AsyncIOMotorDatabase = get_mongodb(url=db_url, name=db_name)
    client = WaldurClient(api_url=api_uri, access_token=api_access_token)
    pipeline = {
        "$match": {"month": now.month, "year": now.year},
        "$group": {
            "_id": {
                "plan_period_uuid": "$plan_period_uuid",
                "component_type": "$component_type",
            },
            "amount": {"$sum": "$component_amount"},
            "qpu_seconds": {"$sum": "$qpu_seconds"},
        },
    }

    db_cursor = db[usages_collection].aggregate(pipeline)
    tasks = (
        send_component_usages(
            client,
            plan_period_uuid=item["_id"]["plan_period_uuid"],
            usages=[
                ComponentUsage(
                    type=item["_id"]["component_type"],
                    amount=item["amount"],
                    description=f"{item['qpu_seconds']} QPU seconds",
                )
            ],
        )
        async for item in db_cursor
    )
    results = await asyncio.gather(tasks, return_exceptions=True)

    # save any errors
    failures = [
        item.dict() for item in results if isinstance(item, PuhuriFailedRequest)
    ]
    await db[failures_collection].insert_many(failures)


def register_background_tasks(
    scheduler: BaseScheduler,
    poll_interval: float = settings.PUHURI_POLL_INTERVAL,
):
    """Registers the background tasks for the puhuri service on the given scheduler

    Args:
        scheduler: the scheduler to run the tasks in the background
        poll_interval: the interval at which puhuri is to be polled in seconds. default is 900 (15 minutes)
    """
    scheduler.add_job(
        approve_pending_orders,
        "interval",
        seconds=poll_interval,
    )

    scheduler.add_job(
        update_internal_project_list,
        "interval",
        seconds=poll_interval,
    )

    scheduler.add_job(
        update_internal_user_list,
        "interval",
        seconds=poll_interval,
    )

    scheduler.add_job(
        update_internal_resource_allocation,
        "interval",
        seconds=poll_interval,
    )

    scheduler.add_job(
        post_resource_usages,
        "interval",
        seconds=poll_interval,
    )


async def on_startup(db: AsyncIOMotorDatabase):
    """Runs init operations when the application is starting up"""
    await init_beanie(
        database=db,
        document_models=[
            PuhuriFailedRequest,
            JobResourceUsage,
        ],
    )

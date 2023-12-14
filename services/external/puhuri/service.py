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

from apscheduler.schedulers.base import BaseScheduler
from motor.motor_asyncio import AsyncIOMotorDatabase
from waldur_client import WaldurClient

import settings

from ...auth.projects.dtos import PROJECT_DB_COLLECTION
from .dtos import RESOURCE_USAGE_COLLECTION
from .utils import get_project_resources

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
    loop = asyncio.get_event_loop()
    resources = await loop.run_in_executor(
        None, get_project_resources, api_client, provider_uuid, project_id
    )
    pass


def retry_failed_resource_usage_posts(
    api_uri: str = settings.PUHURI_WALDUR_API_URI,
    api_access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
    db_url: str = f"{settings.DB_MACHINE_ROOT_URL}",
    db_name: str = settings.DB_NAME,
    db_collection: str = RESOURCE_USAGE_COLLECTION,
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

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    pass


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

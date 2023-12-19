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
"""Utilities for use in the puhuri external service
"""
import asyncio
from functools import lru_cache
from typing import Dict, List

import aiohttp
import jwt
from waldur_client import WaldurClient

import settings

from .dtos import (
    OrderItem,
    PuhuriComponent,
    PuhuriOrder,
    PuhuriProviderOffering,
    PuhuriResource,
    PuhuriUsageReport,
    ResourceUsagePost,
)
from .exc import ComponentNotFoundError, UsageSubmissionError


@lru_cache()
def get_client(
    uri: str = settings.PUHURI_WALDUR_API_URI,
    access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
) -> WaldurClient:
    """Retrieves the client used to access Puhuri

    This function is currently cached.

    Args:
        uri: the API base URL for the Waldur instance
        access_token: the API token of the user with `service provider manager` role

    Returns:
        the Waldur client instance
    """
    return WaldurClient(uri, access_token=access_token)


async def get_new_orders(client: WaldurClient, offering_id: str) -> List["PuhuriOrder"]:
    """Retrieves the latest orders for the offering associated with MSS on puhuri

    This is used to update our own project lists in MSS with the new additional qpu_seconds

    Args:
        client: the Waldur client for accessing the Puhuri Waldur server API
        offering_id: the unique ID of the resource that MSS is associated with in Waldur

    Returns:
        list of orders that are yet to be approved or rejected

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for PuhuriOrder ...
    """
    # FIXME: Which type of user can attempt to allocate resources for a given project?
    #       If any user, how do we check that a user has paid for the resource allocation before accepting the request
    #       Does Puhuri handle the billing and payment for us?
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        client.list_orders,
        {
            "marketplace_resource_uuid": offering_id,
            "state": "executing",
        },
    )
    return [PuhuriOrder.parse_obj(item) for item in response]


async def approve_orders(client: WaldurClient, orders: List[OrderItem]):
    """Approves the given orders

    Args:
        client: the Waldur client for accessing the Puhuri Waldur server API
        orders: the orders to approve
    """
    loop = asyncio.get_event_loop()
    return await asyncio.gather(
        loop.run_in_executor(
            None, client.marketplace_order_approve_by_provider, order.uuid
        )
        for order in orders
    )


def encode_data(data: dict, secret_code: str) -> str:
    """Encodes the data to be sent to the server to ensure it has come from the service provider

    Args:
        data: the data to be encoded
        secret_code: the secret code to use to JWT encode the data

    Returns:
        the JWT encoded data
    """
    return jwt.encode(data, secret_code, algorithm="HS256")


async def submit_usage_report(
    customer_uuid: str,
    usage_report: PuhuriUsageReport,
    api_url: str = settings.PUHURI_WALDUR_API_URI,
    access_code: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
    provider_secret_code: str = settings.PUHURI_PROVIDER_SECRET_CODE,
):
    """Submits usage report to Puhuri

    Args:
        customer_uuid: the customer's unique ID in puhuri
        usage_report: the usage report to submit
        api_url: the base URL of the Puhuri Waldur server
        access_code: the API key or access code of the user being used to submit to puhuri
        provider_secret_code: the secret code for the service provider associated with this app in puhuri

    Raises:
        UsageSubmissionError: response error ...
    """
    url = f"{api_url}/marketplace-public-api/set_usage/"
    data = {
        "customer": customer_uuid,
        "data": encode_data(data=usage_report.dict(), secret_code=provider_secret_code),
    }
    headers = {"Authorization": f"Token {access_code}"}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=data, headers=headers) as response:
            if not response.ok:
                raise UsageSubmissionError(f"{response.json()}")


async def resubmit_usage_report(
    aiohttp_session: aiohttp.ClientSession,
    previous_attempt: ResourceUsagePost,
    provider_secret_code: str = settings.PUHURI_PROVIDER_SECRET_CODE,
):
    """Retries a failed usage report submission to Puhuri

    Args:
        aiohttp_session: the aiohttp.ClientSession to use to make the requests
        previous_attempt: the previously failed submission attempt
        provider_secret_code: the secret code for the provider
    """
    url = "/marketplace-public-api/set_usage/"
    data = {
        "customer": previous_attempt.customer_uuid,
        "data": encode_data(
            data=previous_attempt.payload.dict(), secret_code=provider_secret_code
        ),
    }
    result = previous_attempt.copy()

    async with aiohttp_session.post(url, data=data) as response:
        if not response.ok:
            result.is_success = False
            failure_reason = _get_failure_message(response)
            result.failure_reasons.append(failure_reason)

    result.attempts += 1
    result.is_success = True

    return result


async def get_project_resources(
    client: WaldurClient, provider_uuid: str, project_uuid: str
) -> List[PuhuriResource]:
    """Gets the resource objects which has the given project_uuid and the given provider_uuid

    Args:
        client: the Waldur client for accessing Puhuri
        provider_uuid: the provider unique ID for this app, as got from Puhuri UI
        project_uuid: the project unique ID for the project
            whose resource are to be reported

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for PuhuriResource ...
    """
    loop = asyncio.get_event_loop()
    resource_dicts = await loop.run_in_executor(
        None,
        client.filter_marketplace_resources,
        dict(provider_uuid=provider_uuid, project_uuid=project_uuid),
    )

    return [PuhuriResource.parse_obj(item) for item in resource_dicts]


async def get_provider_offerings(
    client: WaldurClient, provider_uuid: str
) -> List[PuhuriProviderOffering]:
    """Gets the provider offerings for the given provider uuid

    Args:
        client: the Waldur client for accessing Puhuri
        provider_uuid: the provider unique ID for this app, as got from Puhuri UI

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for PuhuriProviderOffering ...
    """
    loop = asyncio.get_event_loop()
    offering_dicts = await loop.run_in_executor(
        None,
        client.list_marketplace_provider_offerings,
        dict(customer_uuid=provider_uuid),
    )

    return [PuhuriProviderOffering.parse_obj(item) for item in offering_dicts]


async def get_default_component(
    client: WaldurClient, offering_uuid: str
) -> PuhuriComponent:
    """Gets te default component, given an offering_uuid

    Args:
        client: the Waldur client for accessing Puhuri
        offering_uuid: the unique ID for the given offering

    Raises:
        WaldurClientException: error making request
        ComponentNotFoundError: f"offering '{offering_uuid}' has no components"
        pydantic.error_wrappers.ValidationError: {} validation error for PuhuriProviderOffering ...
    """
    loop = asyncio.get_event_loop()
    offering_dict = await loop.run_in_executor(
        None,
        client.get_marketplace_provider_offering,
        offering_uuid,
    )

    offering = PuhuriProviderOffering.parse_obj(offering_dict)
    if len(offering.components) == 0:
        raise ComponentNotFoundError(f"offering '{offering_uuid}' has no components")

    return offering.components[0]


def _get_failure_message(response: aiohttp.ClientResponse):
    """Extracts the failure message from the response

    Args:
        response: the aiohttp.ClientResponse to extract message from
    """
    try:
        return f"{response.status}: {response.json()}"
    except Exception:
        return f"{response.status}: {response.content}"

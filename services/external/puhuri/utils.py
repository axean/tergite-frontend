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
from typing import List

import aiohttp
import jwt
from waldur_client import WaldurClient

import settings

from .dtos import (
    OrderItem,
    PuhuriOrder,
    PuhuriProviderOffering,
    PuhuriResource,
    PuhuriUsageReport,
)


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
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
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
    """Submits usage report to Puhuri"""
    url = f"{api_url}/marketplace-public-api/set_usage/"
    data = {
        "customer": customer_uuid,
        "data": encode_data(data=usage_report.dict(), secret_code=provider_secret_code),
    }
    headers = {"Authorization": f"Token {access_code}"}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=data, headers=headers) as response:
            assert response.ok


def get_project_resources(
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
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    return [
        PuhuriResource.parse_obj(item)
        for item in client.filter_marketplace_resources(
            dict(provider_uuid=provider_uuid, project_uuid=project_uuid),
        )
    ]


def get_provider_offerings(
    client: WaldurClient, provider_uuid: str
) -> List[PuhuriProviderOffering]:
    """Gets the provider offerings for the given provider uuid

    Args:
        client: the Waldur client for accessing Puhuri
        provider_uuid: the provider unique ID for this app, as got from Puhuri UI

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
    """
    return [
        PuhuriProviderOffering.parse_obj(item)
        for item in client.list_marketplace_provider_offerings(
            dict(customer_uuid=provider_uuid),
        )
    ]

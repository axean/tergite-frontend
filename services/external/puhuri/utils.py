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
from dataclasses import asdict
from datetime import datetime, timezone
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

from waldur_client import ComponentUsage, WaldurClient

import settings
from utils.date_time import is_in_month

from .dtos import (
    OrderItem,
    PuhuriComponent,
    PuhuriFailedRequest,
    PuhuriOrder,
    PuhuriPlanPeriod,
    PuhuriProviderOffering,
    PuhuriResource,
)
from .exc import ComponentNotFoundError, PlanPeriodNotFoundError


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


async def approve_pending_orders(
    client: Optional[WaldurClient] = None,
    provider_uuid: str = settings.PUHURI_PROVIDER_UUID,
    api_url: str = settings.PUHURI_WALDUR_API_URI,
    access_token: str = settings.PUHURI_WALDUR_CLIENT_TOKEN,
):
    """Approves all pending orders for the given service provider

    Args:
        client: the WaldurClient if available
        provider_uuid: the UUID string of the service provider
        api_url: the URL to the Puhuri Waldur server API
        access_token: the access token to be used to access the Waldur server API

    Raises:
        WaldurClientException: error making request
    """
    if client is None:
        client = WaldurClient(
            api_url=api_url,
            access_token=access_token,
        )

    loop = asyncio.get_event_loop()
    filter_obj = {"state": "pending-provider", "provider_uuid": provider_uuid}
    order_items = await loop.run_in_executor(None, client.list_orders, filter_obj)
    await asyncio.gather(
        asyncio.wait(
            [
                loop.run_in_executor(
                    None, client.marketplace_order_approve_by_provider, order["uuid"]
                )
                for order in order_items
            ]
        ),
        loop=loop,
    )


async def send_component_usages(
    client: WaldurClient,
    plan_period_uuid: str,
    usages: List[ComponentUsage],
) -> Optional[PuhuriFailedRequest]:
    """Sends the component usages over to Puhuri

    Args:
        client: the Waldur client for accessing Puhuri
        plan_period_uuid: the unique ID for the plan period
        usages: the component usages to send

    Returns:
        PuhuriFailedRequest if the request fails
    """
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(
            None,
            client.create_component_usages,
            plan_period_uuid,
            usages,
        )
    except Exception as exp:
        return PuhuriFailedRequest(
            reason=f"{exp.__class__.__name__}: {exp}",
            method="create_component_usages",
            payload={
                "plan_period_uuid": plan_period_uuid,
                "usages": [asdict(v) for v in usages],
            },
            created_on=datetime.now(tz=timezone.utc),
        )


async def get_project_resources(
    client: WaldurClient,
    provider_uuid: str,
    project_uuid: str,
    state: str = "OK",
) -> List[PuhuriResource]:
    """Gets the resource objects which has the given project_uuid and the given provider_uuid

    Args:
        client: the Waldur client for accessing Puhuri
        provider_uuid: the provider unique ID for this app, as got from Puhuri UI
        project_uuid: the project unique ID for the project
            whose resource are to be reported
        state: the state of the resources to get e.g. "OK", "creating", "terminated" etc.

    Raises:
        WaldurClientException: error making request
        pydantic.error_wrappers.ValidationError: {} validation error for PuhuriResource ...
    """

    loop = asyncio.get_event_loop()
    resource_dicts = await loop.run_in_executor(
        None,
        client.filter_marketplace_resources,
        dict(
            provider_uuid=provider_uuid,
            project_uuid=project_uuid,
            state=state,
        ),
    )

    return [PuhuriResource.parse_obj(item) for item in resource_dicts]


# async def get_provider_offerings(
#     client: WaldurClient, provider_uuid: str
# ) -> List[PuhuriProviderOffering]:
#     """Gets the provider offerings for the given provider uuid
#
#     Args:
#         client: the Waldur client for accessing Puhuri
#         provider_uuid: the provider unique ID for this app, as got from Puhuri UI
#
#     Raises:
#         WaldurClientException: error making request
#         pydantic.error_wrappers.ValidationError: {} validation error for PuhuriProviderOffering ...
#     """
#     loop = asyncio.get_event_loop()
#     offering_dicts = await loop.run_in_executor(
#         None,
#         client.list_marketplace_provider_offerings,
#         dict(customer_uuid=provider_uuid),
#     )
#
#     return [PuhuriProviderOffering.parse_obj(item) for item in offering_dicts]


def get_accounting_component(
    client: WaldurClient,
    offering_uuid: str,
    component_type: str,
    cache: Optional[Dict[Tuple[str, str], PuhuriComponent]] = None,
) -> PuhuriComponent:
    """Gets the accounting component given the component type and the offering_uuid

    If the caches are provided, it attempts to extract the component
    from the cache if the cache is provided

    Args:
        client: the Waldur client for accessing Puhuri
        offering_uuid: the UUID string of the offering the component belongs to
        component_type: the type of the component
        cache: the dictionary cache that holds components,
            accessible by (offering_uuid, component_type) tuple

    Returns:
        the component
    """
    _cache = cache if isinstance(cache, dict) else {}
    component = _cache.get((offering_uuid, component_type))

    if component is None:
        offering = client.get_marketplace_provider_offering(offering_uuid)
        _cache.update(
            {
                (offering_uuid, v["type"]): PuhuriComponent.parse_obj(v)
                for v in offering["components"]
            }
        )
        component = _cache[(offering_uuid, component_type)]

    return component


async def get_default_component(
    client: WaldurClient, offering_uuid: str
) -> PuhuriComponent:
    """Gets the default component, given an offering_uuid.

    Here we get the first component that is associated with the given offering

    Args:
        client: the Waldur client for accessing Puhuri
        offering_uuid: the unique ID for the given offering

    Returns:
        the default puhuri component for the givne offering_uuid

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


async def get_plan_periods(
    client: WaldurClient,
    resource_uuid: str,
    month_year: Optional[Tuple[int, int]] = None,
) -> List[PuhuriPlanPeriod]:
    """Gets the plan periods, given a resource_uuid and month.

    Note that the months start at 1 i.e. January = 1, February = 2, ...

    Args:
        client: the Waldur client for accessing Puhuri
        resource_uuid: the unique ID for the given resource
        month_year: the (month, year) pair that the plan periods should be for; if None, all are returned.

    Returns:
        list of PuhuriPlanPeriod's for the given resource

    Raises:
        WaldurClientException: error making request
        PlanPeriodNotFoundError: f"offering '{offering_uuid}' has no components"
        pydantic.error_wrappers.ValidationError: {} validation error for PuhuriProviderOffering ...
    """
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(
        None,
        client.marketplace_resource_get_plan_periods,
        resource_uuid,
    )

    if isinstance(month_year, tuple):
        results = [v for v in results if is_in_month(month_year, v["start"])]

    if len(results) == 0:
        raise PlanPeriodNotFoundError(
            f"resource '{resource_uuid}' has no plan periods for month {month}"
        )

    return [PuhuriPlanPeriod.parse_obj(v) for v in results]

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

from waldur_client import WaldurClient

import settings

from .dtos import PuhuriOrder


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


async def get_new_orders(
    uri: str, access_token: str, offering_id: str
) -> List["PuhuriOrder"]:
    """Retrieves the latest orders for the offering associated with MSS on puhuri

    This is used to update our own project lists in MSS with the new additional qpu_seconds

    Args:
        uri: the API base URL for the Waldur instance
        access_token: the API token of the user with `service provider manager` role
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
    client = get_client(uri=uri, access_token=access_token)
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

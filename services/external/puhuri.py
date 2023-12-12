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
"""Client for accessing Puhuri, an HPC resource allocation management service

See: https://puhuri.neic.no/SDK%20guide/allocation-management-sp/#getting-a-list-of-resource-allocations

This client is useful to enable the following user stories
- Puhuri project admin can create new projects that have QAL 9000 offering indirectly in MSS (polling every few minutes or so)
- Puhuri project admin can add new users to a project indirectly in QAL 9000 if that project has a QAL 9000 offering
- Puhuri project admin can order for new QPU seconds for the QAL 9000 and be allocated the same extra QPU seconds in QAL 9000 indirectly
- Puhuri project admin can view the QPU seconds left in their project since QAL 9000 updates Puhuri of per-project 
    resource usage at a given interval or the moment an experiment is done
"""
import enum
from datetime import datetime
from typing import Any, List, Optional

from pydantic import Extra
from waldur_client import WaldurClient

from utils.models import ZEncodedBaseModel


class PuhuriClient:
    """The client for accessing Puhuri's Waldur server

    FIXME: We might need to make most of these methods async to ensure the server
        continues doing what it is expected to do as it waits for puhuri to respond

    Attributes:
        uri: the API base URL for the Waldur instance
        access_token: the API token of the user with `service provider manager` role
        offering_uuid: the unique ID of the resource that MSS is associated with in Waldur
    """

    def __init__(self, uri: str, access_token: str, offering_uuid: str):
        self.uri = uri
        self.access_token = access_token
        self.offering_uuid = offering_uuid
        self._client = WaldurClient(uri, access_token=access_token)

    async def get_new_orders(self) -> List["PuhuriOrder"]:
        """Retrieves the latest orders for the offering associated with MSS on puhuri

        This is used to update our own project lists in MSS with the new additional qpu_seconds

        Returns:
            list of orders that are yet to be approved or rejected

        Raises:
            WaldurClientException: error making request
            pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
        """
        response = self._client.list_orders(
            filters={
                "marketplace_resource_uuid": self.offering_uuid,
                "state": "executing",
            }
        )
        return [PuhuriOrder.parse_obj(item) for item in response]

    async def approve_orders(self, orders: List["PuhuriOrder"]):
        """Approves the orders"""
        pass

    async def get_latest_project_user_lists(self):
        """Get the latest project user lists that have this offering attached to them

        This is used to update our own project lists in MSS
        """
        pass

    async def update_resource_usage(self, usage: Any):
        """Updates Puhuri of the latest resource usage i.e. qpu_seconds per project

        The usage should be obtained from the database, probably by filtering out
        all projects that have a puhuri backend (probably add another property on the project schema)
        and whose resource usage is yet to be updated (or it can be called when updating the database itself)

        Reconciliation could be done say with another database collection that keeps track of any
        failed updates to puhuri and retries them at a given polling interval

        Args:
            usage: the usage data to be sent to Puhuri
        """
        pass

    # FIXME: Which type of user can attempt to allocate resources for a given project?
    #       If any user, how do we check that a user has paid for the resource allocation before accepting the request
    #       Does Puhuri handle the billing and payment for us?
    def _get_all_resource_allocations(
        self,
        fields: List[str] = (
            "end_date",
            "project_uuid",
            "project_name",
            "attributes",
            "uuid",
        ),
    ) -> List["ResourceAllocation"]:
        """Retrieves all resource allocations attached to this offering in puhuri

        Args:
            fields: the list of fields to return for each record

        Returns:
            list of resource allocations

        Raises:
            WaldurClientException: error making request
            pydantic.error_wrappers.ValidationError: {} validation error for ResourceAllocation ...
        """
        response = self._client.list_marketplace_resources(
            offering_uuid=self.offering_uuid, fields=fields
        )
        return [ResourceAllocation.parse_obj(item) for item in response]


class ResourceAttributes(ZEncodedBaseModel, extra=Extra.allow):
    """The colleciton of attributes that are passed to the resource allocation"""

    name: str = ""
    description: str = ""
    qpu_seconds: int = 0


class ResourceAllocation(ZEncodedBaseModel, extra=Extra.allow):
    "The schema of the Resource allocation objects as got from Puhuri"
    uuid: str
    project_name: str
    project_uuid: str
    end_date: Optional[datetime]
    attributes: ResourceAttributes


class PuhuriOrder(ZEncodedBaseModel, extra=Extra.allow):
    "The schema of the Order objects as got from Puhuri"
    uuid: str
    project_name: str
    project_description: str
    project_uuid: str
    customer_name: str
    customer_description: str
    items: List["OrderItem"]


class OrderType(str, enum.Enum):
    CREATE = "Create"
    TERMINATE = "Terminate"


class OrderItem(ZEncodedBaseModel, extra=Extra.allow):
    """The schema for the order item of the Puhuri Order"""

    uuid: str
    attributes: ResourceAttributes
    type: OrderType

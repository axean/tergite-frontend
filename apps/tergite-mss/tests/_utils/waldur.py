# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Mock Waldur client for handling calls to Puhuri in tests"""
import multiprocessing
from typing import Any, Dict, List, Tuple, TypedDict

from waldur_client import ComponentUsage, WaldurClient

from .date_time import of_this_month
from .fixtures import load_json_fixture
from .json import to_json
from .records import copy_records

_PUHURI_PENDING_ORDERS = load_json_fixture("puhuri_pending_orders.json")
_PUHURI_RESOURCES = load_json_fixture("puhuri_resources.json")
_PUHURI_UNAPPROVED_RESOURCES = load_json_fixture("puhuri_unapproved_resources.json")
_PUHURI_RESOURCE_TEAMS = load_json_fixture("puhuri_resource_teams.json")
_PUHURI_OFFERINGS = load_json_fixture("puhuri_offerings.json")
_PUHURI_PLAN_PERIODS = {
    k: [
        {
            **period,
            "start": of_this_month(period["start"]),
            "components": [
                {
                    **item,
                    "date": of_this_month(item["date"]),
                }
                for item in period["components"]
            ],
        }
        for period in periods
    ]
    for k, periods in load_json_fixture("puhuri_plan_periods.json").items()
}


class MockWaldurClient(WaldurClient):
    """A mock Waldur client for mocking requests to Puhuri"""

    def __init__(
        self,
        api_url,
        access_token,
        queue: multiprocessing.Queue,
    ):
        """
        Args:
            api_url: the URL to the waldur API server
            access_token: the access token for accessing the API
            queue: the queue for sharing state across processes
        """
        super().__init__(api_url, access_token)
        self._mock_call_queue = queue
        self._orders = copy_records(_PUHURI_PENDING_ORDERS)
        self._resources = copy_records(_PUHURI_RESOURCES)
        self._unapproved_resources = copy_records(_PUHURI_UNAPPROVED_RESOURCES)
        self._resource_teams = {
            k: copy_records(v) for k, v in _PUHURI_RESOURCE_TEAMS.items()
        }
        self._offerings = copy_records(_PUHURI_OFFERINGS)
        self._resource_plan_periods = {
            k: copy_records(v) for k, v in _PUHURI_PLAN_PERIODS.items()
        }

    def list_orders(self, filters=None):
        filter_obj = filters if filters is not None else {}
        # FIXME: for some reason, resource_uuid is always null, yet when searched for
        #   on the API, it looks for the key 'marketplace_resource_uuid'
        resource_uuid = filter_obj.pop("resource_uuid", None)
        if resource_uuid:
            filter_obj["marketplace_resource_uuid"] = resource_uuid
        return [
            item
            for item in self._orders
            if all(item[k] == filters[k] for k in filter_obj)
        ]

    def marketplace_order_approve_by_provider(self, order_uuid: str):
        """Record the call arguments"""
        mock_call = MockCall(
            method="marketplace_order_approve_by_provider",
            args=(order_uuid,),
            kwargs={},
        )
        self._mock_call_queue.put(mock_call)

    def filter_marketplace_resources(self, filters=None):
        filter_obj = filters if filters is not None else {}
        resources = self._resources
        if filter_obj.get("state") == "Creating":
            # filter only the unapproved resources if we want those in state 'Creating'
            resources = self._unapproved_resources

        return [
            item for item in resources if all(item[k] == filters[k] for k in filter_obj)
        ]

    def get_marketplace_provider_offering(self, offering_uuid):
        for offering in self._offerings:
            if offering["uuid"] == offering_uuid:
                return offering

    def marketplace_resource_get_plan_periods(self, resource_uuid: str):
        return self._resource_plan_periods.get(resource_uuid)

    def create_component_usages(
        self, plan_period_uuid: str, usages: List[ComponentUsage]
    ):
        mock_call = MockCall(
            method="create_component_usages",
            kwargs=dict(
                plan_period_uuid=plan_period_uuid,
                usages=to_json(usages),
            ),
            args=(),
        )
        self._mock_call_queue.put(mock_call)

    def marketplace_resource_get_team(self, resource_uuid: str):
        return self._resource_teams.get(resource_uuid, [])


class MockCall(TypedDict):
    """A representation of a function call to this mock"""

    method: str
    kwargs: Dict[str, Any]
    args: Tuple

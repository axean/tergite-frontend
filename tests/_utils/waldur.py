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
from typing import Any, Dict, List, Tuple

from waldur_client import ComponentUsage, WaldurClient

from .fixtures import load_json_fixture

_PUHURI_PENDING_ORDERS = load_json_fixture("puhuri_pending_orders.json")
_PUHURI_RESOURCES = load_json_fixture("puhuri_resources.json")
_PUHURI_OFFERINGS = load_json_fixture("puhuri_offerings.json")
_PUHURI_PLAN_PERIODS = load_json_fixture("puhuri_plan_periods.json")
_CLIENTS_MAP: Dict[Tuple[str, str], "MockWaldurClient"] = {}


def get_mock_client(api_url: str, access_token: str) -> "MockWaldurClient":
    """Returns a cached MockWaldurClient if it exists or creates a new one

    Args:
        api_url: the API url to pass to the Waldur client
        access_token: the access token to pass to the Waldur client

    Returns:
        the MockWaldurClient that corresponds to the argument pair
    """
    key = (api_url, access_token)
    try:
        client = _CLIENTS_MAP[key]
    except KeyError:
        client = MockWaldurClient(api_url, access_token)
        _CLIENTS_MAP[key] = client

    return client


def clear_mock_clients():
    """Clears all the mock clients in the cache"""
    global _CLIENTS_MAP
    _CLIENTS_MAP.clear()


class MockWaldurClient(WaldurClient):
    """A mock Waldur client for mocking requests to Puhuri"""

    def __init__(self, api_url, access_token):
        super().__init__(api_url, access_token)
        self._orders = _copy_records(_PUHURI_PENDING_ORDERS)
        self._resources = _copy_records(_PUHURI_RESOURCES)
        self._offerings = _copy_records(_PUHURI_OFFERINGS)
        self._resource_plan_periods = {
            k: _copy_records(v) for k, v in _PUHURI_PLAN_PERIODS.items()
        }
        self._component_usages: Dict[str, List[ComponentUsage]] = {}

    def list_orders(self, filters=None):
        return self._orders

    def marketplace_order_approve_by_provider(self, order_uuid: str):
        for order in self._orders:
            order["state"] = "done"

    def filter_marketplace_resources(self, filters=None):
        filter_obj = filters if filters is not None else {}
        return [
            item
            for item in self._resources
            if all(item[k] == filters[k] for k in filter_obj)
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
        self._component_usages[plan_period_uuid] = usages.copy()


def _copy_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Copies the list of dicts into a new immutable list of dicts

    Args:
        records: the list of records to copy immutably

    return
        New list of records with same values
    """
    return [{**item} for item in records]

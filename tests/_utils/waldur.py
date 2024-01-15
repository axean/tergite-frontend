"""Mock Waldur client for handling calls to Puhuri in tests"""
from typing import Any, Dict, List, Tuple

from waldur_client import WaldurClient

from .fixtures import load_json_fixture

_PUHURI_PENDING_ORDERS = load_json_fixture("puhuri_pending_orders.json")
_CLIENTS_MAP: Dict[Tuple[str, str], "MockWaldurClient"] = {}


class MockWaldurClient(WaldurClient):
    """A mock Waldur client for mocking requests to Puhuri"""

    def __init__(
        self,
        api_url,
        access_token,
        pending_orders: List[Dict[str, Any]] = tuple(_PUHURI_PENDING_ORDERS),
    ):
        super().__init__(api_url, access_token)
        key = (api_url, access_token)
        if key in _CLIENTS_MAP:
            # copy state from the old one to the new ones
            self._orders = _CLIENTS_MAP[(api_url, access_token)]._orders
        else:
            self._orders = [{**item} for item in pending_orders]
            _CLIENTS_MAP[key] = self

    def list_orders(self, filters=None):
        return self._orders

    def marketplace_order_approve_by_provider(self, order_uuid: str):
        for order in self._orders:
            order["state"] = "done"

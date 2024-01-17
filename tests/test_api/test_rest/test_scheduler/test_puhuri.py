"""Integration tests for the Puhuri background jobs"""
import asyncio
import json

import pytest

from tests._utils.env import (
    TEST_PUHURI_POLL_INTERVAL,
    TEST_PUHURI_WALDUR_API_URI,
    TEST_PUHURI_WALDUR_CLIENT_TOKEN,
)
from tests._utils.fixtures import load_json_fixture
from tests._utils.waldur import get_mock_client

_PUHURI_PENDING_ORDERS = load_json_fixture("puhuri_pending_orders.json")


@pytest.mark.asyncio
async def test_approve_pending_orders(client):
    """Should approve pending orders associated with current service provider, at given interval"""
    mock_waldur_client = get_mock_client(
        api_url=TEST_PUHURI_WALDUR_API_URI,
        access_token=TEST_PUHURI_WALDUR_CLIENT_TOKEN,
    )
    assert mock_waldur_client.list_orders() == _PUHURI_PENDING_ORDERS

    # using context manager to ensure on_startup runs
    with client as client:
        # wait for the scheduler to run its jobs
        await asyncio.sleep(TEST_PUHURI_POLL_INTERVAL + 1)

        got = mock_waldur_client.list_orders()
        expected = [{**item, "state": "done"} for item in _PUHURI_PENDING_ORDERS]

        assert json.dumps(got) == json.dumps(expected)
        assert json.dumps(got) != json.dumps(_PUHURI_PENDING_ORDERS)


def test_post_resource_usages():
    """Should post all accumulated resource usages at a given interval"""
    assert False


def test_update_internal_project_list():
    """Should update internal project list with that got from Puhuri, at a given interval"""
    assert False


def test_update_internal_user_list():
    """Should update the internal user list with that got from Puhuri, at a given interval"""
    assert False


def test_update_internal_resource_allocation():
    """Should update the internal resource allocation quotas with that got from Puhuri, at a given interval"""
    assert False

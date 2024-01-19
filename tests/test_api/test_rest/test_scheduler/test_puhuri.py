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
"""Integration tests for the Puhuri background jobs"""
import asyncio

import pytest
from waldur_client import ComponentUsage

from tests._utils.env import (
    TEST_PUHURI_POLL_INTERVAL,
    TEST_PUHURI_WALDUR_API_URI,
    TEST_PUHURI_WALDUR_CLIENT_TOKEN,
)
from tests._utils.fixtures import load_json_fixture
from tests._utils.json import to_json
from tests._utils.mongodb import insert_in_collection
from tests._utils.waldur import get_mock_client

_PUHURI_PENDING_ORDERS = load_json_fixture("puhuri_pending_orders.json")
_JOB_TIMESTAMPED_UPDATES = load_json_fixture("job_timestamped_updates.json")
_JOBS_LIST = load_json_fixture("job_list.json")
_JOBS_COLLECTION = "jobs"


@pytest.mark.asyncio
async def test_post_resource_usages(db, client, project_id, app_token_header):
    """Should post all accumulated resource usages at a given interval"""
    job_list = [{**item, "project_id": project_id} for item in _JOBS_LIST]
    insert_in_collection(database=db, collection_name=_JOBS_COLLECTION, data=job_list)

    mock_waldur_client = get_mock_client(
        api_url=TEST_PUHURI_WALDUR_API_URI,
        access_token=TEST_PUHURI_WALDUR_CLIENT_TOKEN,
    )
    assert mock_waldur_client._component_usages == {}

    # using context manager to ensure on_startup runs
    with client as client:
        # push job resource usages to MSS
        for payload in _JOB_TIMESTAMPED_UPDATES:
            job_id = payload.pop("job_id")

            client.put(
                f"/jobs/{job_id}",
                json={**payload, "timelog.RESULT": "foo"},
                headers=app_token_header,
            )

        # wait for the scheduler to run its jobs
        await asyncio.sleep(TEST_PUHURI_POLL_INTERVAL + 1)

        # the reported component usages are saved in the mock's '_component_usages' prop
        got = mock_waldur_client._component_usages
        expected = {
            "c0e15746796646f183d9f0d0096cf084": [
                ComponentUsage(
                    type="pre-paid",
                    amount=2.24,
                    description="8042.9668759999995 QPU seconds",
                )
            ],
            "b62a8f69b3d8497986a7769b75d735fe": [
                ComponentUsage(
                    type="pre-paid",
                    amount=222.53,
                    description="801104.495965 QPU seconds",
                )
            ],
        }

        assert to_json(got) == to_json(expected)


def test_update_internal_project_list():
    """Should update internal project list with that got from Puhuri, at a given interval"""
    assert False


def test_update_internal_user_list():
    """Should update the internal user list with that got from Puhuri, at a given interval"""
    assert False


def test_update_internal_resource_allocation():
    """Should update the internal resource allocation quotas with that got from Puhuri, at a given interval"""
    assert False

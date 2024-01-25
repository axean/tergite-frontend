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
from datetime import datetime
from typing import List

import pytest
from waldur_client import ComponentUsage

from api.scripts import puhuri_sync
from services.auth import Project
from tests._utils.auth import TEST_PROJECT_EXT_ID, get_db_record
from tests._utils.env import (
    TEST_PUHURI_POLL_INTERVAL,
    TEST_PUHURI_WALDUR_API_URI,
    TEST_PUHURI_WALDUR_CLIENT_TOKEN,
)
from tests._utils.fixtures import load_json_fixture
from tests._utils.json import to_json
from tests._utils.mongodb import find_in_collection, insert_in_collection
from tests._utils.records import pop_field
from tests._utils.waldur import get_mock_client

_PUHURI_PENDING_ORDERS = load_json_fixture("puhuri_pending_orders.json")
_JOB_TIMESTAMPED_UPDATES = load_json_fixture("job_timestamped_updates.json")
_JOBS_LIST = load_json_fixture("job_list.json")
_JOBS_COLLECTION = "jobs"
_INTERNAL_USAGE_COLLECTION = "internal_resource_usages"
_EXCLUDED_FIELDS = ["_id", "id"]


def test_save_resource_usages(db, client, project_id, app_token_header):
    """PUT to "/jobs/{job_id}" updates the resource usage in database for that project id"""
    project_id_str = f"{project_id}"
    job_list = [{**item, "project_id": project_id} for item in _JOBS_LIST]
    insert_in_collection(database=db, collection_name=_JOBS_COLLECTION, data=job_list)
    initial_data = find_in_collection(
        db,
        collection_name=_INTERNAL_USAGE_COLLECTION,
        fields_to_exclude=_EXCLUDED_FIELDS,
    )
    project = get_db_record(db, schema=Project, _id=project_id_str)
    expected_usages: List[dict] = []

    # using context manager to ensure on_startup runs
    with client as client:
        # push job resource usages to MSS
        for payload in _JOB_TIMESTAMPED_UPDATES.copy():
            current_qpu_seconds = project["qpu_seconds"]
            job_id = payload.pop("job_id")

            response = client.put(
                f"/jobs/{job_id}",
                json={**payload, "timelog.RESULT": "foo"},
                headers=app_token_header,
            )
            assert response.status_code == 200

            project = get_db_record(db, schema=Project, _id=project_id_str)
            usage = round(current_qpu_seconds - project["qpu_seconds"], 1)
            if usage > 0:
                expected_usages.append(
                    {
                        "job_id": job_id,
                        "project_id": TEST_PROJECT_EXT_ID,
                        "qpu_seconds": usage,
                        "is_processed": False,
                    }
                )

        final_data = find_in_collection(
            db,
            collection_name=_INTERNAL_USAGE_COLLECTION,
            fields_to_exclude=_EXCLUDED_FIELDS,
        )
        now = datetime.now()
        created_on_timestamps: List[datetime] = pop_field(final_data, "created_on")

        assert initial_data == []
        assert [
            {**item, "qpu_seconds": round(item["qpu_seconds"], 1)}
            for item in final_data
        ] == expected_usages
        assert all([(x - now).total_seconds() < 30 for x in created_on_timestamps])


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
        for payload in _JOB_TIMESTAMPED_UPDATES.copy():
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


def test_puhuri_sync_enabled(mock_puhuri_synchronize):
    """Should start puhuri synchronizer if 'IS_PUHURI_SYNC_ENABLED' environment variable is True"""
    puhuri_sync.main([])
    mock_puhuri_synchronize.assert_called()


def test_puhuri_sync_disabled(disabled_puhuri_sync, mock_puhuri_synchronize):
    """Should not start puhuri synchronizer if 'IS_PUHURI_SYNC_ENABLED' environment variable is False"""
    with pytest.raises(
        ValueError,
        match="environment variable 'IS_PUHURI_SYNC_ENABLED' is False",
    ):
        puhuri_sync.main([])

    mock_puhuri_synchronize.assert_not_called()


@pytest.mark.parametrize("arg", ["--ignore-if-disabled", "-i"])
def test_puhuri_sync_ignore_if_disabled_when_disabled(
    disabled_puhuri_sync, mock_puhuri_synchronize, arg
):
    """Should not raise any error with --ignore-if-disabled is passed as an argument"""
    puhuri_sync.main([arg])
    mock_puhuri_synchronize.assert_not_called()


@pytest.mark.parametrize("arg", ["--ignore-if-disabled", "-i"])
def test_puhuri_sync_ignore_if_disabled_when_enabled(mock_puhuri_synchronize, arg):
    """Should call puhuri.cynchronize when --ignore-if-disabled is passed as an argument"""
    puhuri_sync.main([arg])
    mock_puhuri_synchronize.assert_called()

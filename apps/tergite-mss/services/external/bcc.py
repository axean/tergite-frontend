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
"""Clients for accessing certain HTTP services"""
import logging
from json import JSONDecodeError
from typing import Dict, List

import httpx

from utils.config import BccConfig
from utils.exc import ServiceUnavailableError

_BCC_CLIENTS: Dict[str, "BccClient"] = {}


async def create_clients(configs: List[BccConfig]):
    """Creates the Bcc clients for the given BCC configs

    Args:
        configs: the configs for the Tergite backends
    """
    global _BCC_CLIENTS
    await close_clients()
    _BCC_CLIENTS = {item.name: BccClient(base_url=f"{item.url}") for item in configs}


async def close_clients():
    """Closes the Bcc clients"""
    global _BCC_CLIENTS
    for client in _BCC_CLIENTS.values():
        await client.close()

    _BCC_CLIENTS.clear()


def get_client_map() -> Dict[str, "BccClient"]:
    """Get the map of Bcc Clients, where the key is the name of the BCC instance

    This is quite useful as a dependency injector
    """
    return _BCC_CLIENTS


class BccClient:
    """A client for making requests to a Backend Control Computer (BCC) Instance

    Attributes:
        base_url: the base URL for the given BCC instance
    """

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(base_url=base_url)

    async def save_credentials(self, job_id: str, app_token: str):
        """Registers a given job with BCC so that BCC can expect it

        Args:
            job_id: the id of the job
            app_token: the app token associated with the job id

        Raises:
            ValueError: job id '{job_id}' already exists
            ServiceUnavailableError: backend is currently unavailable
        """
        try:
            response = await self._client.post(
                "/auth", json={"job_id": job_id, "app_token": app_token}
            )

            if response.is_error:
                message = _extract_error_message(response)
                raise ValueError(message)
        except (httpx.ConnectError, httpx.ConnectTimeout) as exp:
            logging.error(exp)
            raise ServiceUnavailableError("backend is currently unavailable")

    async def close(self):
        """Closes the client"""
        await self._client.aclose()


def _extract_error_message(response: httpx.Response) -> str:
    """Extracts the error message from the response

    Args:
        response: the response from requests

    Returns:
        the error message from the response
    """
    try:
        response_json = response.json()
        return response_json.get("detail", response_json)
    except JSONDecodeError:
        return response.text

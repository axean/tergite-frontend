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
from typing import Optional

import httpx
import requests

import settings
from utils.exc import ServiceUnavailableError

_BCC_CLIENT: Optional["BccClient"] = None


async def create_client(base_url: str):
    """Creates the Bcc client for the given base_url

    Args:
        base_url: the base url of BCC
    """
    global _BCC_CLIENT
    await close_client()
    _BCC_CLIENT = BccClient(base_url=base_url)


async def close_client():
    """Closes the Bcc client"""
    global _BCC_CLIENT
    if _BCC_CLIENT:
        await _BCC_CLIENT.close()
        _BCC_CLIENT = None


def get_client() -> "BccClient":
    """Get Bcc Client.

    This is quite useful as a dependency injector
    """
    return _BCC_CLIENT


class BccClient:
    def __init__(self, base_url: str):
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

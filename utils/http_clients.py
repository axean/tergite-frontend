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
import requests

import settings


class BccClient:
    def __init__(self, base_url: str = f"{settings.BCC_MACHINE_ROOT_URL}"):
        self.base_url = base_url

    def save_credentials(self, job_id: str, app_token: str):
        """Registers a given job with BCC so that BCC can expect it

        Args:
            job_id: the id of the job
            app_token: the app token associated with the job id

        Raises:
            ValueError: job id '{job_id}' already exists
        """
        url = f"{self.base_url}/auth"
        payload = {"job_id": job_id, "app_token": app_token}
        response = requests.post(url, json=payload)

        if not response.ok:
            message = _extract_error_message(response)
            raise ValueError(message)


def _extract_error_message(response: requests.Response) -> str:
    """Extracts the error message from the response

    Args:
        response: the response from requests

    Returns:
        the error message from the response
    """
    try:
        response_json = response.json()
        return response_json.get("detail", response_json)
    except requests.JSONDecodeError:
        return response.text

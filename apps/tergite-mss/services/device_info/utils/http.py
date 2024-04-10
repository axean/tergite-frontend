"""Utilities to do with HTTP"""

import asyncio
from typing import Union

import aiohttp

from ..config import app_config


async def fetch_data(address: str) -> Union[None, dict]:
    try:
        timeout = aiohttp.ClientTimeout(
            total=app_config["TIMEOUTS"]["ENDPOINT_FETCH_TIMEOUT"]
        )
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(address) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if isinstance(data, dict):
                        return data
    # If too long delay
    except asyncio.exceptions.TimeoutError:
        # TODO Logging?
        pass
    # If SSL/HTTPS or HTTP link is broken
    except (aiohttp.ClientConnectorSSLError, aiohttp.ClientConnectorError):
        pass
    return None

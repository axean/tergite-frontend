# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Collection of key-word args for the FastAPI app"""
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI

import settings
from services.auth import service as auth_service
from services.device_info import service as device_info_service
from services.external import bcc

from .dependencies import get_default_mongodb


def get_app_kwargs() -> Dict[str, Any]:
    """Retrieve the key-word args for the app instance"""
    kwargs = dict(
        title="Main Service Server",
        description="A frontend to all our quantum backends",
        version="0.3.0",
        lifespan=lifespan,
    )

    # hide the docs if not in development
    if settings.APP_SETTINGS.lower() != "development":
        kwargs["docs_url"] = None
        kwargs["redoc_url"] = None
        kwargs["openapi_url"] = None

    return kwargs


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # on startup
    await bcc.create_client(base_url=f"{settings.BCC_MACHINE_ROOT_URL}")
    await device_info_service.on_startup()
    db = await get_default_mongodb()
    await auth_service.on_startup(db)

    yield
    # on shutdown
    await bcc.close_client()

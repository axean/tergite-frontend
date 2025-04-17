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

from fastapi import FastAPI

from api.rest.utils import TergiteCORSMiddleware

from . import app_kwargs
from .app_kwargs import get_app_kwargs
from .dependencies import (
    CurrentProjectDep,
    CurrentStrictProjectDep,
    get_default_mongodb,
)
from .routers import v1
from .routers.v2 import v2_router

# application
app = FastAPI(**get_app_kwargs())


app.add_middleware(
    TergiteCORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1.jobs_router)
app.include_router(v2_router)


@app.get("/")
async def home(current_project: CurrentStrictProjectDep):
    return "Welcome to the MSS machine"

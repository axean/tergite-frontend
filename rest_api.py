# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

from fastapi import FastAPI
from uuid import uuid4
import motor.motor_asyncio
from starlette.config import Config
from datetime import datetime
import pymongo

# .env configuration
config = Config(".env")
DB_URL = config("DB_URL", default="NO-DB-URL")

# mongodb
mongodb = motor.motor_asyncio.AsyncIOMotorClient(DB_URL)
db = mongodb["milestone1"]
jobs_col = db["jobs"]

# application
app = FastAPI(
    title="Main Service Server",
    description="A frontend to all our quantum backends",
    version="0.0.1",
)

# routing
@app.get("/")
async def root():
    return "Welcome to MSS DEV2 machine"


@app.post("/jobs")
async def create_job():
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    job_id = uuid4()

    job_entry = {
        "job_id": str(job_id),
        "timelog": {"REGISTERED": timestamp},
        "status": "REGISTERING",
        "backend": "pingu",
    }

    db_result = await jobs_col.insert_one(job_entry)
    if not db_result.inserted_id:
        # TODO: add proper exception handling
        print("mongodb INVALID OPERATION while registering new job")

    print(f"Registering new job_id: {str(job_id)}")
    return str(job_id)


@app.get("/jobs")
async def list_jobs(nlast: int = 10):
    db_cursor = jobs_col.find({}, {"_id": 0})
    db_cursor.sort("timelog.REGISTERED", pymongo.DESCENDING)
    db_cursor.limit(nlast)

    response = []
    async for document in db_cursor:
        # print(document)
        response.append(document)

    return response

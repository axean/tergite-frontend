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

from fastapi import FastAPI, Body
from uuid import uuid4, UUID
import motor.motor_asyncio

# from starlette.config import Config
from datetime import datetime
import pymongo
import settings

# settings
BCC_MACHINE_ROOT_URL = settings.BCC_MACHINE_ROOT_URL
DB_MACHINE_ROOT_URL = settings.DB_MACHINE_ROOT_URL
DB_NAME = settings.DB_NAME

# mongodb
mongodb = motor.motor_asyncio.AsyncIOMotorClient(str(DB_MACHINE_ROOT_URL))
db = mongodb[DB_NAME]
jobs_col = db["jobs"]  # job collection
calib_col = db["calibrations"]  # experimentally measured data

# application
app = FastAPI(
    title="Main Service Server",
    description="A frontend to all our quantum backends",
    version="0.0.1",
)


def new_timestamp():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


# routing
@app.get("/")
async def root():
    return "Welcome to the MSS machine"


# insert new job in the job collection
@app.post("/jobs")
async def create_job():
    timestamp = new_timestamp()
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
    return {
        "job_id": str(job_id),
        "upload_url": str(BCC_MACHINE_ROOT_URL) + "/jobs",
    }


# insert new calibrated quantity of interest
@app.post("/calibrations")
async def store_calibration(documents: list):

    # mark all documents with timestamp
    timestamp = new_timestamp()
    for doc in documents:
        doc.update({"timelog": {"REGISTERED": timestamp}})

    # insert timestamped documents as they appear
    response = await calib_col.insert_many(documents)

    if response.acknowledged == True:
        print(f"Inserted {len(documents)} calibrated values")
        return "OK"
    elif response.acknowledged:
        return {"message": "Failed POST", "raw_result": response.raw_result}
    else:
        return {"message": "Failed POST. Operation not acknowledged"}


# list the latest calibrations
@app.get("/calibrations")
async def list_calibrations(nlast: int = 10):
    db_cursor = calib_col.find({}, {"_id": 0})
    db_cursor.sort("timelog.REGISTERED", pymongo.DESCENDING)
    db_cursor.limit(nlast)

    response = []
    async for document in db_cursor:
        response.append(document)

    return response


# list the latest jobs
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


@app.get("/jobs/{job_id}")
async def show_job(job_id: UUID):
    document = await jobs_col.find_one({"job_id": str(job_id)}, {"_id": 0})

    # TODO: Write a helper utility for DB calls which encapsulates
    # and does a proper error handling
    if document is None:
        return {"message": "Job not found in the DB"}

    return document


@app.get("/jobs/{job_id}/result")
async def get_job_result(job_id: UUID):
    document = await jobs_col.find_one({"job_id": str(job_id)})

    if document is None:
        return {"message": "Job not found in the DB"}

    # helper printout with first 5 outcomes
    print("Measurement results:")
    memory = document["result"]["memory"]
    for experiment_memory in memory:
        s = str(experiment_memory[:5])
        if experiment_memory[5:6]:
            s = s.replace("]", ", ...]")
        print(s)

    return document["result"]


@app.get("/jobs/{job_id}/download_url")
async def get_job_download_url(job_id: UUID):
    document = await jobs_col.find_one({"job_id": str(job_id)})

    if document is None:
        return {"message": "Job not found in the DB"}

    print(document["download_url"])
    return document["download_url"]


# TODO: It should be possible to have just one update function
# which covers the whole job document
@app.put("/jobs/{job_id}/result")
async def update_job_result(job_id: UUID, memory: list):
    result = {"memory": memory}
    response = await jobs_col.update_one(
        {"job_id": str(job_id)}, {"$set": {"result": result}}
    )

    if response.acknowledged == True and response.matched_count == 1:
        return "OK"
    elif response.acknowledged:
        return {"message": "Failed PUT", "raw_result": response.raw_result}
    else:
        return {"message": "Failed PUT. Operation not acknowledged"}


@app.put("/jobs/{job_id}/status")
async def update_job_status(job_id: UUID, status: str = Body(..., max_length=10)):
    # TODO: would be best to enforce a status str enum
    response = await jobs_col.update_one(
        {"job_id": str(job_id)}, {"$set": {"status": status}}
    )

    if response.acknowledged == True and response.matched_count == 1:
        return "OK"
    elif response.acknowledged:
        return {"message": "Failed PUT", "raw_result": response.raw_result}
    else:
        return {"message": "Failed PUT. Operation not acknowledged"}


@app.put("/jobs/{job_id}/download_url")
async def update_job_download_url(job_id: UUID, url: str = Body(..., max_length=140)):
    # TODO: add proper validation of url
    response = await jobs_col.update_one(
        {"job_id": str(job_id)}, {"$set": {"download_url": url}}
    )

    if response.acknowledged == True and response.matched_count == 1:
        return "OK"
    elif response.acknowledged:
        return {"message": "Failed PUT", "raw_result": response.raw_result}
    else:
        return {"message": "Failed PUT. Operation not acknowledged"}


# This should probably be a PUT method as well. The decision depends on the wider context.
@app.post("/jobs/{job_id}/timelog")
async def create_timelog_entry(job_id: UUID, event_name: str = Body(..., max_legth=10)):
    # TODO: would be best to enforce an event_name str enum
    timestamp = new_timestamp()
    response = await jobs_col.update_one(
        {"job_id": str(job_id)}, {"$set": {"timelog." + event_name: timestamp}}
    )

    if response.acknowledged == True and response.matched_count == 1:
        return "OK"
    elif response.acknowledged:
        return {"message": "Failed POST", "raw_result": response.raw_result}
    else:
        return {"message": "Failed POST. Operation not acknowledged"}

"""Dependencies to be injected"""
import asyncio

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing_extensions import Annotated

import settings
from api.database import get_mongodb


async def get_default_mongodb():
    return get_mongodb(
        url=f"{settings.DB_MACHINE_ROOT_URL}",
        name=settings.DB_NAME,
        _loop=asyncio.get_running_loop(),
    )


MongoDbDep = Annotated[AsyncIOMotorDatabase, Depends(get_default_mongodb)]

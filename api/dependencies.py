"""Dependencies to be injected"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing_extensions import Annotated

import settings
from api.database import get_mongodb
from services.auth.service import (
    GET_CURRENT_PROJECT,
    GET_CURRENT_SUPERUSER,
    GET_CURRENT_USER,
)


async def get_default_mongodb():
    return get_mongodb(url=f"{settings.DB_MACHINE_ROOT_URL}", name=settings.DB_NAME)


CurrentUserDep = Depends(GET_CURRENT_USER)
CurrentSuperUserDep = Depends(GET_CURRENT_SUPERUSER)
CurrentProjectDep = Depends(GET_CURRENT_PROJECT)
MongoDbDep = Annotated[AsyncIOMotorDatabase, Depends(get_default_mongodb)]

"""Dependencies to be injected"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing_extensions import Annotated

import settings
from api.database import get_mongodb
from services.auth import (
    GET_CURRENT_USER,
    GET_CURRENT_SUPERUSER,
    GET_CURRENT_PROJECT,
    User,
    Project,
)


async def get_default_mongodb():
    return get_mongodb(url=f"{settings.DB_MACHINE_ROOT_URL}", name=settings.DB_NAME)


CurrentProjectDep = Annotated[Project, Depends(GET_CURRENT_PROJECT)]
CurrentUserDep = Annotated[User, Depends(GET_CURRENT_USER)]
CurrentSuperUserDep = Annotated[User, Depends(GET_CURRENT_SUPERUSER)]
MongoDbDep = Annotated[AsyncIOMotorDatabase, Depends(get_default_mongodb)]

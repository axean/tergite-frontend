"""Dependencies to be injected"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing_extensions import Annotated

import settings
from services.auth import Project, User

# from api.database import get_mongodb
from services.auth.service import (
    GET_CURRENT_LAX_PROJECT,
    GET_CURRENT_PROJECT,
    GET_CURRENT_SYSTEM_USER,
)
from utils.mongodb import get_mongodb


async def get_default_mongodb():
    return get_mongodb(url=f"{settings.DB_MACHINE_ROOT_URL}", name=settings.DB_NAME)


CurrentSystemUserDep = Annotated[User, Depends(GET_CURRENT_SYSTEM_USER)]
CurrentProjectDep = Depends(GET_CURRENT_PROJECT)
CurrentLaxProjectDep = Annotated[Project, Depends(GET_CURRENT_LAX_PROJECT)]
CurrentStrictProjectDep = Annotated[Project, Depends(GET_CURRENT_PROJECT)]
MongoDbDep = Annotated[AsyncIOMotorDatabase, Depends(get_default_mongodb)]

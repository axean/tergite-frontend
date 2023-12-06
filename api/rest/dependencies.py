"""Dependencies to be injected"""
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing_extensions import Annotated

import settings
from services.auth import Project, ProjectDatabase, User, get_project_db

# from api.database import get_mongodb
from services.auth.service import (
    GET_CURRENT_LAX_PROJECT,
    GET_CURRENT_PROJECT,
    GET_CURRENT_SYSTEM_USER_PROJECT,
)
from utils.http_clients import BccClient
from utils.mongodb import get_mongodb


async def get_default_mongodb():
    return get_mongodb(url=f"{settings.DB_MACHINE_ROOT_URL}", name=settings.DB_NAME)


CurrentSystemUserProjectDep = Annotated[User, Depends(GET_CURRENT_SYSTEM_USER_PROJECT)]
CurrentProjectDep = Depends(GET_CURRENT_PROJECT)
CurrentLaxProjectDep = Annotated[Project, Depends(GET_CURRENT_LAX_PROJECT)]
CurrentStrictProjectDep = Annotated[Project, Depends(GET_CURRENT_PROJECT)]
ProjectDbDep = Annotated[ProjectDatabase, Depends(get_project_db)]
MongoDbDep = Annotated[AsyncIOMotorDatabase, Depends(get_default_mongodb)]
BccClientDep = Annotated[BccClient, Depends(BccClient)]

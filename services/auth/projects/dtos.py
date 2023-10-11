# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Data Transfer Objects for the projects submodule in the auth service"""
from typing import Generic, List, Optional, TypeVar

from beanie import Document, PydanticObjectId
from pydantic import BaseModel
from pymongo import IndexModel

ITEM = TypeVar("ITEM", bound=BaseModel)


class ProjectCreate(BaseModel):
    """The schema for creating a project"""

    # external_id is the id in an external project allocation service
    ext_id: str
    user_ids: List[str] = []
    qpu_seconds: int = 0


class ProjectRead(BaseModel):
    """The schema for viewing a project as non admin"""

    id: PydanticObjectId
    ext_id: str
    qpu_seconds: int = 0
    is_active: bool = True

    class Config:
        orm_mode = True


class ProjectAdminView(ProjectCreate):
    """The schema for viewing a project as an admin"""

    id: PydanticObjectId
    is_active: bool = True

    class Config:
        orm_mode = True


class ProjectUpdate(BaseModel):
    """The schema for updating a project"""

    user_ids: Optional[List[str]]
    qpu_seconds: Optional[int]


class Project(ProjectCreate, Document):
    is_active: bool = True

    class Settings:
        name = "auth_projects"
        indexes = [
            IndexModel("ext_id", unique=True),
        ]


class PaginatedResponse(Generic[ITEM], BaseModel):
    """The response when sending paginated data"""

    skip: int = 0
    limit: Optional[int] = None
    data: List[ITEM] = []

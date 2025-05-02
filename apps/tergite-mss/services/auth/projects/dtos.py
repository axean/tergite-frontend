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
import enum
from typing import List, Optional

from beanie import Document, PydanticObjectId
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
)
from pymongo import IndexModel

from utils.date_time import get_current_timestamp
from utils.models import create_partial_model

PROJECT_DB_COLLECTION = "auth_projects"
DELETED_PROJECT_DB_COLLECTION = "deleted_auth_projects"


class ProjectSource(str, enum.Enum):
    """Enumeration for all possible origins of projects"""

    PUHURI = "puhuri"
    INTERNAL = "internal"


class ProjectCreate(BaseModel):
    """The schema for creating a project"""

    ext_id: str
    """ext_id is the id in an external project allocation service"""

    name: str
    admin_email: Optional[str] = None
    user_emails: Optional[List[str]] = None
    qpu_seconds: float = 0
    source: ProjectSource = ProjectSource.INTERNAL
    resource_ids: List[str] = []
    description: Optional[str] = None


class ProjectRead(BaseModel):
    """The schema for viewing a project as non admin"""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: PydanticObjectId
    name: str
    ext_id: str
    qpu_seconds: float = 0
    is_active: bool = True
    description: Optional[str] = None
    user_ids: List[str]
    admin_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def model_dump(self, *args, **kwargs):
        # get rid of the default None's
        return super().model_dump(*args, **{**kwargs, "exclude_none": True})

    @field_serializer("id", when_used="json")
    def serialize_id(self, _id: PydanticObjectId):
        """Convert id to string when working with JSON"""
        return str(_id)


class ProjectAdminView(ProjectRead):
    """The schema for viewing a project as an admin"""

    model_config = ConfigDict(from_attributes=True)

    admin_email: Optional[str] = None
    user_emails: Optional[List[str]] = None


class ProjectUpdate(BaseModel):
    """The schema for updating a project"""

    name: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    admin_email: Optional[str] = None
    user_emails: Optional[List[str]] = None
    qpu_seconds: Optional[float] = None
    updated_at: Optional[str] = Field(default_factory=get_current_timestamp)


class Project(ProjectCreate, Document):
    is_active: bool = True
    admin_id: Optional[str] = None
    user_ids: Optional[List[str]] = None
    created_at: Optional[str] = Field(default_factory=get_current_timestamp)
    updated_at: Optional[str] = Field(default_factory=get_current_timestamp)

    class Settings:
        name = PROJECT_DB_COLLECTION
        indexes = [
            IndexModel("ext_id", unique=True),
        ]


class DeletedProject(Project):
    """The schema of all deleted projects"""

    class Settings:
        name = DELETED_PROJECT_DB_COLLECTION


ProjectPartial = create_partial_model("ProjectPartial", Project)
"""The partial project to be used when updating the database"""

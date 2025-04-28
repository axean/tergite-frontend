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
from typing import Any, Callable, Dict, List, Literal, Optional, Self

from beanie import Document, PydanticObjectId
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    field_validator,
    validator,
)
from pydantic.main import IncEx
from pydantic_core.core_schema import ValidationInfo
from pymongo import IndexModel

from utils.date_time import get_current_timestamp

PROJECT_DB_COLLECTION = "auth_projects"
DELETED_PROJECT_DB_COLLECTION = "deleted_auth_projects"


class ProjectSource(str, enum.Enum):
    """Enumeration for all possible origins of projects"""

    PUHURI = "puhuri"
    INTERNAL = "internal"


class ProjectCreate(BaseModel):
    """The schema for creating a project"""

    # external_id is the id in an external project allocation service
    ext_id: str
    name: Optional[str] = None
    version: Optional[int] = None
    admin_id: Optional[str] = None
    admin_email: Optional[str] = None
    user_emails: Optional[List[str]] = None
    user_ids: Optional[List[str]] = None
    qpu_seconds: float = 0
    source: ProjectSource = ProjectSource.INTERNAL
    resource_ids: List[str] = []
    description: Optional[str] = None

    @classmethod
    @field_validator("name")
    def name_required_in_versions_above_1(cls, v: Optional[str], info: ValidationInfo):
        return _is_required_in_v2_and_above(value=v, info=info)

    @classmethod
    @field_validator("admin_id")
    def admin_id_required_in_versions_above_1(
        cls, v: Optional[str], info: ValidationInfo
    ):
        return _is_required_in_v2_and_above(value=v, info=info)

    @classmethod
    @field_validator("user_emails")
    def user_emails_default_empty_in_v1(
        cls, v: Optional[List[str]], info: ValidationInfo
    ):
        return _get_default_in_v1(value=v, other_values=info.data, default=[])

    @classmethod
    @field_validator("user_ids")
    def user_ids_required_in_versions_above_1(
        cls, v: Optional[List[str]], info: ValidationInfo
    ):
        return _is_required_in_v2_and_above(value=v, info=info)


class ProjectRead(BaseModel):
    """The schema for viewing a project as non admin"""

    model_config = ConfigDict(
        from_attributes=True,
    )

    # id: PydanticObjectId = Field(alias="_id")
    id: PydanticObjectId
    version: Optional[int] = None
    name: Optional[str] = None
    ext_id: str
    qpu_seconds: float = 0
    is_active: bool = True
    description: Optional[str] = None
    user_ids: Optional[List[str]] = None
    admin_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def model_dump(self, *args, **kwargs):
        # get rid of the default None's
        return super().model_dump(*args, **{**kwargs, "exclude_none": True})

    @field_serializer("id", when_used="json")
    def serialize_id(self, _id: PydanticObjectId):
        """Convert id to string when working with JSON"""
        return str(_id)

    @classmethod
    @field_validator("name")
    def name_required_in_versions_above_1(cls, v: Optional[str], info: ValidationInfo):
        return _is_required_in_v2_and_above(value=v, info=info)

    @classmethod
    @field_validator("admin_id")
    def admin_id_required_in_versions_above_1(
        cls, v: Optional[str], info: ValidationInfo
    ):
        return _is_required_in_v2_and_above(value=v, info=info)

    @classmethod
    @field_validator("user_ids")
    def user_ids_required_in_versions_above_1(
        cls, v: Optional[List[str]], info: ValidationInfo
    ):
        return _is_required_in_v2_and_above(value=v, info=info)


class ProjectAdminView(ProjectRead):
    """The schema for viewing a project as an admin"""

    model_config = ConfigDict(from_attributes=True)

    user_emails: Optional[List[str]] = None
    admin_email: Optional[str] = None

    @classmethod
    @field_validator("user_emails")
    def user_emails_default_empty_in_v1(
        cls, v: Optional[List[str]], info: ValidationInfo
    ):
        return _get_default_in_v1(value=v, other_values=info.data, default=[])


class ProjectUpdate(BaseModel):
    """The schema for updating a project"""

    name: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    admin_email: Optional[str] = None
    admin_id: Optional[str] = None
    user_emails: Optional[List[str]] = None
    user_ids: Optional[List[str]] = None
    qpu_seconds: Optional[float] = None
    updated_at: Optional[str] = Field(default_factory=get_current_timestamp)


class ProjectV2Update(BaseModel):
    """The schema for updating a project in version 2"""

    user_ids: Optional[List[str]] = None


class ProjectV2AdminUpdate(BaseModel):
    """The schema for updating a project as admin"""

    admin_id: str
    qpu_seconds: Optional[float] = None


class Project(ProjectCreate, Document):
    is_active: bool = True
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


def _is_required_in_v2_and_above(value: Any, info: ValidationInfo):
    """Validates that the given value is required in version 2 and should not be None

    Args:
        value: the current value to validate
        info: validation information from the rest of the instance

    Returns:
        the value if it passes validations

    Raises:
        ValueError: is required
    """
    try:
        if info.data["version"] > 1 and value is None:
            raise ValueError("is required")
    except (TypeError, KeyError):
        pass
    return value


def _get_default_in_v1(value: Any, other_values: Dict[str, Any], default: Any):
    """Validates that the given value in version 1 and returns the default if value is None

    Args:
        value: the current value to validate
        other_values: the values of other fields that have already been validated
        default: the default value

    Returns:
        the value if it passes validations
    """
    try:
        if (
            other_values["version"] is None or other_values["version"] < 2
        ) and value is None:
            return default
        return value
    except KeyError:
        return value

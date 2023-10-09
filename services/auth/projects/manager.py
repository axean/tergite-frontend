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

"""Logic managing projects"""
from typing import Any, Dict, Optional

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import NotIn
from fastapi.requests import Request
from fastapi_users import BaseUserManager
from fastapi_users.db import BaseUserDatabase
from fastapi_users.models import ID
from fastapi_users_db_beanie import ObjectIDIDMixin

from ..users.dtos import User
from . import exc
from .dtos import AppToken, AppTokenCreate, Project, ProjectCreate, ProjectUpdate


class ProjectDatabase(BaseUserDatabase[Project, PydanticObjectId]):
    """Database adapter for accessing projects"""

    async def get(self, id: ID) -> Optional[Project]:
        """Get a single project by id."""
        return await Project.get(id)  # type: ignore

    @staticmethod
    async def get_by_ext_id(ext_id: str) -> Optional[Project]:
        """Get a single project by ext_id."""
        return await Project.find_one(Project.ext_id == ext_id)

    @staticmethod
    async def get_by_ext_and_user_id(
        ext_id: str, user_id: PydanticObjectId
    ) -> Optional[Project]:
        """Get a single project by ext_id and user_id.

        The user_id must be among the Project's user ids
        """
        return await Project.find_one(
            Project.ext_id == ext_id, Project.user_ids == user_id
        )

    async def create(self, create_dict: Dict[str, Any]) -> Project:
        """Create a project."""
        project = Project(**create_dict)
        await project.create()
        return project

    async def update(self, project: Project, update_dict: Dict[str, Any]) -> Project:
        """Update a project."""
        for key, value in update_dict.items():
            setattr(project, key, value)
        await project.save()
        return project

    async def delete(self, project: Project) -> None:
        """Delete a project."""
        await project.delete()


class ProjectManager(ObjectIDIDMixin, BaseUserManager[Project, PydanticObjectId]):
    """
    Project management logic.

    Attrs:
        project_db: Database adapter instance for projects.
    """

    project_db: ProjectDatabase

    def __init__(self, project_db: ProjectDatabase):
        self.project_db = project_db

    async def get(self, id: ID) -> Project:
        """
        Get a project by id.

        Args:
            id: Id. of the project to retrieve.

        Raises:
            ProjectNotExists: The project does not exist.

        Returns:
            the project.
        """
        project = await self.project_db.get(id)

        if project is None:
            raise exc.ProjectNotExists()

        return project

    async def get_by_ext_and_user_id(
        self, ext_id: str, user_id: PydanticObjectId
    ) -> Project:
        """
        Get a user by ext_id and user_id.

        The user_id must be attached to this project.

        Args:
            ext_id: external id of the project to retrieve.
            user_id: user_id of the project to retrieve.

        Raises:
            ProjectNotExists: The project does not exist or user_id is not attached to it.

        Returns:
            the project
        """
        project = await self.project_db.get_by_ext_and_user_id(
            ext_id=ext_id, user_id=user_id
        )

        if project is None:
            raise exc.ProjectNotExists()

        return project

    async def create(
        self,
        project_create: ProjectCreate,
        safe: bool = False,
        request: Optional[Request] = None,
    ) -> Project:
        """
        Create a project in database.

        Triggers the on_after_register handler on success.

        Args:
            project_create: The UserCreate model to create.
            safe: If True, sensitive values like is_superuser or is_verified
                will be ignored during the creation, defaults to False.
            request: Optional FastAPI request that triggered the operation, defaults to None.

        Raises:
            ProjectNotExists: A project already exists with the same ext_id.

        Returns:
            a new project.
        """

        existing_project = await self.project_db.get_by_ext_id(project_create.ext_id)
        if existing_project is not None:
            raise exc.ProjectNotExists()

        created_project = await self.user_db.create(project_create.dict())

        await self.on_after_register(created_project, request)

        return created_project

    async def update(
        self,
        project_update: ProjectUpdate,
        project: Project,
        safe: bool = False,
        request: Optional[Request] = None,
    ) -> Project:
        """Update a project.

        Triggers the on_before_update handler before the update happens
        Triggers the on_after_update handler on success

        Args:
            project_update: The ProjectUpdate model containing
                the changes to apply to the user.
            project: The current user to update.
            safe: If True, sensitive values like is_superuser or is_verified
                will be ignored during the update, defaults to False
            request: Optional FastAPI request that
                triggered the operation, defaults to None.

        Returns:
            the updated project.
        """
        update_dict = project_update.dict()
        await self.on_before_update(project, update_dict)
        updated_project = await self.project_db.update(project, update_dict)
        await self.on_after_update(updated_project, update_dict, request)
        return updated_project

    async def delete(
        self,
        project: Project,
        request: Optional[Request] = None,
    ) -> None:
        """Delete a project.

        Args:
            project: The user to delete.
            request: Optional FastAPI request that
                triggered the operation, defaults to None.
        """
        await self.on_before_delete(project, request)
        await self.project_db.delete(project)
        await self.on_after_delete(project, request)

    @staticmethod
    async def on_before_update(original: Project, update_dict: Dict[str, Any]) -> None:
        """Perform logic before the project is updated.

        Here, any AppTokens for this project that have user_ids that have been removed,
        are deleted.

        Args:
            original: the project to be updated
            update_dict: the new updates
        """
        if "user_ids" in update_dict:
            await AppToken.find(
                NotIn(AppToken.user_id, update_dict["user_ids"]),
                AppToken.project_ext_id == original.ext_id,
            ).delete()

    async def on_before_delete(
        self, project: Project, request: Optional[Request] = None
    ) -> None:
        """Perform logic before project delete.

        Here, all AppTokens for this project are deleted.

        Args:
            project: the project to be deleted
            request: Optional FastAPI request that triggered the operation
        """
        await AppToken.find(AppToken.project_ext_id == project.ext_id).delete()

    async def authenticate(
        self,
        details: AppTokenCreate,
        current_user: User,
    ) -> Optional[Project]:
        """
        Authenticate and return a project following an ext_id and a current_user.

        Args:
            details: The app token details to use to generate an app token.
            current_user: the User who is logged in now

        Raises:
            ProjectNotExists: if project does not exist or user does not have access.

        Returns:
            the project of the given project_ext_id in details, and id in current_user
        """
        return await self.get_by_ext_and_user_id(
            details.project_ext_id, current_user.id
        )

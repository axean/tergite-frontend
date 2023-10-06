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

"""Handles authentication and authorization of users"""
import secrets
from datetime import datetime, timezone, timedelta
from functools import lru_cache
from inspect import Signature, Parameter
from typing import (
    Optional,
    Dict,
    Any,
    Sequence,
    Tuple,
    List,
    Callable,
    cast,
    Type,
)

import motor.motor_asyncio
from beanie import init_beanie, PydanticObjectId
from beanie.odm.operators.find.comparison import NotIn
from fastapi import Depends, status, HTTPException, APIRouter
from fastapi_users import BaseUserManager, models
from fastapi_users.authentication import (
    BearerTransport,
    JWTStrategy,
    AuthenticationBackend,
    Strategy,
)
from fastapi_users.authentication.authenticator import (
    DuplicateBackendNamesError,
    name_to_variable_name,
    name_to_strategy_variable_name,
)
from fastapi_users.authentication.strategy import DatabaseStrategy
from fastapi_users.db import BeanieUserDatabase, ObjectIDIDMixin, BaseUserDatabase
from fastapi_users.models import ID
from fastapi_users.types import DependencyCallable
from fastapi_users_db_beanie.access_token import BeanieAccessTokenDatabase
from httpx_oauth.clients.github import GitHubOAuth2
from httpx_oauth.clients.microsoft import MicrosoftGraphOAuth2
from httpx_oauth.clients.openid import OpenID
from fastapi.requests import Request
from makefun import with_signature

from . import exc
from .dtos import (
    User,
    OAuthAccount,
    AppToken,
    AppTokenCreate,
    Project,
    ProjectCreate,
    ProjectUpdate,
)
from .utils import routers


class UserManager(ObjectIDIDMixin, BaseUserManager[User, PydanticObjectId]):
    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has registered.")


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


ProjectManagerDependency = DependencyCallable[ProjectManager]
CurrentUserDependency = DependencyCallable[User]
CurrentSuperUserDependency = DependencyCallable[User]


class AppTokenAuthenticator:
    """
    Provides dependency callables to retrieve authenticated project.

    It performs the authentication against a list of backends
    defined by the end-developer. The first backend yielding a user wins.
    If no backend yields a user, an HTTPException is raised.

    Attributes:
        backends: List of authentication backends.
        get_project_manager: Project manager dependency callable.
    """

    backends: Sequence[AuthenticationBackend]

    def __init__(
        self,
        backends: Sequence[AuthenticationBackend],
        get_project_manager_dep: ProjectManagerDependency,
    ):
        self.backends = backends
        self.get_project_manager = get_project_manager_dep

    def current_project_token(
        self,
        optional: bool = False,
        active: bool = False,
        **kwargs,
    ):
        """Return a dependency callable to retrieve the current project and token.

        Args:
            optional: If `True`, `None` is returned if there is no current project
                or if it doesn't pass the other requirements.
                Otherwise, throw `401 Unauthorized`. Defaults to `False`.
                Otherwise, an exception is raised. Defaults to `False`.
            active: If `True`, throw `401 Unauthorized` if
                the project is inactive. Defaults to `False`.
        """
        signature = self._get_dependency_signature()

        @with_signature(signature)
        async def current_project_token_dependency(*args, **options):
            return await self._authenticate(
                *args,
                optional=optional,
                active=active,
                **options,
            )

        return current_project_token_dependency

    def current_project(self, optional: bool = False, active: bool = False, **kwargs):
        """Return a dependency callable to retrieve current project.

        Args:
            optional: If `True`, `None` is returned if there is no current project
                or if it doesn't pass the other requirements.
                Otherwise, throw `401 Unauthorized`. Defaults to `False`.
                Otherwise, an exception is raised. Defaults to `False`.
            active: If `True`, throw `401 Unauthorized` if
                the project is inactive. Defaults to `False`.
        """
        signature = self._get_dependency_signature()

        @with_signature(signature)
        async def current_project_dependency(*args, **options):
            user, _ = await self._authenticate(
                *args,
                optional=optional,
                active=active,
                **options,
            )
            return user

        return current_project_dependency

    async def _authenticate(
        self,
        *args,
        project_manager: ProjectManager,
        optional: bool = False,
        active: bool = False,
        **kwargs,
    ) -> Tuple[Optional[Project], Optional[str]]:
        project: Optional[Project] = None
        token: Optional[str] = None
        enabled_backends: Sequence[AuthenticationBackend] = kwargs.get(
            "enabled_backends", self.backends
        )
        for backend in self.backends:
            if backend in enabled_backends:
                token = kwargs[name_to_variable_name(backend.name)]
                strategy: Strategy[models.UP, models.ID] = kwargs[
                    name_to_strategy_variable_name(backend.name)
                ]
                if token is not None:
                    project = await strategy.read_token(token, project_manager)
                    if project:
                        break

        status_code = status.HTTP_401_UNAUTHORIZED
        if project:
            status_code = status.HTTP_403_FORBIDDEN
            if active and not project.is_active:
                status_code = status.HTTP_401_UNAUTHORIZED
                project = None
        if not project and not optional:
            raise HTTPException(status_code=status_code)
        return project, token

    def _get_dependency_signature(self) -> Signature:
        """Generate a dynamic signature for the current_user dependency.
        ♂️
        Thanks to "makefun", we are able to generate callable
        with a dynamic number of dependencies at runtime.
        This way, each security schemes are detected by the OpenAPI generator.
        """
        try:
            parameters: List[Parameter] = [
                Parameter(
                    name="project_manager",
                    kind=Parameter.POSITIONAL_OR_KEYWORD,
                    default=Depends(self.get_project_manager),
                )
            ]

            for backend in self.backends:
                parameters += [
                    Parameter(
                        name=name_to_variable_name(backend.name),
                        kind=Parameter.POSITIONAL_OR_KEYWORD,
                        default=Depends(cast(Callable, backend.transport.scheme)),
                    ),
                    Parameter(
                        name=name_to_strategy_variable_name(backend.name),
                        kind=Parameter.POSITIONAL_OR_KEYWORD,
                        default=Depends(backend.get_strategy),
                    ),
                ]

            return Signature(parameters)
        except ValueError:
            raise DuplicateBackendNamesError()


class FastAPIProjects:
    def __init__(
        self,
        get_project_manager_dep: ProjectManagerDependency,
        get_current_user_dep: CurrentUserDependency,
        get_current_superuser_dep: CurrentSuperUserDependency,
        auth_backends: Sequence[AuthenticationBackend],
    ):
        self.authenticator = AppTokenAuthenticator(
            backends=auth_backends, get_project_manager_dep=get_project_manager_dep
        )
        self.get_project_manager = get_project_manager_dep
        self.get_current_user = get_current_user_dep
        self.get_current_superuser = get_current_superuser_dep
        self.current_project = self.authenticator.current_project

    def get_app_tokens_router(self, backend: AuthenticationBackend) -> APIRouter:
        """
        Return an auth router for a given authentication backend.

        Args:
            backend: The authentication backend instance.
        """
        return routers.get_app_tokens_router(
            backend=backend,
            get_project_manager=self.get_project_manager,
            get_current_user=self.get_current_user,
            authenticator=self.authenticator,
        )

    def get_projects_router(self) -> APIRouter:
        """Return a router with routes to manage projects."""
        return routers.get_projects_router(
            get_project_manager=self.get_project_manager,
            get_current_superuser=self.get_current_superuser,
            project_schema=Project,
            project_update_schema=ProjectUpdate,
            project_create_schema=ProjectCreate,
        )


class AppTokenDatabase(BeanieAccessTokenDatabase):
    """
    App token database adapter.
    """

    def __init__(self):
        super().__init__(AppToken)

    async def get_by_token(self, token: str, **kwargs) -> Optional[AppToken]:
        query: Dict[str, Any] = {"token": token}
        response: Optional[AppToken] = await self.access_token_model.find_one(query)
        if response:
            # return None for tokens that are past their age
            lifespan = response.created_at - datetime.now(timezone.utc)
            if lifespan >= timedelta(seconds=response.lifetime_seconds):
                # probably delete it
                # await response.delete()
                return None

        return response


class AppTokenStrategy(DatabaseStrategy):
    """Strategy that handles app tokens"""

    def __init__(self, database: AppTokenDatabase):
        super().__init__(database)

    async def write_token(self, payload: AppTokenCreate) -> str:
        token_dict = payload.dict()
        token_dict["token"] = secrets.token_urlsafe()
        access_token = await self.database.create(token_dict)
        return access_token.token


def get_jwt_backend(
    login_url: str,
    jwt_secret: str,
    lifetime_seconds: int = 3600,
) -> AuthenticationBackend:
    """Creates an auth backend that uses JWT to handle auth."""
    bearer_transport = BearerTransport(tokenUrl=login_url)

    def get_jwt_strategy() -> JWTStrategy:
        return JWTStrategy(secret=jwt_secret, lifetime_seconds=lifetime_seconds)

    return AuthenticationBackend(
        name="jwt",
        transport=bearer_transport,
        get_strategy=get_jwt_strategy,
    )


def get_app_token_backend(app_token_generation_url: str) -> AuthenticationBackend:
    """Creates an auth backend that uses database app tokens to authenticate"""
    bearer_transport = BearerTransport(tokenUrl=app_token_generation_url)

    def get_app_token_strategy(
        token_db: AppTokenDatabase = Depends(get_app_token_db),
    ) -> AppTokenStrategy:
        return AppTokenStrategy(token_db)

    return AuthenticationBackend(
        name="app-token",
        transport=bearer_transport,
        get_strategy=get_app_token_strategy,
    )


async def on_startup(db: motor.motor_asyncio.AsyncIOMotorDatabase):
    """Runs init operations when the application is starting up"""
    await init_beanie(
        database=db,
        document_models=[
            User,
            AppToken,
        ],
    )


async def get_user_db():
    """Dependency injector of the users database"""
    yield BeanieUserDatabase(User, OAuthAccount)


async def get_project_db():
    """Dependency injector of the users database"""
    yield ProjectDatabase()


async def get_app_token_db():
    """Dependency injector for getting app token database"""
    yield AppTokenDatabase()


async def get_user_manager(user_db: BeanieUserDatabase = Depends(get_user_db)):
    """Dependency injector for UserManager"""
    yield UserManager(user_db)


async def get_project_manager(project_db: ProjectDatabase = Depends(get_project_db)):
    """Dependency injector for ProjectManager"""
    yield ProjectManager(project_db)


@lru_cache()
def get_github_oauth_client(
    client_id: str, client_secret: str, **kwargs
) -> GitHubOAuth2:
    """Gets the GitHubOAuth2 corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.
    """
    return GitHubOAuth2(client_id, client_secret, **kwargs)


@lru_cache()
def get_microsoft_oauth_client(
    client_id: str, client_secret: str, **kwargs
) -> MicrosoftGraphOAuth2:
    """Gets the MicrosoftGraphOAuth2 corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.
    """
    return MicrosoftGraphOAuth2(client_id, client_secret, **kwargs)


@lru_cache()
def get_openid_client(
    client_id: str, client_secret: str, openid_configuration_endpoint: str, **kwargs
) -> OpenID:
    """Gets the OpenID corresponding to the given client id and secret and kwargs

    This is a memoized function that will try to avoid recreating this client
    if the parameters passed have not changed.
    """
    return OpenID(client_id, client_secret, openid_configuration_endpoint, **kwargs)

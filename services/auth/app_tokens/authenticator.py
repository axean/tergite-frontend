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
"""FastAPIUsers-specific definition of Authenticator for app tokens"""
from inspect import Parameter, Signature
from typing import Callable, List, Optional, Sequence, Tuple, cast

from fastapi import Depends, HTTPException, status
from fastapi_users import models
from fastapi_users.authentication import AuthenticationBackend, Strategy
from fastapi_users.authentication.authenticator import (
    DuplicateBackendNamesError,
    name_to_strategy_variable_name,
    name_to_variable_name,
)
from makefun import with_signature

from ..projects.dtos import Project
from ..projects.manager import ProjectAppTokenManager, ProjectManagerDependency


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
        project_manager: ProjectAppTokenManager,
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
        error_msg: Optional[str] = None
        if project:
            status_code = status.HTTP_403_FORBIDDEN
            if active and not project.is_active:
                status_code = status.HTTP_401_UNAUTHORIZED
                project = None
            elif project.qpu_seconds <= 0:
                # tokens for projects with no qpu allocation
                # are not allowed except if optional is True
                error_msg = f"{project.qpu_seconds} QPU seconds left on project {project.ext_id}"
                project = None
        if not project and not optional:
            raise HTTPException(status_code=status_code, detail=error_msg)
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

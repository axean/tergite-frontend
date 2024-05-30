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
"""FastAPIUsers-specific definition of Authenticator for users"""
from typing import Optional, Sequence, Tuple

from fastapi import HTTPException, status
from fastapi_users.authentication import AuthenticationBackend, Authenticator
from fastapi_users.authentication.authenticator import (
    EnabledBackendsDependency,
    name_to_strategy_variable_name,
    name_to_variable_name,
)
from makefun import with_signature

from utils.config import UserRole

from .dtos import ID, UP
from .strategy import CustomJWTStrategy


class UserAuthenticator(Authenticator):
    def current_user(
        self,
        optional: bool = False,
        active: bool = False,
        verified: bool = False,
        superuser: bool = False,
        get_enabled_backends: Optional[EnabledBackendsDependency] = None,
        roles: Tuple[UserRole] = (),
    ):
        """Return a dependency callable to retrieve currently authenticated user.

        Args:
            optional: If `True`, `None` is returned if there is no authenticated user
                or if it doesn't pass the other requirements.
                Otherwise, throw `401 Unauthorized`. Defaults to `False`.
                Otherwise, an exception is raised. Defaults to `False`.
            active: If `True`, throw `401 Unauthorized` if
                the authenticated user is inactive. Defaults to `False`.
            verified: If `True`, throw `401 Unauthorized` if
                the authenticated user is not verified. Defaults to `False`.
            superuser: If `True`, throw `403 Forbidden` if
                the authenticated user is not a superuser. Defaults to `False`.
            get_enabled_backends: Optional dependency callable returning
                a list of enabled authentication backends.
                Useful if you want to dynamically enable some authentication backends
                based on external logic, like a configuration in database.
                By default, all specified authentication backends are enabled.
                Please not however that every backends will appear in the OpenAPI documentation,
                as FastAPI resolves it statically.
            roles: Tuple of possible roles the user should have. The user can have any of
                the roles. If the user doesn't have any, a 403 error is raised.

        Returns:
            a dependency injector to get the current user for any of the given roles
        """
        signature = self._get_dependency_signature(get_enabled_backends)

        @with_signature(signature)
        async def current_user_dependency(*args, **kwargs):
            user, _ = await self._authenticate(
                *args,
                optional=optional,
                active=active,
                verified=verified,
                superuser=superuser,
                **kwargs,
            )

            if user and roles and not any(role in user.roles for role in roles):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

            return user

        return current_user_dependency

    def current_user_id(
        self,
        optional: bool = False,
        get_enabled_backends: Optional[EnabledBackendsDependency] = None,
    ):
        """Creates a dependency callable to retrieve currently authenticated user's id.

        It is faster as it avoid hitting the database

        Args:
            optional: If `True`, `None` is returned if there is no authenticated user
                or if it doesn't pass the other requirements.
                Otherwise, throw `401 Unauthorized`. Defaults to `False`.
                Otherwise, an exception is raised. Defaults to `False`.
            get_enabled_backends: Optional dependency callable returning
                a list of enabled authentication backends.
                Useful if you want to dynamically enable some authentication backends
                based on external logic, like a configuration in database.
                By default, all specified authentication backends are enabled.
                Please note however that every backends will appear in the OpenAPI documentation,
                as FastAPI resolves it statically.

        Returns:
            the dependency injector callable
        """
        signature = self._get_dependency_signature(get_enabled_backends)

        @with_signature(signature)
        async def current_user_id_dependency(*args, **kwargs):
            return await self._authenticate_without_db(
                *args,
                optional=optional,
                **kwargs,
            )

        return current_user_id_dependency

    async def _authenticate_without_db(
        self,
        *args,
        optional: bool = False,
        **kwargs,
    ) -> Optional[str]:
        """Attempts to authenticate the given user without hitting the database"""
        user_id: Optional[ID] = None
        enabled_backends: Sequence[AuthenticationBackend] = kwargs.get(
            "enabled_backends", self.backends
        )
        for backend in self.backends:
            if backend in enabled_backends:
                token = kwargs[name_to_variable_name(backend.name)]
                strategy: CustomJWTStrategy[UP, ID] = kwargs[
                    name_to_strategy_variable_name(backend.name)
                ]
                if token is not None:
                    try:
                        user_id = strategy.get_user_id(token)
                        if user_id:
                            break

                    except AttributeError:
                        pass

        status_code = status.HTTP_401_UNAUTHORIZED
        if user_id:
            status_code = status.HTTP_403_FORBIDDEN

        if not user_id and not optional:
            raise HTTPException(status_code=status_code)
        return user_id

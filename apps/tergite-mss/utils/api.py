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
"""Utility functions for API related code"""
import logging
from typing import (
    Any,
    Awaitable,
    Callable,
    Generic,
    List,
    Literal,
    Optional,
    TypeVar,
    Union,
)

from fastapi import HTTPException, Response, status
from fastapi.exception_handlers import http_exception_handler
from fastapi.requests import Request
from pydantic import BaseModel
from pydantic.main import IncEx

ITEM = TypeVar("ITEM", bound=BaseModel)


class PaginatedListResponse(BaseModel, Generic[ITEM]):
    """The response when sending paginated data"""

    skip: int = 0
    limit: Optional[int] = None
    data: List[ITEM] = []

    def model_dump(
        self,
        *,
        mode: Literal["json", "python"] | str = "python",
        include: IncEx | None = None,
        exclude: IncEx | None = None,
        context: Any | None = None,
        by_alias: bool | None = None,
        exclude_unset: bool = False,
        exclude_defaults: bool = False,
        exclude_data_none_fields: bool = True,
        round_trip: bool = False,
        warnings: bool | Literal["none", "warn", "error"] = True,
        fallback: Callable[[Any], Any] | None = None,
        serialize_as_any: bool = False,
        **kwargs,
    ) -> dict[str, Any]:
        return {
            "skip": self.skip,
            "limit": self.limit,
            "data": [
                item.model_dump(
                    mode=mode,
                    include=include,
                    exclude=exclude,
                    context=context,
                    by_alias=by_alias,
                    exclude_unset=exclude_unset,
                    exclude_defaults=exclude_defaults,
                    exclude_none=exclude_data_none_fields,
                    round_trip=round_trip,
                    warnings=warnings,
                    fallback=fallback,
                    serialize_as_any=serialize_as_any,
                )
                for item in self.data
            ],
        }


def get_bearer_token(request: Request, raise_if_error: bool = True) -> Optional[str]:
    """Extracts the bearer token from the request or throws a 401 exception if not exist and `raise_if_error` is True

    Args:
        request: the request object from FastAPI
        raise_if_error: whether an error should be raised if it occurs

    Raises:
        HTTPException: Unauthorized

    Returns:
        the bearer token as a string or None if it does not exist and `raise_if_error` is False
    """
    try:
        authorization_header = request.headers["Authorization"]
        return authorization_header.split("Bearer ")[1].strip()
    except (KeyError, IndexError):
        if raise_if_error:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


def to_http_error(
    status_code: int, custom_message: Optional[str] = None
) -> Callable[[Request, Exception], Union[Response, Awaitable[Response]]]:
    """An error handler that converts the exception to an HTTPException

    The details in the http error are got from the exception itself.
    It also logs the original error.

    Args:
        status_code: the HTTP status code
        custom_message: a custom message to send to the client

    Returns:
        an HTTP exception handler function
    """

    async def handler(request: Request, exp: Exception) -> Response:
        logging.error(exp)
        message = custom_message
        if message is None:
            message = f"{exp}"

        http_exp = HTTPException(status_code, message)
        return await http_exception_handler(request, http_exp)

    return handler

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

"""Common utility functions for the auth service"""
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

# https://www.mongodb.com/docs/manual/reference/operator/query/in/#syntax
MAX_LIST_QUERY_LEN = 99


class TooManyListQueryParams(HTTPException):
    """HTTPException when the items passed to a list query param item are too many.

    It is useful to avoid deteriorated performance with the databases.
    e.g. it is recommended for mongodb $in to have less than 100 items in list.
    as can be seen at
    https://www.mongodb.com/docs/manual/reference/operator/query/in/#syntax
    """

    def __init__(
        self,
        query_param: str,
        expected: int,
        got: int,
        headers: Optional[Dict[str, Any]] = None,
    ):
        message = f"too many items passed to query {query_param}; expected {expected}, got {got}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST, detail=message, headers=headers
        )

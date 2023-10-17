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

"""Definition of the FastAPIUsers-specific Database adapter for app tokens"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Mapping, Optional

from beanie import PydanticObjectId
from fastapi_users_db_beanie.access_token import BeanieAccessTokenDatabase

from .dtos import AppToken


class AppTokenDatabase(BeanieAccessTokenDatabase):
    """
    App token database adapter.
    """

    def __init__(self):
        super().__init__(AppToken)

    async def get_by_token(self, token: str, *args, **filters) -> Optional[AppToken]:
        """Gets an AppToken by the token

        Args:
            token: the token of the AppToken to get
            filters: any extra filters to match against apart from the token

        Returns:
            the matched AppToken or None if no document was matched
        """
        filters["token"] = token
        return await self._find_one(filters)

    async def get(self, _id: PydanticObjectId, *args, **filters) -> Optional[AppToken]:
        """Gets an AppToken by _id

        Args:
            _id: the ID of the AppToken to get
            filters: any extra filters to match against apart from the _id

        Returns:
            the matched AppToken or None if no document was matched
        """
        filters["_id"] = _id
        return await self._find_one(filters)

    async def _find_one(self, _filter) -> Optional[AppToken]:
        """Finds the given token by the given filter.

        Args:
            _filter: the filter object to match against

        Returns:
            the matched AppToken or None if no document was matched
        """
        response: Optional[AppToken] = await self.access_token_model.find_one(_filter)
        if response:
            # return None for tokens that are past their age
            lifespan = datetime.now(timezone.utc) - response.created_at
            if lifespan >= timedelta(seconds=response.lifespan_seconds):
                # delete expired tokens automatically
                await response.delete()
                return None

        return response

    @staticmethod
    async def delete_many(
        filter_obj: Mapping[str, Any], skip: int = 0, limit: Optional[int] = None
    ) -> None:
        """
        Deleted a list of projects to basing on filter.

        Args:
            filter_obj: the PyMongo-like filter object e.g. `{"user_id": "uidufiud"}`.
            skip: the number of matched records to skip
            limit: the maximum number of records to return.
                If None, all possible records are returned.

        Returns:
            the list of matched projects
        """
        return await AppToken.find(
            filter_obj,
            skip=skip,
            limit=limit,
        ).delete()

    @staticmethod
    async def get_many(
        filter_obj: Mapping[str, Any], skip: int = 0, limit: Optional[int] = None
    ) -> List[AppToken]:
        """
        Get a list of app tokens basing on filter.

        Args:
            filter_obj: the PyMongo-like filter object e.g. `{"user_id": "uidufiud"}`.
            skip: the number of matched records to skip
            limit: the maximum number of records to return.
                If None, all possible records are returned.

        Returns:
            the list of matched projects
        """
        return await AppToken.find(
            filter_obj,
            skip=skip,
            limit=limit,
        ).to_list()

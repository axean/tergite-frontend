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
"""FastAPIUsers-specific custom definition of JWT Strategy for users"""
from typing import Generic, Optional

import jwt
from fastapi_users.authentication import JWTStrategy
from fastapi_users.jwt import decode_jwt, generate_jwt

from .dtos import ID, UP


class CustomJWTStrategy(
    JWTStrategy[UP, ID],
    Generic[UP, ID],
):
    """An extension of the basic JWT strategy"""

    def get_user_id(self, token: Optional[str]) -> Optional[str]:
        """Returns the user id without hitting the database"""
        try:
            data = decode_jwt(
                token, self.decode_key, self.token_audience, algorithms=[self.algorithm]
            )
            user_id = data.get("sub")
            if user_id is None:
                return None
        except jwt.PyJWTError:
            return None

        return user_id

    async def write_token(self, user: UP) -> str:
        data = {
            "sub": str(user.id),
            "aud": self.token_audience,
            "roles": list(user.roles),
        }
        return generate_jwt(
            data, self.encode_key, self.lifetime_seconds, algorithm=self.algorithm
        )

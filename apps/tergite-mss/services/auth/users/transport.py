# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Custom transport for authentication"""
from fastapi.responses import JSONResponse, Response
from fastapi_users.authentication import CookieTransport


class JwtCookieTransport(CookieTransport):
    async def get_logout_response(self) -> Response:
        response = JSONResponse({"message": "logged out"})
        return self._set_logout_cookie(response)

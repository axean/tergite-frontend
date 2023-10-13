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

"""Validators for the users submodule in the auth service"""
import re
from typing import Dict, Optional, Protocol, Tuple

from . import exc


class Validator(Protocol):
    async def validate(
        self, email: str, oauth_name: Optional[str] = None, **kwargs
    ) -> None:
        """Validate email basing on custom validation for the given oauth_name.

        **Override this to add custom logic**

        Args:
            email: The email to validate.
            oauth_name: The oauth_name for which the validation is to be done.

        Raises:
            InvalidEmailException: the email is invalid.
            UnsupportedOauthException: this oauth login type not supported

        Returns:
            None if the email is valid.
        """
        raise NotImplementedError("validate must be implemented")


class EmailRegexValidator(Validator):
    """A helper for validating emails using regex"""

    def __init__(self, config: Dict[str, Tuple[str, re.RegexFlag]] = None):
        if config is None:
            config = {}

        self.__config = {
            k: re.compile(text, flag) for k, (text, flag) in config.items()
        }

    async def validate(
        self, email: str, oauth_name: Optional[str] = None, **kwargs
    ) -> None:
        try:
            email_regex: re.Pattern = self.__config[oauth_name]
            if email_regex.match(email) is None:
                raise exc.InvalidEmailException("user not permitted")

        except KeyError:
            raise exc.UnsupportedOauthException("this oauth login type not supported")

        return None

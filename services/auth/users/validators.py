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
from typing import Dict, Optional, Protocol, Union

from services.auth.users import exc


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


class EmailRegexValidator(Validator, dict):
    """A helper for validating emails using regex"""

    def __init__(
        self, regex_flags: Dict[str, Union[int, re.RegexFlag]] = None, *args, **kwargs
    ):
        self.__regex_flags = regex_flags if regex_flags else {}

        super().__init__(*args, **kwargs)
        for k, v in self.items():
            self.__setitem__(k, v)

    def __setitem__(self, oauth_name, value):
        """Set self[oauth_name] to re.compile(value, regex_flags)"""
        flag = self.__regex_flags.get(oauth_name, 0)
        try:
            return super().__setitem__(oauth_name, re.compile(value, flag))
        except TypeError:
            raise TypeError(
                f"value for key '{oauth_name}' expected to be string, got '{type(value)}'"
            )

    async def validate(
        self, email: str, oauth_name: Optional[str] = None, **kwargs
    ) -> None:
        try:
            email_regex: re.Pattern = self[oauth_name]
            if email_regex.match(email) is None:
                raise exc.InvalidEmailException("the email is invalid")

        except KeyError:
            raise exc.UnsupportedOauthException("this oauth login type not supported")

        return None

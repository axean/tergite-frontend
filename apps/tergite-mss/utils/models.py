# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
#
# Refactored by Martin Ahindura 2023-11-08
"""Utilities specific to models"""
from typing import Any, Dict, Optional, Type, TypeVar

from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


def try_model_validate(cls: Type[T], obj: Dict[str, Any]) -> Optional[T]:
    """Attempt to parse an object and return None in case of an error

    Args:
        cls: the subclass of BaseModel to parse to
        obj: the dictionary to parse

    Returns:
        the parsed object or None in case of Validation errors
    """
    try:
        return cls.model_validate(obj)
    except ValidationError:
        return None

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
from typing import Any, Mapping, Optional, Type, TypeVar

from pydantic import BaseModel, ValidationError

from utils.exc import DbValidationError

ModelOrDict = TypeVar("ModelOrDict", dict, BaseModel)


def parse_record(type__: Type[ModelOrDict], record: Mapping[str, Any]) -> ModelOrDict:
    """Converts a record to the given type

    Args:
        type__: the type to parse to
        record: the item to convert

    Returns:
        the record converted to the given type

    Raises:
        ValidationError: the record has some pydantic validation errors
    """
    try:
        return type__.model_validate(record)
    except AttributeError:
        return dict(record)
    except ValidationError as exp:
        raise DbValidationError(exp.errors())


def try_parse_record(
    type__: Type[ModelOrDict], record: Mapping[str, Any]
) -> Optional[ModelOrDict]:
    """Tries to convert the given record into the given type and returns None if it fails

    Args:
        type__: the type to parse to
        record: the item to convert

    Returns:
        the record converted to the given type or None if there were validation errors
    """
    try:
        return parse_record(type__, record)
    except DbValidationError:
        return None

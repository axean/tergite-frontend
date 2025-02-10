# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Chalmers Next Labs 2025
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
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Mapping, Optional, Tuple, Union

from beanie import PydanticObjectId
from bson import ObjectId
from pydantic import Extra

from utils.date_time import datetime_to_zulu
from utils.models import ZEncodedBaseModel

if TYPE_CHECKING:
    DictStrAny = Dict[str, Any]
    IntStr = Union[int, str]
    AbstractSetIntStr = AbstractSet[IntStr]
    MappingIntStrAny = Mapping[IntStr, Any]


class DeviceV2Upsert(ZEncodedBaseModel):
    """The schema for upserting device"""

    name: str
    version: str
    number_of_qubits: int
    last_online: Optional[str] = None
    is_online: bool
    basis_gates: List[str]
    coupling_map: List[Tuple[int, int]]
    coordinates: List[Tuple[int, int]]
    is_simulator: bool

    class Config:
        json_encoders = {datetime: datetime_to_zulu}
        extra = Extra.allow

    def dict(
        self,
        *,
        include: Optional[Union["AbstractSetIntStr", "MappingIntStrAny"]] = None,
        exclude: Optional[Union["AbstractSetIntStr", "MappingIntStrAny"]] = None,
        by_alias: bool = False,
        skip_defaults: Optional[bool] = None,
        exclude_unset: bool = False,
        exclude_defaults: bool = False,
        exclude_none: bool = False,
    ) -> "DictStrAny":
        return super().dict(
            include=include,
            exclude=exclude,
            by_alias=by_alias,
            skip_defaults=skip_defaults,
            exclude_defaults=exclude_defaults,
            exclude_none=True,
        )


class DeviceV2(DeviceV2Upsert):
    """The Schema for the devices"""

    id: PydanticObjectId
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        fields = {"id": "_id"}
        orm_mode = True
        json_encoders = {ObjectId: str, datetime: datetime_to_zulu}
        extra = Extra.allow

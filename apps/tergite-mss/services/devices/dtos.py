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
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Dict,
    List,
    Literal,
    Mapping,
    Optional,
    Tuple,
    Union,
)

from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict, Field
from pydantic.main import IncEx

if TYPE_CHECKING:
    DictStrAny = Dict[str, Any]
    IntStr = Union[int, str]
    AbstractSetIntStr = AbstractSet[IntStr]
    MappingIntStrAny = Mapping[IntStr, Any]


class DeviceV2Upsert(BaseModel):
    """The schema for upserting device"""

    model_config = ConfigDict(extra="allow")

    name: str
    version: str
    number_of_qubits: int
    last_online: Optional[str] = None
    is_online: bool
    basis_gates: List[str]
    coupling_map: List[Tuple[int, int]]
    coordinates: List[Tuple[int, int]]
    is_simulator: bool

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
        exclude_none: bool = False,
        round_trip: bool = False,
        warnings: bool | Literal["none", "warn", "error"] = True,
        fallback: Callable[[Any], Any] | None = None,
        serialize_as_any: bool = False,
    ) -> dict[str, Any]:
        return super().model_dump(
            mode=mode,
            include=include,
            exclude=exclude,
            context=context,
            by_alias=by_alias,
            exclude_unset=exclude_unset,
            exclude_defaults=exclude_defaults,
            exclude_none=True,
            round_trip=round_trip,
            warnings=warnings,
            fallback=fallback,
            serialize_as_any=serialize_as_any,
        )


class DeviceV2(DeviceV2Upsert):
    """The Schema for the devices"""

    model_config = ConfigDict(
        from_attributes=True,
        extra="allow",
    )

    id: PydanticObjectId = Field(alias="_id")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

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
"""Data Transfer objects for the puhuri external service"""
import enum
import math
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Mapping, Optional, Union

from beanie import PydanticObjectId
from pydantic import BaseModel, Extra, Field
from waldur_client import ComponentUsage

from utils.models import ZEncodedBaseModel

if TYPE_CHECKING:
    DictStrAny = Dict[str, Any]
    IntStr = Union[int, str]
    AbstractSetIntStr = AbstractSet[IntStr]
    MappingIntStrAny = Mapping[IntStr, Any]

RESOURCE_USAGE_COLLECTION = "resource_usage_reports"


class ResourceUsagePost(ZEncodedBaseModel):
    id: Optional[PydanticObjectId] = Field(
        None,
        alias="_id",
    )
    customer_uuid: str
    payload: "PuhuriUsageReport"
    attempts: int = 1
    is_success: bool = False
    failure_reasons: List[str] = []
    created_on: datetime
    last_modified_on: datetime

    def dict(
        self,
        *,
        include: Optional[Union["AbstractSetIntStr", "MappingIntStrAny"]] = None,
        exclude: Optional[Union["AbstractSetIntStr", "MappingIntStrAny"]] = None,
        by_alias: bool = True,  # default this to True
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
            exclude_unset=exclude_unset,
            exclude_defaults=exclude_defaults,
            exclude_none=exclude_none,
        )


class PuhuriResource(ZEncodedBaseModel, extra=Extra.allow):
    """The schema of the items got from querying api/marketplace-resources"""

    uuid: str
    project_uuid: str
    customer_uuid: str
    offering_uuid: str
    plan_uuid: str
    plan_unit: "PuhuriPlanUnit"  # month, hour, day, half_month
    state: str  # Creating, ...
    is_usage_based: bool  # Here, billing is done after usage...i.e. post paid as opposed to pre-payment o
    # or pre-allocation...which QAL9000 expects
    is_limit_based: bool  # (FIXME: We probably should allow only limit-based resources)
    limits: dict  # e.g. {"pre-paid": 20). the "pre-paid" name is something one has to set in the UI. It can be anything
    # but it is the maximum amount bought by the user

    @property
    def has_limits(self) -> bool:
        """Whether resource has limits or not"""
        return len(self.limits) != 0


class PuhuriOrder(ZEncodedBaseModel, extra=Extra.allow):
    """The schema of the Order objects as got from Puhuri"""

    uuid: str
    project_name: str
    project_description: str
    project_uuid: str
    customer_name: str
    customer_description: str
    items: List["OrderItem"]


class OrderType(str, enum.Enum):
    CREATE = "Create"
    TERMINATE = "Terminate"


class OrderItem(ZEncodedBaseModel, extra=Extra.allow):
    """The schema for the order item of the Puhuri Order"""

    uuid: str
    attributes: dict
    type: OrderType


class PuhuriProviderOffering(ZEncodedBaseModel, extra=Extra.allow):
    """The schema for the provider offerings got from Puhuri"""

    uuid: str
    name: str
    customer_uuid: str  # the uuid of the service provider who owns it
    plans: List["PuhuriPlan"]
    components: List["PuhuriComponent"]  # PuhuriComponent.type is a usage type


class PuhuriUsageReport(BaseModel, extra=Extra.allow):
    resource: str  # uuid of resource
    date: str  # datetime in iso format
    plan_period: str  # uuid of plan
    usages: List[ComponentUsage]  # get ComponentUsage.type from PuhuriComponent.type


class PuhuriPlanType(str, enum.Enum):
    USAGE_BASED = "usage-based"
    LIMIT_BASED = "limit-based"


class PuhuriPlanUnit(str, enum.Enum):
    MONTH = "month"
    HOUR = "hour"
    DAY = "day"
    HALF_MONTH = "half_month"

    def to_seconds(self):
        """Plan unit in terms of seconds"""
        return _PLAN_UNIT_SECONDS_MAP[self]

    def from_seconds(self, amount: float) -> int:
        """Get amount from seconds into this given unit"""
        # FIXME: experiments may be quick so if the plan unit is huge,
        #   the customers will get cheated big.
        return math.ceil(amount / _PLAN_UNIT_SECONDS_MAP[self])


class PuhuriPlan(ZEncodedBaseModel, extra=Extra.allow):
    """The schema for the plans for each offering as got from Puhuri"""

    uuid: str
    name: str
    plan_type: PuhuriPlanType
    is_active: bool
    unit: PuhuriPlanUnit
    unit_price: str  # float-like str


class PuhuriComponent(ZEncodedBaseModel, extra=Extra.allow):
    """The schema for Puhuri Components"""

    uuid: str
    type: str
    name: str


_PLAN_UNIT_SECONDS_MAP: Dict[PuhuriPlanUnit, int] = {
    PuhuriPlanUnit.MONTH: 30 * 24 * 3600,
    PuhuriPlanUnit.HOUR: 3600,
    PuhuriPlanUnit.DAY: 24 * 3600,
    PuhuriPlanUnit.HALF_MONTH: 15 * 24 * 3600,
}

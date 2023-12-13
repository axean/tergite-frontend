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
from datetime import datetime
from typing import List

from pydantic import Extra

from utils.models import ZEncodedBaseModel

RESOURCE_USAGE_COLLECTION = "resource_usage_reports"


class ResourceUsageReport(ZEncodedBaseModel):
    payload: "PuhuriResourceUsage"
    attempts: int = 1
    is_success: bool = False
    failure_reasons: List[str] = []
    created_on: datetime
    last_modified_on: datetime


class ResourceAttributes(ZEncodedBaseModel, extra=Extra.allow):
    """The collection of attributes that are passed to the resource allocation"""

    name: str = ""
    description: str = ""
    qpu_seconds: int = 0


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
    attributes: ResourceAttributes
    type: OrderType


class PuhuriResourceUsage(ZEncodedBaseModel, extra=Extra.allow):
    """The schema for resource usage sent to Puhuri"""

    amount: float
    project_id: str

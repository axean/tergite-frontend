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
"""Data Transfer Objects for the quantum jobs service"""
import enum
from datetime import datetime
from typing import Optional, TypedDict

from bson import ObjectId
from pydantic import Extra, Field

from utils.date_time import get_current_timestamp
from utils.models import ZEncodedBaseModel

from .utils import get_uuid4_str


class CreatedJobResponse(TypedDict):
    """The response when a new job is created"""

    job_id: str
    upload_url: str


class TimestampPair(ZEncodedBaseModel):
    started: Optional[datetime]
    finished: Optional[datetime]


class JobTimestamps(ZEncodedBaseModel):
    """Timestamps for the job"""

    registration: Optional[TimestampPair] = None
    pre_processing: Optional[TimestampPair] = None
    execution: Optional[TimestampPair] = None
    post_processing: Optional[TimestampPair] = None
    final: Optional[TimestampPair] = None

    @property
    def resource_usage(self) -> Optional[float]:
        """the resource usage obtained from this timestamp"""
        try:
            return (self.execution.finished - self.execution.started).total_seconds()
        except (TypeError, AttributeError):
            """
            TypeError: unsupported operand type(s) for -: 'datetime.datetime' and 'NoneType'
            TypeError: unsupported operand type(s) for -: 'NoneType' and 'datetime.datetime'
            TypeError: unsupported operand type(s) for -: 'NoneType' and 'NoneType'
            AttributeError: 'NoneType' object has no attribute 'started'
            AttributeError: 'NoneType' object has no attribute 'finished'
            """
            return None


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"


class JobExecutionStage(str, enum.Enum):
    REGISTERING = "REGISTERING"
    DONE = "DONE"


class JobV2(ZEncodedBaseModel):
    """Version 2 of the job schema"""

    id: str
    job_id: str
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    device: Optional[str] = None
    status: JobStatus
    failure_reason: Optional[str] = None
    duration_in_secs: Optional[float] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True
        fields = {"id": "_id"}


class JobCreate(ZEncodedBaseModel, extra=Extra.allow):
    """The schema used when creating a job"""

    backend: str
    job_id: str = Field(default_factory=get_uuid4_str)
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    status: JobExecutionStage = JobExecutionStage.REGISTERING
    created_at: Optional[str] = Field(default_factory=get_current_timestamp)
    updated_at: Optional[str] = Field(default_factory=get_current_timestamp)

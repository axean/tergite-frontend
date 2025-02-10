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
from typing import List, Optional, TypedDict

from beanie import PydanticObjectId
from bson import ObjectId
from pydantic import BaseModel, Extra, Field

from utils.date_time import datetime_to_zulu, get_current_timestamp
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
    ERROR = "ERROR"

    @classmethod
    def to_status(cls, value: "JobExecutionStage") -> JobStatus:
        """Converts execution stage to status"""
        if value == cls.REGISTERING:
            return JobStatus.PENDING
        if value == cls.DONE:
            return JobStatus.SUCCESSFUL
        if value == cls.ERROR:
            return JobStatus.FAILED
        return JobStatus.PENDING


class JobCreate(ZEncodedBaseModel):
    """The schema used when creating a job"""

    backend: str
    calibration_date: Optional[str] = None
    job_id: str = Field(default_factory=get_uuid4_str)
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    status: JobExecutionStage = JobExecutionStage.REGISTERING
    created_at: Optional[str] = Field(default_factory=get_current_timestamp)
    updated_at: Optional[str] = Field(default_factory=get_current_timestamp)

    class Config:
        json_encoders = {datetime: datetime_to_zulu}
        extra = Extra.allow


class TimeLog(BaseModel):
    """The timelog of the job"""

    registered: Optional[str] = Field(default=None, alias="REGISTERED")
    last_updated: Optional[str] = Field(default=None, alias="LAST_UPDATED")
    result: Optional[str] = Field(default=None, alias="RESULT")

    class Config:
        json_encoders = {datetime: datetime_to_zulu}
        extra = Extra.allow


class JobResult(BaseModel, extra=Extra.allow):
    """The results of the job"""

    memory: List[List[str]] = []


class JobV1(JobCreate):
    id: PydanticObjectId = Field(alias="_id")
    timelog: Optional[TimeLog] = None
    timestamps: Optional[JobTimestamps] = None
    download_url: Optional[str] = None
    result: Optional[JobResult] = None

    class Config(JobCreate.Config):
        json_encoders = {**JobCreate.Config.json_encoders, ObjectId: str}


class JobV2(BaseModel):
    """Version 2 of the job schema"""

    id: PydanticObjectId
    job_id: str
    device: str
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    status: JobStatus
    failure_reason: Optional[str] = None
    duration_in_secs: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str, datetime: datetime_to_zulu}

    @classmethod
    def from_v1(cls, value: JobV1) -> "JobV2":
        """Converts a job of version 1 to a job of version 2

        Args:
            value: the JobV1 job

        Returns:
            the JobV2 equivalent
        """
        duration_in_secs = (
            value.timestamps
            if value.timestamps is None
            else value.timestamps.resource_usage
        )
        return cls(
            id=value.id,
            job_id=value.job_id,
            project_id=value.project_id,
            user_id=value.user_id,
            device=value.backend,
            status=JobExecutionStage.to_status(value.status),
            failure_reason=None,
            duration_in_secs=duration_in_secs,
            created_at=value.created_at,
            updated_at=value.updated_at,
        )

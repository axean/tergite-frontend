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
"""Utilities for running background tasks"""
from typing import Optional

from apscheduler.jobstores.mongodb import MongoDBJobStore
from apscheduler.schedulers import SchedulerNotRunningError
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pytz import utc

import settings

_SCHEDULER_DB = "scheduler"
_SCHEDULER_COLLECTION = "jobs"
_SCHEDULER: Optional[AsyncIOScheduler] = None


def get_scheduler() -> AsyncIOScheduler:
    """Get the background jobs' scheduler."""
    global _SCHEDULER

    if _SCHEDULER is None:
        _SCHEDULER = AsyncIOScheduler(
            jobstores={
                "default": MongoDBJobStore(
                    database=_SCHEDULER_DB,
                    collection=_SCHEDULER_COLLECTION,
                    host=f"{settings.DB_MACHINE_ROOT_URL}",
                )
            },
            timezone=utc,
        )

    return _SCHEDULER


def stop_scheduler():
    """Shutdown the scheduler that is running"""
    global _SCHEDULER

    if _SCHEDULER is not None:
        try:
            _SCHEDULER.shutdown()
        except SchedulerNotRunningError:
            pass

        _SCHEDULER = None

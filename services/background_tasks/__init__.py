"""Service for running background tasks"""
from typing import Optional

from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.mongodb import MongoDBJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import utc

import settings

_SCHEDULER: Optional[BackgroundScheduler] = None


def start_scheduler():
    """Starts the background jobs' scheduler."""
    global _SCHEDULER
    close_scheduler()
    _SCHEDULER = BackgroundScheduler(
        jobstores={
            "default": MongoDBJobStore(
                database="scheduler", host=f"{settings.DB_MACHINE_ROOT_URL}"
            )
        },
        executors={"default": ThreadPoolExecutor(settings.MAX_BACKGROUND_WORKERS)},
        timezone=utc,
    )
    _SCHEDULER.start()


def close_scheduler():
    """Closes the background jobs' scheduler"""
    global _SCHEDULER
    if _SCHEDULER:
        _SCHEDULER.shutdown()
        _SCHEDULER = None


def get_scheduler() -> "BackgroundScheduler":
    """Get the background jobs' scheduler.

    This is quite useful as a dependency injector
    """
    return _SCHEDULER

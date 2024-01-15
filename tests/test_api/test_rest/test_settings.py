"""Test for the set up of the application"""
import importlib
from os import environ

import pytest
from apscheduler.schedulers import SchedulerAlreadyRunningError

import settings
from tests._utils.env import TEST_NO_AUTH_CONFIG_FILE
from utils.background_tasks import get_scheduler


def test_no_auth_prod():
    """ValueError raised if auth is disabled in production"""
    original_env = {
        "APP_SETTINGS": environ.get("APP_SETTINGS", "production"),
        "AUTH_CONFIG_FILE": environ.get("AUTH_CONFIG_FILE", "auth_config.toml"),
    }

    try:
        with pytest.raises(
            ValueError,
            match="'IS_AUTH_ENABLED' environment variable has been set to false in production",
        ):
            environ["APP_SETTINGS"] = "production"
            environ["AUTH_CONFIG_FILE"] = TEST_NO_AUTH_CONFIG_FILE
            importlib.reload(settings)
    finally:
        # reset
        environ["APP_SETTINGS"] = original_env["APP_SETTINGS"]
        environ["AUTH_CONFIG_FILE"] = original_env["AUTH_CONFIG_FILE"]
        importlib.reload(settings)


def test_puhuri_sync_enabled(client):
    """Should start puhuri scheduler if 'IS_PUHURI_SYNC_ENABLED' environment variable is True"""
    # using context manager to ensure on_startup runs
    with client as client:
        puhuri_scheduler = get_scheduler()
        with pytest.raises(SchedulerAlreadyRunningError):
            puhuri_scheduler.start()


def test_puhuri_sync_disabled(no_puhuri_client):
    """Should not start puhuri scheduler if 'IS_PUHURI_SYNC_ENABLED' environment variable is False"""
    # using context manager to ensure on_startup runs
    with no_puhuri_client as client:
        puhuri_scheduler = get_scheduler()
        puhuri_scheduler.start()
        puhuri_scheduler.shutdown()

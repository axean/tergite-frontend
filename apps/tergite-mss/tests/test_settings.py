"""Test for the set up of the application"""
import importlib
from os import environ

import pytest

import settings
from tests._utils.env import TEST_NO_AUTH_CONFIG_FILE


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

"""Test for the set up of the application"""
import importlib
from os import environ

import pytest

import settings


def test_no_auth_prod():
    """ValueError raised if auth is disabled in production"""
    original_env = {
        "IS_AUTH_ENABLED": environ.get("IS_AUTH_ENABLED", "True"),
        "APP_SETTINGS": environ.get("APP_SETTINGS", "production"),
    }

    try:
        with pytest.raises(
            ValueError,
            match="'IS_AUTH_ENABLED' environment variable has been set to false in production",
        ):
            environ["IS_AUTH_ENABLED"] = "False"
            environ["APP_SETTINGS"] = "production"
            importlib.reload(settings)
    finally:
        # reset
        environ["IS_AUTH_ENABLED"] = original_env["IS_AUTH_ENABLED"]
        environ["APP_SETTINGS"] = original_env["APP_SETTINGS"]
        importlib.reload(settings)

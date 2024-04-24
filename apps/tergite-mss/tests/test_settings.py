"""Test for the set up of the application"""
import importlib
from os import environ

import pytest

import settings
from tests._utils.env import TEST_PROD_NO_AUTH_CONFIG_FILE


def test_no_auth_prod():
    """ValueError raised if auth is disabled in production"""
    original_env = {
        "CONFIG_FILE": environ.get("CONFIG_FILE", "config.toml"),
    }

    try:
        with pytest.raises(
            ValueError,
            match="'auth.is_enabled' config variable has been set to false in production",
        ):
            environ["CONFIG_FILE"] = TEST_PROD_NO_AUTH_CONFIG_FILE
            importlib.reload(settings)
    finally:
        # reset
        environ["CONFIG_FILE"] = original_env["CONFIG_FILE"]
        importlib.reload(settings)

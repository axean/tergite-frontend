"""Test for the set up of the application"""

import importlib
from os import environ

import pytest

import settings
from tests._utils.env import TEST_PROD_NO_AUTH_MSS_CONFIG_FILE


def test_no_auth_prod():
    """ValueError raised if auth is disabled in production"""
    original_env = {
        "MSS_CONFIG_FILE": environ.get("MSS_CONFIG_FILE", "mss-config.toml"),
    }

    try:
        with pytest.raises(
            ValueError,
            match="'auth.is_enabled' has been set to false in production",
        ):
            environ["MSS_CONFIG_FILE"] = TEST_PROD_NO_AUTH_MSS_CONFIG_FILE
            importlib.reload(settings)
    finally:
        # reset
        environ["MSS_CONFIG_FILE"] = original_env["MSS_CONFIG_FILE"]
        importlib.reload(settings)

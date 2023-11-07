from os import environ

TEST_MONGODB_URL = "mongodb://localhost:27017"
TEST_BCC_URL = "http://localhost:8000"
TEST_DB_NAME = "testdb"
TEST_WS_PORT = 6534
TEST_MSS_PORT = 8002
# mongodb saves datetimes to only the millisecond precision
TEST_DATETIME_PRECISION = "milliseconds"


def setup_test_env():
    """Sets up the test environment.

    It should be run before any imports
    """
    environ["APP_SETTINGS"] = "test"
    environ["DB_NAME"] = TEST_DB_NAME
    environ["TEST_DB_MACHINE_ROOT_URL"] = TEST_MONGODB_URL
    environ["TEST_BCC_MACHINE_ROOT_URL"] = TEST_BCC_URL
    environ["WS_PORT"] = f"{TEST_WS_PORT}"
    environ["MSS_PORT"] = f"{TEST_MSS_PORT}"
    environ["DATETIME_PRECISION"] = f"{TEST_DATETIME_PRECISION}"

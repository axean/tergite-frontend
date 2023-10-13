from os import environ

TEST_MONGODB_URL = "mongodb://localhost:27017"
TEST_BCC_URL = "http://localhost:8000"
TEST_DB_NAME = "testdb"
TEST_WS_PORT = 6534
TEST_MSS_PORT = 8002
# mongodb saves datetimes to only the millisecond precision
TEST_DATETIME_PRECISION = "milliseconds"
# auth
TEST_JWT_SECRET = "e8141bffc71337276986a6f93e33df3d214632f71f700f35d38311ce99ce"
TEST_TERGITE_CLIENT_ID = "test-tergite-client-id"
TEST_TERGITE_CLIENT_SECRET = "test-client-secret"
TEST_TERGITE_EMAIL_REGEX = "^(john\.doe|paul\.doe)@example\.com$"
TEST_TERGITE_ROLES = "admin,user"

TEST_CHALMERS_CLIENT_ID = "test-chalmers-client-id"
TEST_CHALMERS_CLIENT_SECRET = "test-chalmers-client-secret"
TEST_CHALMERS_EMAIL_REGEX = ".*"
TEST_CHALMERS_ROLES = "user"

TEST_PUHURI_CLIENT_ID = "test-puhuri-client-id"
TEST_PUHURI_CLIENT_SECRET = "test-puhuri-client-secret"
TEST_PUHURI_CONFIG_ENDPOINT = (
    "http://puhuri.example.org/.well-known/openid-configuration"
)
TEST_PUHURI_EMAIL_REGEX = ".*"
TEST_PUHURI_ROLES = "user"


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
    environ["DATETIME_PRECISION"] = TEST_DATETIME_PRECISION

    environ["JWT_SECRET"] = TEST_JWT_SECRET

    environ["TERGITE_CLIENT_ID"] = TEST_TERGITE_CLIENT_ID
    environ["TERGITE_CLIENT_SECRET"] = TEST_TERGITE_CLIENT_SECRET
    environ["TERGITE_EMAIL_REGEX"] = TEST_TERGITE_EMAIL_REGEX
    environ["TERGITE_ROLES"] = TEST_TERGITE_ROLES

    environ["CHALMERS_CLIENT_ID"] = TEST_CHALMERS_CLIENT_ID
    environ["CHALMERS_CLIENT_SECRET"] = TEST_CHALMERS_CLIENT_SECRET
    environ["CHALMERS_EMAIL_REGEX"] = TEST_CHALMERS_EMAIL_REGEX
    environ["CHALMERS_ROLES"] = TEST_CHALMERS_ROLES

    environ["PUHURI_CLIENT_ID"] = TEST_PUHURI_CLIENT_ID
    environ["PUHURI_CLIENT_SECRET"] = TEST_PUHURI_CLIENT_SECRET
    environ["PUHURI_CONFIG_ENDPOINT"] = TEST_PUHURI_CONFIG_ENDPOINT
    environ["PUHURI_EMAIL_REGEX"] = TEST_PUHURI_EMAIL_REGEX
    environ["PUHURI_ROLES"] = TEST_PUHURI_ROLES

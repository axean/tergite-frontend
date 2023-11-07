from tests._utils.env import TEST_DB_NAME, TEST_MONGODB_URL, setup_test_env

# Set up the test environment before any other imports are made
setup_test_env()


import pymongo.database
import pytest
from fastapi.testclient import TestClient

from rest_api import app


@pytest.fixture
def db() -> pymongo.database.Database:
    """The mongo db instance for testing"""
    mongo_client = pymongo.MongoClient(TEST_MONGODB_URL)
    database = mongo_client[TEST_DB_NAME]

    yield database
    # clean up
    mongo_client.drop_database(TEST_DB_NAME)


@pytest.fixture
def client(db) -> TestClient:
    """A test client for fast api"""
    yield TestClient(app)

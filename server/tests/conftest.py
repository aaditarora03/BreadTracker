import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SUPABASE_PROJECT_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_API_KEY"] = "fake-test-key"

import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)
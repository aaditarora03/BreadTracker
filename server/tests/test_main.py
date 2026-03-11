"""
Simple API tests for BreadTracker - easy to run and log.
Run: pytest server/tests -v
"""
import pytest


# ----- Root -----
def test_root_returns_success(client):
    """Root endpoint returns 200 OK."""
    response = client.get("/")
    assert response.status_code == 200


def test_root_returns_message(client):
    """Root endpoint returns expected message."""
    response = client.get("/")
    data = response.json()
    assert "message" in data
    assert "BreadTracker" in data["message"]


# ----- Auth (no Supabase needed for these) -----
def test_signup_requires_valid_body(client):
    """Signup returns 422 when body is missing/invalid."""
    response = client.post("/api/auth/signup")
    assert response.status_code == 422


def test_login_requires_valid_body(client):
    """Login returns 422 when body is missing/invalid."""
    response = client.post("/api/auth/login")
    assert response.status_code == 422


def test_logout_returns_success(client):
    """Logout endpoint responds (may fail without real session, but route exists)."""
    response = client.post("/api/auth/logout")
    # 200 = success, 400 = no session - either means route works
    assert response.status_code in (200, 400)


# ----- Protected routes (require auth token) -----
def test_subscriptions_require_auth(client):
    """Subscriptions list returns 401 when no token provided."""
    response = client.get("/api/subscription/")
    assert response.status_code == 401


def test_create_subscription_requires_auth(client):
    """Create subscription returns 401 when no token provided."""
    response = client.post(
        "/api/subscription/create",
        json={"name": "Test", "amount": 10, "billing_cycle": "monthly"},
    )
    assert response.status_code == 401


# ----- Invalid route -----
def test_invalid_route_returns_404(client):
    """Unknown route returns 404."""
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404

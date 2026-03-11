import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, AuthApiError

# Always load server/.env no matter where the process is started from.
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

_supabase_url = os.getenv("SUPABASE_PROJECT_URL")
_supabase_key = os.getenv("SUPABASE_API_KEY")
supabase = create_client(_supabase_url, _supabase_key) if _supabase_url and _supabase_key else None


def _require_supabase_client():
    if supabase is None:
        return "Supabase is not configured. Set SUPABASE_PROJECT_URL and SUPABASE_API_KEY."
    return None

def signup(email, password, first_name, last_name):
    config_error = _require_supabase_client()
    if config_error:
        return config_error

    try:
        # sign_up usually returns an AuthResponse object
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": {"first_name": first_name, "last_name": last_name}}
        })

        # Check if the user was actually created
        if res.user is None:
            # If there's an error, it's usually in a specific field depending on the version
            return "Signup failed: Check if user already exists or password is too short"

        return res
    except AuthApiError as e:
        return f"Signup failed: {e.message}"
    except Exception as e:
        return f"Signup failed: {str(e)}"

def login(email, password):
    config_error = _require_supabase_client()
    if config_error:
        return config_error

    try:
        return supabase.auth.sign_in_with_password({"email": email, "password": password})
    except AuthApiError as e:
        return f"Login failed: {e.message}"
    except Exception as e:
        return f"Login failed: {str(e)}"

def reset_password(new_password):
    config_error = _require_supabase_client()
    if config_error:
        return config_error

    try:
        return supabase.auth.update_user({"password": new_password})
    except AuthApiError as e:
        return f"Update failed: {e.message}"
    except Exception as e:
        return f"Update failed: {str(e)}"

def logout():
    config_error = _require_supabase_client()
    if config_error:
        return config_error

    try:
        return supabase.auth.sign_out()
    except AuthApiError as e:
        return f"Logout failed: {e.message}"
    except Exception as e:
        return f"Logout failed: {str(e)}"
# BreadTracker QA Test Log

Copy this table for each run. Use ✅ Pass, ❌ Fail, ⏭️ Skip.

---

## Automated Tests (pytest)

Run: `cd server` then `python -m pytest tests -v`

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Root returns 200 | | |
| Root returns correct message | | |
| Signup validates body | | |
| Login validates body | | |
| Logout responds | | |
| Subscriptions require auth (401) | | |
| Create subscription requires auth (401) | | |
| Invalid route returns 404 | | |
| **Overall** | | |

---

## Manual Tests (when app is running)

| Area | Test | Pass/Fail | Notes |
|------|------|-----------|-------|
| Auth | Signup with valid email | | |
| Auth | Signup with invalid email → error | | |
| Auth | Login with correct credentials | | |
| Auth | Login with wrong password → error | | |
| Auth | Logout clears session | | |
| Subscriptions | Create subscription | | |
| Subscriptions | View list | | |
| Subscriptions | Edit subscription | | |
| Subscriptions | Delete subscription | | |
| Dashboard | Charts load | | |
| Dashboard | Data matches subscriptions | | |

---

## Test Run Log

| Date | Tester | Branch | Automated | Manual | Issues |
|------|--------|--------|-----------|--------|--------|
| | | | | | |

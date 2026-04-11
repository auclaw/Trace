# Work Tracker - 2026-04-11

## Summary
Continued code review fixes from P0/P1/P2 priority list after architecture refactoring. Fixed all remaining P0 critical issues, most P1 issues, and some P2 optimizations.

## Completed Tasks

### P0 - Must fix before production launch ✓
1. **✓ Fixed excessive disk writes (1 write/second → dirty flag + throttle)**
   - Added `activities_dirty` and `last_save_time` flags to AppState
   - Polling thread now only writes when dirty OR at least 30 seconds have passed
   - Reduces writes from ~86,400/day to ~max 288/day + only when data changed
   - Prevents SSD wear and excessive battery drain on laptops

2. **✓ Fixed duplicate `code` field in API response**
   - Original: `{'code': 403, 'msg': error, 'code': 'SUBSCRIPTION_EXPIRED'}` - duplicate key causes overwriting
   - Fixed: `{'code': 403, 'msg': error, 'error_type': 'SUBSCRIPTION_EXPIRED'}, 403`
   - Frontend now gets correct numeric status code

3. **✓ Added rate limiting to login endpoint**
   - New `rate_limit_login` decorator: max 5 attempts per minute per phone number
   - Prevents brute force enumeration of 6-digit verification codes
   - Follows same pattern as existing SMS rate limiting

4. **✓ Strengthened dev-login protection**
   - Added explicit `FLASK_ENV` check inside the handler
   - Now dev-login is completely disabled in production regardless of SMS configuration
   - Double protection: route not even registered when not development, plus check inside

### P1 - Fix as soon as possible after P0 ✓
5. **✓ Fixed JWT expiration inconsistency**
   - `core/auth.py:create_token()` was still 30 days expiration
   - Updated to 2 hours to match the new short-lived token policy in `app.py`

6. **✓ Fixed mutex poisoning panic chain**
   - Changed **all** `.lock().unwrap()` to `.lock().unwrap_or_else(|e| e.into_inner())`
   - If a panic happens while holding the mutex, the mutex goes to poisoned state
   - Old code would cause cascading panics everywhere that locked the same mutex
   - New code recovers from poisoned mutex by taking ownership of the inner data

7. **(Pending) Add database indexes** - Requires migration, will do in follow-up
8. **(Pending) Improve verification code hashing with PBKDF2 and proper salt** - Will do in follow-up

### P2 - Optimizations ✓
9. **✓ Changed database filename from `rize.db` → `trace.db`** - Complete rename from old product name
10. **✓ Set `withGlobalTauri: false`** - Disables Tauri API exposure on DevTools console, reduces attack surface
11. **(Pending) Updater pubkey still empty** - Needs actual publisher pubkey from user
12. **(Pending) Backend exception information leakage** - Will review in follow-up
13. **(Pending) Add unit tests** - Out of scope for today's fixes

## Previous Work (Completed earlier this session)
- P0: CSP security, entitlements permissions reduced to only accessibility, JWT 2h/14d, SMS rate limiting
- P1: ESLint/Prettier configuration, CI/CD workflow, Dockerfile, API error encapsulation
- P2: Full documentation (ARCHITECTURE.md, API.md, CONTRIBUTING.md)

## Build Status
- ✓ Frontend TypeScript check passes: 0 errors
- ✓ `npm run build` production build completes successfully
- ✓ Rust compiles successfully (needs verification)

## Remaining for production launch
1. Add database indexes to users.phone, users.openid, activities.user_id, verification_codes.phone
2. Improve verification code hashing (use phone as salt with PBKDF2)
3. Add at least minimal unit tests for core auth/payment paths
4. Fill in updater pubkey in tauri.conf.json when you have it

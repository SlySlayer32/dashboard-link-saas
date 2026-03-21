# Quick Start Guide: API Route Cleanup

**Feature**: 002-api-route-cleanup  
**Date**: 2026-03-20  
**Purpose**: Verify API route cleanup and stub service functionality

---

## Overview

This quick start guide helps you verify that the API route cleanup has been completed successfully and that stub services are working as expected.

---

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Supabase development environment running
- Environment variables configured in `.env`

---

## Quick Verification Steps

### 1. Start the API Server

```bash
# From repository root
pnpm dev

# Or start API only
cd apps/api
pnpm dev
```

**Expected**: Server starts without "module not found" errors

### 2. Test Worker Endpoints (Should Work)

```bash
# List workers
curl http://localhost:3001/api/v1/workers

# Create a worker (requires auth)
curl -X POST http://localhost:3001/api/v1/workers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-token>" \
  -d '{
    "name": "Test Worker",
    "phone": "+61412345678",
    "email": "test@example.com"
  }'
```

**Expected**: 
- List returns `[]` or worker data
- Create returns `201` with worker object or `401` if not authenticated

### 3. Test Stub Services (Should Return 501)

```bash
# Test token redemption (stub service)
curl -X POST http://localhost:3001/api/v1/dashboard/redeem \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token-123"}'

# Test SMS sending (stub service)
curl -X POST http://localhost:3001/api/v1/dashboards/123/send-link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-token>" \
  -d '{}'
```

**Expected**: Both return `501 Not Implemented` with clear error message

```json
{
  "success": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Service not yet available"
  }
}
```

---

## Detailed Verification

### Check Route Structure

```bash
# Verify only mounted worker route exists
grep -n "workers" apps/api/src/v1.ts
```

**Expected**: Only line with `v1.route('/workers', workers)` should appear

### Check Service Imports

```bash
# Verify services are imported
grep -n "TokenService\|SMSService" apps/api/src/v1.ts
```

**Expected**: Lines 14-15 show imports from `./services/`

### Check Stub Service Implementation

```bash
# Verify stub services throw appropriate errors
cat apps/api/src/services/TokenService.ts
cat apps/api/src/services/SMSService.ts
```

**Expected**: Both files contain "not implemented" error messages

---

## Running Tests

### Unit Tests for Stub Services

```bash
# Run all tests
pnpm test

# Run specific test files
pnpm test TokenService.test.ts
pnpm test SMSService.test.ts
```

### Integration Tests

```bash
# Run integration tests
pnpm test: integration

# Test worker routes specifically
pnpm test workers.test.ts
```

---

## Troubleshooting

### Common Issues

**Issue**: "Module not found: TokenService"  
**Solution**: Ensure services are imported in v1.ts

**Issue**: "Cannot find module" errors  
**Solution**: Run `pnpm install` to ensure dependencies are installed

**Issue**: Route conflicts  
**Solution**: Verify no duplicate route definitions exist

**Issue**: 404 errors on worker endpoints  
**Solution**: Check if workers.ts exports properly and middleware is configured

### Debug Mode

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Check route registration
curl http://localhost:3001/api/v1/workers -v
```

---

## Success Indicators

You'll know the cleanup is successful when:

✅ **API starts without errors** - No "module not found" messages in console  
✅ **Worker endpoints work** - GET /workers responds correctly  
✅ **Stub services return 501** - Token and SMS endpoints return proper error codes  
✅ **No route conflicts** - Hono router loads without warnings  
✅ **Tests pass** - Unit and integration tests validate behavior  

---

## Next Steps

After successful verification:

1. **Run full test suite**: `pnpm test:coverage`
2. **Check code quality**: `pnpm lint` and `pnpm typecheck`
3. **Commit changes**: `git add . && git commit -m "feat: cleanup API routes and add stub services"`
4. **Monitor in production**: Watch for any runtime errors

---

## Rollback Plan

If issues arise:

```bash
# Revert to previous state
git checkout HEAD~1 -- apps/api/src/v1.ts

# Remove stub services if needed
rm apps/api/src/services/TokenService.ts
rm apps/api/src/services/SMSService.ts

# Restart API
pnpm dev
```

---

## Support

If you encounter issues:

1. Check the console logs for specific error messages
2. Verify environment variables are set correctly
3. Ensure Supabase is running and accessible
4. Review the implementation plan in `plan.md` for detailed requirements

---

**Estimated Verification Time**: 15-30 minutes  
**Difficulty**: Beginner - Basic curl commands and API testing

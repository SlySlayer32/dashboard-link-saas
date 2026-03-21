# Pre-Launch Assessment Report
**Generated**: 2026-03-19  
**Status**: ⚠️ **NOT READY FOR LAUNCH** - Critical issues identified

---

## Executive Summary

The project has **significant inconsistencies** between the well-architected Feature 001 (worker management) and vibe-coded features. Multiple **blocking issues** prevent safe launch:

1. **Database schema mismatch** - Code expects different column names than schema defines
2. **Duplicate route definitions** - Workers routes defined twice causing conflicts
3. **Missing service imports** - `TokenService` and `SMSService` not imported in v1.ts
4. **Inconsistent patterns** - Mix of repository pattern (Feature 001) and direct Supabase queries (vibe code)

---

## 🚨 BLOCKING ISSUES (Must Fix Before Launch)

### 1. Database Schema Mismatch - CRITICAL
**Location**: `@e:/CleanConnect/supabase/migrations/20260124231200_mvp_schema.sql` vs code expectations

**Problem**: Database uses `full_name` and `phone_number`, but code expects `name` and `phone`.

**Schema defines**:
```sql
CREATE TABLE workers (
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  ...
)
```

**Code expects** (`@e:/CleanConnect/packages/database/src/repositories/WorkerRepository.ts:188-198`):
```typescript
return {
  name: data.name as string,  // ❌ Should be full_name
  phone: data.phone as string, // ❌ Should be phone_number
  ...
}
```

**Impact**: All worker CRUD operations will fail with "column does not exist" errors.

**Fix Required**: Either:
- Option A: Update migration to use `name` and `phone` (recommended - matches Feature 001 spec)
- Option B: Update all code to use `full_name` and `phone_number`

---

### 2. Duplicate Worker Routes - CRITICAL
**Location**: `@e:/CleanConnect/apps/api/src/v1.ts:213-266` AND `@e:/CleanConnect/apps/api/src/v1.ts:588-589`

**Problem**: Workers routes defined twice:
1. Inline in v1.ts (lines 213-266) - uses different validation schema
2. Mounted from `./routes/workers` (line 589) - uses Feature 001 implementation

**Impact**: Route conflicts, unpredictable behavior, last-mounted route wins.

**Fix Required**: Remove inline worker routes from v1.ts, keep only the mounted route.

---

### 3. Missing Service Imports - CRITICAL
**Location**: `@e:/CleanConnect/apps/api/src/v1.ts:61,469`

**Problem**: `TokenService` and `SMSService` used but never imported.

```typescript
// Line 61 - TokenService not imported
const tokenService = new TokenService()

// Line 469 - SMSService not imported  
const smsService = new SMSService()
```

**Impact**: Runtime errors when these endpoints are called.

**Fix Required**: Add imports or remove unused code.

---

### 4. Workers Table Missing Required Columns
**Location**: Database schema vs Feature 001 spec

**Schema has**: `full_name`, `phone_number`, `calendar_email`  
**Spec requires**: `name`, `phone`, `email`, `active`, `deleted_at`, `metadata`

**Missing columns**:
- `active` (boolean) - Required for FR-011
- `deleted_at` (timestamp) - Required for soft delete (FR-009)
- `metadata` (jsonb) - Used in code
- `email` (text) - Code expects this instead of `calendar_email`

**Impact**: Soft delete won't work, active/inactive filtering fails, metadata storage fails.

**Fix Required**: Create migration to add missing columns.

---

## ⚠️ HIGH PRIORITY ISSUES (Should Fix Before Launch)

### 5. Inconsistent Architecture Patterns
**Problem**: Mix of two different approaches:

**Feature 001 (proper)**:
- Repository pattern (`WorkerRepository`)
- Service layer (`WorkerService`)
- Structured logging
- Proper error handling

**Vibe-coded features**:
- Direct Supabase queries in routes
- No service layer
- Minimal error handling
- No logging

**Impact**: Code quality inconsistency, harder to maintain, bugs in vibe-coded sections.

**Recommendation**: Refactor vibe-coded features to follow Feature 001 patterns.

---

### 6. Missing Environment Variables
**Location**: `@e:/CleanConnect/apps/api/.env`

**Missing from .env but used in code**:
- `MOBILEMESSAGE_USERNAME` (used as `MOBILE_MESSAGE_USERNAME`)
- `MOBILEMESSAGE_PASSWORD` (used as `MOBILE_MESSAGE_PASSWORD`)
- `MOBILEMESSAGE_SENDER_ID` (used as `MOBILE_MESSAGE_SENDER_ID`)

**Impact**: SMS sending will fail silently or throw errors.

**Fix Required**: Standardize environment variable names.

---

### 7. No Root .env File
**Problem**: ENV.example exists but no `.env` at project root.

**Impact**: API might use wrong environment variables, unclear which .env is authoritative.

**Fix Required**: Create root `.env` or document that apps/api/.env is the source of truth.

---

## 📋 NON-BLOCKING ISSUES (Technical Debt)

### 8. Unused/Commented Code
- `@e:/CleanConnect/apps/api/src/index.ts:19-21` - Commented imports
- Multiple placeholder endpoints in v1.ts

### 9. Inconsistent Validation
- Feature 001 uses Zod schemas from `@dashboard-link/shared`
- Vibe code defines inline Zod schemas
- No shared validation library

### 10. Missing Tests
- Feature 001 has test structure defined but no actual tests
- Vibe-coded features have zero tests
- No integration tests for critical flows

### 11. Port Mismatch
- `@e:/CleanConnect/apps/api/.env` sets `PORT=3001`
- `@e:/CleanConnect/ENV.example` shows `PORT=3000`
- Admin .env expects API on 3001

**Current state**: Works but inconsistent with documentation.

---

## 🔍 VERIFICATION CHECKLIST

Before launch, verify:

- [ ] Database migration creates correct column names (`name` vs `full_name`)
- [ ] Only ONE worker route definition exists
- [ ] All service imports are present
- [ ] Workers table has all required columns
- [ ] Environment variables match between .env files
- [ ] Can create a worker via API
- [ ] Can list workers via API
- [ ] Can update worker via API
- [ ] Can soft delete worker via API
- [ ] Soft deleted workers don't appear in active lists
- [ ] Phone validation works for AU numbers
- [ ] Duplicate phone detection works
- [ ] SMS sending works (or gracefully fails with clear error)
- [ ] Token generation works
- [ ] Dashboard redemption works

---

## 📊 CODE QUALITY COMPARISON

| Aspect | Feature 001 | Vibe-Coded Features |
|--------|-------------|---------------------|
| Architecture | ✅ Repository + Service | ❌ Direct DB queries |
| Error Handling | ✅ Comprehensive | ⚠️ Basic |
| Logging | ✅ Structured JSON | ❌ None |
| Validation | ✅ Zod schemas | ⚠️ Inline |
| Testing | ⚠️ Structure only | ❌ None |
| Documentation | ✅ Spec + Plan | ❌ None |
| Type Safety | ✅ Full | ⚠️ Partial |

---

## 🎯 RECOMMENDED FIX PRIORITY

### Phase 1: Blocking Fixes (Do First)
1. Fix database schema column names
2. Remove duplicate worker routes
3. Add missing imports or remove dead code
4. Add missing database columns

### Phase 2: High Priority (Do Before Launch)
5. Standardize environment variable names
6. Add basic error handling to vibe-coded routes
7. Test critical user flows manually

### Phase 3: Post-Launch (Technical Debt)
8. Refactor vibe-coded features to repository pattern
9. Add comprehensive test coverage
10. Remove unused/commented code
11. Standardize validation approach

---

## 💡 NEXT STEPS

1. **Run `/review` workflow** to get detailed code review with specific fixes
2. **Create migration** to fix database schema
3. **Clean up v1.ts** to remove duplicates and add imports
4. **Manual testing** of worker CRUD flow
5. **Document** which features are production-ready vs experimental

---

## 📝 NOTES

- Feature 001 implementation is **excellent** - use it as the template
- Vibe-coded features work but need refactoring for production
- No critical security issues found (RLS policies exist)
- SMS system initialized but credentials are placeholders
- Supabase local setup appears correct

# Conflicts & Resolutions

When two implementations exist, this file decides which one wins.

---

## Active Resolutions

### 1. Webhook Service — use `webhookService.ts`

| File | Decision | Reason |
|------|----------|--------|
| `apps/api/src/services/webhookService.ts` | ✅ CANONICAL | More complete: queue processing, proper logging, error handling |
| `apps/api/src/services/webhook-service.ts` | ❌ DELETE | Class-based stub, incomplete |

**Action:** Delete `webhook-service.ts` after confirming zero imports remain.

---

### 2. Webhook Route — use `routes/webhooks.ts`

| File | Decision | Reason |
|------|----------|--------|
| `apps/api/src/routes/webhooks.ts` | ✅ CANONICAL | Dedicated routes file, uses correct service |
| Inline webhook block in `routes/v1.ts` | ❌ REMOVE the block | Duplicate; `v1.ts` should register `routes/webhooks.ts` |

**Action:** In `v1.ts`, replace inline webhook handler with:
```typescript
import webhookRoutes from './webhooks'
app.route('/webhooks', webhookRoutes)
```

---

### 3. UI Components — use `packages/ui`

| File | Decision | Reason |
|------|----------|--------|
| `packages/ui/src/components/Button.tsx` | ✅ CANONICAL | Most complete: dark mode, accessibility, more variants |
| `packages/ui/src/components/Card.tsx` | ✅ CANONICAL | Variants, dark mode, better API |
| `packages/ui/src/components/Alert.tsx` | ✅ CANONICAL | Shared component for both apps |
| `packages/ui/src/components/LoadingSpinner.tsx` | ✅ CANONICAL | Better accessibility (ARIA), more size options |

**Action:** Import from `@dashboard-link/ui` in both apps. App-specific versions deleted.

---

### 4. Worker Mutations — use `useWorkers.ts`

| File | Decision | Reason |
|------|----------|--------|
| `apps/admin/src/hooks/useWorkers.ts` | ✅ CANONICAL | Uses shared API client, handles concurrent edits |
| `apps/admin/src/hooks/useWorkerMutation.ts` | ✅ DELETED | Duplicates fetch logic, hardcodes API base |

**Action:** Use `useWorkerMutations()` from useWorkers.ts

---

### 5. Worker Validators — use `worker.ts`

| File | Decision | Reason |
|------|----------|--------|
| `packages/shared/src/validators/worker.ts` | ✅ CANONICAL | Complete schemas, correct naming convention (camelCase) |
| `packages/shared/src/validators/worker.validator.ts` | ✅ DELETED | Incomplete, wrong naming (PascalCase) |

**Action:** Use camelCase exports from worker.ts

---

### 6. HTML Form Tags — removed across all components

| Pattern | Decision | Reason |
|---------|----------|--------|
| `<form>` tags with `onSubmit` | ❌ REMOVED | Frontend rule: no HTML form elements |
| `<button type="button" onClick={handleSubmit(...)}>` | ✅ CORRECT | React Hook Form pattern without form wrapper |

**Action:** All form submissions use button onClick handlers with React Hook Form's handleSubmit

---

### 7. Future Architecture Types — marked as Phase 2/3

| File | Decision | Reason |
|------|----------|--------|
| `packages/shared/src/types/sms.ts` | ✅ CURRENT MVP | Simple types in use now |
| `packages/shared/src/types/sms.types.ts` | 📋 FUTURE | Phase 2/3 Zapier-style architecture (marked with comment) |
| `packages/shared/src/types/token.ts` | ✅ CURRENT MVP | Simple types in use now |
| `packages/shared/src/types/token.types.ts` | 📋 FUTURE | Phase 2/3 advanced architecture (marked with comment) |

**Action:** Keep both files. Future architecture files marked with `// Phase 2/3` comment.

---

## Deleted Files Log

| File | Deleted | Reason |
|------|---------|--------|
| `.windsurf/rules/specify-rules.md` | ✅ | Auto-generated noise: wrong Zod version, wrong paths |
| `apps/api/src/services/webhook-service.ts` | Pending | Superseded by `webhookService.ts` |
| `apps/admin/src/components/ui/Button.tsx` | ✅ 2026-03-16 | Duplicate of packages/ui version |
| `apps/worker/src/components/ui/Button.tsx` | ✅ 2026-03-16 | Duplicate of packages/ui version |
| `apps/admin/src/components/ui/Card.tsx` | ✅ 2026-03-16 | Duplicate of packages/ui version |
| `apps/admin/src/components/ui/Alert.tsx` | ✅ 2026-03-16 | Duplicate of packages/ui version |
| `apps/worker/src/components/ui/Alert.tsx` | ✅ 2026-03-16 | Duplicate of packages/ui version |
| `apps/admin/src/components/ui/LoadingSpinner.tsx` | ✅ 2026-03-16 | Duplicate of packages/ui version |
| `apps/admin/src/hooks/useWorkerMutation.ts` | ✅ 2026-03-16 | Duplicate of useWorkers.ts functionality |
| `packages/shared/src/validators/worker.validator.ts` | ✅ 2026-03-16 | Duplicate of worker.ts |
| `apps/admin/src/lib/api-client.ts` | ✅ 2026-03-16 | Unnecessary re-export wrapper |
| `apps/admin/src/lib/utils/phone.ts` | ✅ 2026-03-16 | Unnecessary re-export wrapper |

---

## How to Add a New Conflict

When you find a duplicate, add it here:

```markdown
### N. [Module name] — use [winning file]

| File | Decision | Reason |
|------|----------|--------|
| `path/to/winner` | ✅ CANONICAL | Why it wins |
| `path/to/loser`  | ❌ DELETE/REMOVE | Why it loses |

**Action:** What exactly needs to change.
```

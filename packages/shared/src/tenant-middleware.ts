/**
 * Tenant context type — shared across packages.
 *
 * The canonical auth + tenant middleware chain lives in
 * apps/api/src/middleware/auth.ts and apps/api/src/middleware/tenant.ts.
 * This file only exports the shared type.
 */

export interface TenantContext {
  userId: string
  orgId: string
  role: string
}

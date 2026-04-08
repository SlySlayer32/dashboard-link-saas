# Worker App Instructions

This file applies to `apps/worker`.

## Product Rules

- This app is worker-facing, mobile-first, and usually reached through a tokenized link.
- Do not assume an authenticated admin session exists.
- Preserve invalid-token and expired-token experiences when touching routing or data loading.

## Implementation Rules

- Keep payload handling lightweight and resilient to partial or delayed API responses.
- Keep API fallbacks env-driven; prefer `VITE_API_URL` or `/api` proxy fallback over hardcoded local hosts.
- Preserve loading, offline/network-error, and empty-state behavior.

## Verification

- Run `pnpm --filter @dashboard-link/worker build`.


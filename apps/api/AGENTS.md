# API App

## Purpose
Hono API service backing admin + worker apps.

## Zapier-style Guidance
- API services call contracts and registries (plugins/SMS/tokens).
- No vendor SDK calls inside route handlers; use services/adapters.

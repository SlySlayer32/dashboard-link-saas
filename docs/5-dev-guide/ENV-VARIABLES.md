# Environment Variables

Never commit real values.

## Frontend

Used by `apps/admin` and `apps/worker`:

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Public Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public Supabase anon key |
| `VITE_API_URL` | Yes | API base URL |

## API

Used by `apps/api`:

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Server-side anon key usage remains in the app |
| `SUPABASE_SERVICE_KEY` | Yes | Secret, server-only |
| `JWT_SECRET` | Yes | Token validation secret |
| `MOBILE_MESSAGE_USERNAME` | Yes | SMS provider username |
| `MOBILE_MESSAGE_PASSWORD` | Yes | SMS provider password |
| `MOBILE_MESSAGE_SENDER_ID` | No | Optional sender ID |
| `PORT` | No | Defaults to `3000` |
| `NODE_ENV` | Yes | `development` or `production` |
| `CORS_ORIGIN` | Yes | Allowed origins, comma-separated if needed |
| `APP_URL` | Yes | Admin/public application URL base |
| `WORKER_APP_URL` | Yes | Worker dashboard URL base |

## Local Development Notes

- Keep local secrets in your uncommitted `.env` files.
- Use the local Supabase URL and keys from `supabase status` for normal development.
- Use different Supabase and SMS credentials for development and production.
- Do not keep the repo persistently linked to a hosted Supabase project.
- If you intentionally run a hosted Supabase CLI task, provide credentials via environment variables and remove repo-local link artifacts afterward.
- Never expose `SUPABASE_SERVICE_KEY` to the frontend.

## Production Checklist

Before release, verify:

1. Vercel has the frontend variables for both frontends.
2. Railway has the full API variable set.
3. Supabase project keys match the intended environment.
4. `CORS_ORIGIN` includes the deployed frontend origins.

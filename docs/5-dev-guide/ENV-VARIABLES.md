# Environment Variables

> Never commit real values. This documents keys only.

**✅ VERIFIED:** Environment variable names verified against `ENV.example` file.

## Frontend (Admin + Worker)

| Variable | Required | Description | Example Format |
|----------|----------|-------------|----------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_API_URL` | Yes | Backend API base URL | `http://localhost:3000` (dev) or `https://api.dashboardlink.com` (prod) |

## Backend (API)

| Variable | Required | Description | Example Format |
|----------|----------|-------------|----------------|
| `SUPABASE_URL` | Yes | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (also used server-side) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (secret, bypasses RLS) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | Yes | JWT secret for token validation | `replace-with-32+char-secret` |
| `DATABASE_URL` | No | PostgreSQL connection string (optional direct connection) | `postgresql://user:password@localhost:5432/dbname` |
| `MOBILE_MESSAGE_USERNAME` | Yes | MobileMessage.com.au username | `your-username` |
| `MOBILE_MESSAGE_PASSWORD` | Yes | MobileMessage.com.au password | `your-password` |
| `MOBILE_MESSAGE_SENDER_ID` | No | Custom sender ID for SMS | `DashLink` |
| `PORT` | No | API server port (default 3000) | `3000` |
| `NODE_ENV` | Yes | Environment (development/production) | `development` |
| `CORS_ORIGIN` | Yes | Allowed CORS origins (comma-separated) | `http://localhost:5173,http://localhost:5174` |

## Configuration Notes

**MobileMessage Virtual Number:**
- Free virtual number for SMS replies is provided automatically by MobileMessage.com.au
- No separate environment variable needed
- Number is assigned when account is created
- Accessible via MobileMessage dashboard

**Supabase Project Ref:**
- Not in environment variables
- Used only for CLI commands: `npx supabase link --project-ref <ref>`
- Found in Supabase dashboard URL: `https://supabase.com/dashboard/project/<ref>`

## Optional (Future Features)

| Variable | Required | Description | Example Format |
|----------|----------|-------------|----------------|
| `REDIS_URL` | No | Redis connection string (for caching/queues) | `redis://localhost:6379` |
| `SENTRY_DSN` | No | Sentry error tracking DSN | `https://abc123@o123.ingest.sentry.io/456` |
| `STRIPE_SECRET_KEY` | No | Stripe API key (for billing) | `sk_test_abc123...` |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret | `whsec_abc123...` |

## Environment-Specific Files

### Development (`.env`)
Used for local development. Not committed to git.

### Production (`.env.production`)
Used for production deployment. Managed via hosting provider (Vercel, Railway, etc.).

### Test (`.env.test`)
Used for running tests. Committed to git (no secrets).

## Security Notes

- **Never commit `.env` files** — add to `.gitignore`
- **Service role key bypasses RLS** — only use server-side, never expose to client
- **Anon key is public** — safe to expose in frontend, RLS protects data
- **Rotate keys immediately** if accidentally committed or exposed
- **Use different keys** for development and production

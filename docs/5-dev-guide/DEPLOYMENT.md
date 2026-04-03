# Deployment

## Target Hosting

- Admin frontend: Vercel
- Worker frontend: Vercel
- API: Railway
- Database and Auth: Supabase

This is the intended MVP deployment path and the docs below assume that hosting split.

## Release Gate Before Deploying

Run these commands from the repo root:

```bash
pnpm lint
pnpm test
pnpm build
```

## Frontend Deployment

Deploy `apps/admin` and `apps/worker` through Vercel.

Required frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

Verification after deploy:

1. Open the admin app.
2. Confirm login works.
3. Open a worker dashboard link from a sent SMS.

## API Deployment

Deploy `apps/api` to Railway.

Required backend environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `MOBILE_MESSAGE_USERNAME`
- `MOBILE_MESSAGE_PASSWORD`
- `MOBILE_MESSAGE_SENDER_ID` if used
- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `APP_URL`
- `WORKER_APP_URL`

Verification after deploy:

1. Hit the health or root API route if available.
2. Log in from the admin app against the deployed API.
3. Create a worker and send a dashboard link.

## Database and Auth

Supabase owns:

- PostgreSQL
- Row-level security
- Auth
- Migrations

Apply migrations before or during release:

```bash
pnpm db:migrate
```

## Rollback

### Frontend

Use Vercel to promote the previous successful deployment.

### API

Redeploy the previous Railway build or roll the service back to the prior successful release.

### Database

Prefer forward fixes. If a migration must be reversed, use a deliberate reverse migration or Supabase backup restore.

## Operational Readiness Checklist

- Production environment variables are present in Vercel, Railway, and Supabase.
- `CORS_ORIGIN` matches the deployed admin and worker hosts.
- SMS provider credentials are verified with a real send.
- At least one worker dashboard link is opened successfully in production.
- Dashboard-open history appears in admin.

## CI

GitHub Actions now provides a basic workspace CI flow at `.github/workflows/ci.yml`.

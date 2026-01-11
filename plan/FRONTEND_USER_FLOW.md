# Frontend user flow plan

See [NEEDS_DECISIONS.md](NEEDS_DECISIONS.md) for open questions.

## End-user journey
1. Signup/login/auth
2. Org onboarding
3. Worker management
4. Plugin configuration
5. SMS send and logs
6. Worker dashboard
7. Error states

## Setup and access
- [ ] Create `apps/admin/.env` and `apps/worker/.env` with `VITE_API_URL` and Supabase Vite keys.
- [ ] Start admin and worker apps and confirm shells load at `http://localhost:5173` and `http://localhost:5174`.

## Org onboarding (admin)
- [ ] Implement admin onboarding: org settings and initial setup flows.
- [ ] Add form validation with React Hook Form + Zod and surface API errors clearly.

## Worker management
- [ ] Implement workers CRUD in the admin experience.

## Plugin configuration
- [ ] Implement Google Calendar configuration UI in admin onboarding.
- [ ] Add plugin health and delivery status views for operators.

## SMS send and logs
- [ ] Implement SMS send and SMS log visibility in the admin UI.

## Worker dashboard and error states
- [ ] Implement worker dashboard UI for schedule and tasks with friendly expired/invalid token states.

## Operational and compliance surfaces
- [ ] Add admin UI for webhook event listing, filtering, and replay actions.
- [ ] Add admin UI for audit log viewing and export.
- [ ] Add admin UI for quota usage and retention settings visibility.
- [ ] Add billing and plan management UI with usage visibility.

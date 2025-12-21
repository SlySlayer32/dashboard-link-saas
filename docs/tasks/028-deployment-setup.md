# Task 028: Deploy to Production

## Goal
Deploy all applications to production and set up monitoring

## Context
The application is ready for production deployment on Vercel with Supabase as the backend.

## Files to Create/Modify
- `.vercelignore` - Vercel ignore file
- `apps/admin/vercel.json` - Admin app configuration
- `apps/worker/vercel.json` - Worker app configuration
- `apps/api/vercel.json` - API configuration
- `scripts/deploy.sh` - Deployment script
- `README.md` - Update with deployment instructions

## Dependencies
- All previous tasks completed

## Acceptance Criteria
- [ ] Deploy admin app to Vercel
- [ ] Deploy worker app to Vercel
- [ ] Deploy API to Vercel Edge Functions
- [ ] Configure all environment variables
- [ ] Set up Supabase production project
- [ ] Run database migrations in production
- [ ] Configure custom domains
- [ ] Set up SSL certificates
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Configure cron job for token cleanup
- [ ] Test complete flow in production

## Implementation Details
- Use Vercel CLI for deployment
- Set up environment variable groups
- Configure Edge Functions for API
- Add health check endpoints
- Set up logging and monitoring
- Create deployment checklist
- Document rollback procedure

## Test Checklist
- [ ] All apps accessible via URLs
- [ ] Authentication works in production
- [ ] SMS sending functional
- [ ] Worker dashboards load
- [ ] Database queries working
- [ ] No console errors
- [ ] Mobile responsive on production
- [ ] Performance metrics acceptable

---

## Completion Log
- **Started**: 
- **Completed**: 
- **AI Assistant**: 
- **Review Status**: pending

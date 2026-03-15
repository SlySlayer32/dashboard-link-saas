---
trigger: always_on
description: MVP scope boundaries — what is and is not being built in Dashboard Link
---

# Dashboard Link — MVP Scope

## Scope Gate

Before building anything new:
1. Check `/docs/6-product/FEATURES.md` for current build status
2. If the feature is not listed — stop and flag it before proceeding
3. Say: "This feature is not in the current MVP scope. Do you want to add it or skip it?"

Never silently build out-of-scope features.

## What Is In Scope (MVP)

**Admin Dashboard**
- Worker management — add, edit, delete workers with phone number validation
- Plugin configuration — connect Google Calendar, Airtable, Notion, or manual entry
- SMS delivery — one-click send with delivery status tracking
- Read confirmation — access log showing when each worker opened their dashboard
- Token controls — generate links with custom expiry (1–24 hours)
- Organisation settings — company name, basic branding
- SMS logs — full history of sent messages and open confirmations

**Worker Dashboard**
- Today-first view — always opens to today, no date navigation
- Mobile-first, single-page layout
- Schedule, location, access codes, instructions, contacts
- One-tap refresh to see updates — no resend required
- Fast load on 4G — screenshottable for zero-signal areas
- No login, no account, no install

**Plugin System**
- Google Calendar sync
- Airtable rows as tasks or schedule data
- Notion database entries
- Manual entry by manager

## What Is NOT In Scope (MVP)

Do not build, suggest, or scaffold any of the following:

- Payroll, time tracking, or HR features
- Worker logins, accounts, or passwords
- In-app messaging or team chat
- Native mobile app (iOS or Android)
- Complex scheduling or shift management
- Invoicing or billing management
- Multi-language support
- Stripe billing (Phase 2)
- Referral system (Phase 2)
- Dashboard branding/customisation (Phase 2)
- Airtable or Notion plugins (Phase 2)
- Automatic scheduled SMS sending (Phase 3)

## Phase Reference

| Phase | Goal | Timeline |
|-------|------|----------|
| 1 — MVP | 3–5 beta businesses using it over WhatsApp | Months 1–3 |
| 2 — Growth | Paid conversions + referral engine | Months 4–6 |
| 3 — Scale | 12–15 paying customers | Months 7–12 |

## Scope Creep Rule

This is a solo developer build. Every out-of-scope feature added delays the MVP and risks the entire project. When in doubt — cut it.

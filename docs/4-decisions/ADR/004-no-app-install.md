# ADR-004: No Native App — Web-Only via SMS Link
**Date:** 2026-01-07  
**Status:** Accepted

## Context
Field workers need daily access to their schedules and task information. Industry research shows 60% of workers never complete app downloads for employer-mandated apps. High-turnover industries (cleaning, hospitality, construction) have workers who start Day 1 without accounts or installed apps. Need to deliver information with zero friction.

## Options Considered

1. **Native mobile apps (iOS + Android)** — Traditional approach
   - Pros: Best performance, offline support, push notifications, native UX, app store presence
   - Cons: Requires app download (60% never complete), app store approval delays, separate codebases (iOS/Android), update friction, account creation required

2. **Progressive Web App (PWA)** — Installable web app
   - Pros: No app store, works offline, installable, single codebase
   - Cons: Still requires "Add to Home Screen" step (friction), iOS PWA limitations, less discoverable than app store

3. **Web-only via SMS link** — No installation required
   - Pros: Zero friction (tap link = instant access), works for casual/rotating staff on Day 1, no account creation, no app store gatekeeping, single codebase, instant updates
   - Cons: No offline support, no push notifications, no app store presence, requires internet connection

## Decision
Build web-only dashboard accessed via SMS link. No native app, no PWA, no app store presence.

**Primary reasons:**
- **Zero friction is the core differentiator** — 60% of workers never download employer apps; we eliminate that barrier entirely
- Casual and rotating staff work perfectly on Day 1 (no account setup, no app install)
- No app store gatekeeping (no approval delays, no rejection risk, no 30% revenue cut)
- Instant updates (no "update your app" friction)
- Single codebase reduces development complexity for solo developer
- Mobile-first web design is sufficient for use case (viewing daily schedule)

## Consequences

**Positive:**
- **Zero friction for workers** — tap SMS link, dashboard loads instantly (core value proposition)
- Casual/part-time/rotating staff work perfectly on Day 1 (critical for high-turnover industries)
- No app store approval delays or rejections (faster iteration)
- Instant updates without user action (always latest version)
- Single codebase (React) for both admin and worker dashboards (faster development)
- No app store fees (30% revenue cut avoided)
- Works on any device with browser (iOS, Android, desktop)

**Negative:**
- **No offline support** — workers need internet connection to view dashboard (mitigated: workers can screenshot dashboard for offline reference)
- **No push notifications** — can't proactively notify workers of schedule changes (mitigated: SMS is the notification; dashboard is always current when opened)
- **No app store presence** — less discoverable (mitigated: B2B SaaS, not consumer app; managers find us, not workers)
- **Token-based security** — must implement secure token generation and expiry (mitigated: industry-standard pattern)

**Neutral:**
- Mobile web performance is excellent with modern frameworks (React 18 + Vite)
- Progressive enhancement possible later (can add PWA features without breaking existing flow)
- SMS link pattern is familiar to users (similar to password reset links)

**Design implications:**
- Dashboard must load fast on 4G (< 2 seconds)
- Mobile-first responsive design (320px+ screens)
- Touch-friendly UI (min 44x44px tap targets)
- Clear "refresh" button for latest data
- Encourage workers to screenshot dashboard for offline reference

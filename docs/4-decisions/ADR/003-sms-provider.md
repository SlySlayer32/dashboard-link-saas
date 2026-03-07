# ADR-003: Use MobileMessage.com.au for SMS Delivery
**Date:** 2026-01-07  
**Status:** Accepted

## Context
Need an SMS provider for delivering dashboard links to field workers in Australia. Primary requirements: low cost per SMS, high delivery reliability, Australian phone number support, no monthly fees (pay-as-you-go). Target market is Australian cleaning businesses, so Australia-first optimization is critical.

## Options Considered

1. **Twilio** — Global SMS leader
   - Pros: Global coverage, excellent API, mature platform, extensive documentation, webhook support
   - Cons: Higher cost per SMS in Australia (~5-8¢), global focus means less AU optimization, requires monthly minimum spend

2. **AWS SNS** — Amazon's messaging service
   - Pros: Integrates with AWS ecosystem, pay-as-you-go, reliable
   - Cons: Higher cost per SMS (~4-6¢), complex pricing, not SMS-focused (general messaging)

3. **MobileMessage.com.au** — Australian SMS provider
   - Pros: 2-3¢ per SMS (cheapest for AU), Australia-focused, no monthly fees, free virtual number for replies, simple API, local support
   - Cons: Australia-only (no global coverage), smaller platform (less mature), limited webhook features

## Decision
Use MobileMessage.com.au as the SMS provider for MVP and Phase 2.

**Primary reasons:**
- 2-3¢ per SMS is 50-60% cheaper than Twilio/AWS for Australian numbers
- No monthly fees aligns with pay-as-you-go business model (important for early-stage startup)
- Australia-first focus matches target market (cleaning businesses in AU)
- Free virtual number for SMS replies (future feature: workers can reply to SMS)
- Simple API reduces integration complexity for solo developer

## Consequences

**Positive:**
- Significantly lower SMS costs (critical for unit economics)
- No monthly fees reduce fixed costs during MVP phase
- Australia-focused provider understands local regulations and carrier relationships
- Free virtual number enables future two-way SMS features
- Simple API means faster integration

**Negative:**
- **Australia-only coverage blocks global expansion** (requires provider switch for international markets)
- Smaller platform means less mature features (e.g., limited webhook support)
- Smaller community means fewer integration examples and Stack Overflow answers
- Single point of failure (no multi-provider fallback in MVP)

**Neutral:**
- Provider switch required for global expansion (planned for Phase 3+)
- Can implement multi-provider abstraction layer later if needed
- API patterns are similar across SMS providers (migration feasible)

**Mitigation for global expansion:**
- Design SMS service with provider abstraction layer (adapter pattern)
- When expanding globally, add Twilio/AWS as secondary provider
- Use MobileMessage for AU numbers, Twilio for international numbers

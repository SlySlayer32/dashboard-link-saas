# Future Features & Considerations

This document tracks features and considerations that are **not part of the current MVP** but may be implemented in future phases.

## Phase 2+ Features (Documented When Implementing)

### E-01: Single-Use Token Protection
**PRD Reference:** Section 2.3  
**Status:** Optional feature for Phase 2  
**Implementation:** Add `used_at` timestamp to `dashboard_tokens` table, check on access

### E-17: Dashboard Customization
**PRD Reference:** Phase 2  
**Status:** Planned for Phase 2  
**Description:** Allow organizations to show/hide dashboard sections

### E-18: Basic Branding
**PRD Reference:** Phase 2  
**Status:** Planned for Phase 2  
**Description:** Company logo and colors on worker dashboard

### E-19: Industry Templates
**PRD Reference:** Phase 2  
**Status:** Planned for Phase 2  
**Description:** Pre-built templates for cleaning, construction, healthcare

### E-20: Scheduled SMS
**PRD Reference:** Phase 2  
**Status:** Planned for Phase 2  
**Description:** Schedule SMS for future delivery

### E-22: Webhook Support
**PRD Reference:** Phase 2  
**Status:** Planned for Phase 2  
**Description:** Allow external systems to push data via webhooks

## Phase 3+ Features

### E-21: Custom Plugin Builder
**PRD Reference:** Phase 3  
**Status:** Planned for Phase 3  
**Description:** No-code plugin builder for custom integrations

## Industry Expansion (Future)

### E-23: Hospitality Industry
**Status:** Future consideration  
**Requirements:** Industry-specific templates, terminology

### E-24: Construction Industry
**Status:** Future consideration  
**Requirements:** Safety compliance, equipment tracking

### E-25: Healthcare Industry
**Status:** Future consideration  
**Requirements:** HIPAA compliance, patient privacy

### E-26: Property Management
**Status:** Future consideration  
**Requirements:** Tenant communication, maintenance tracking

## Open Questions & Future Considerations

### E-28: SMS Reply Handling
**Status:** Open question  
**Current:** One-way SMS only (dashboard links)  
**Future:** May add two-way SMS for worker responses

### E-29: Mobile Admin View
**Status:** Cut from MVP  
**Reason:** Admin dashboard is desktop-focused, mobile not priority

### E-30: Multi-Language Support
**Status:** Future consideration  
**Current:** English only (Australia market)

### E-31: White-Label Option
**Status:** Future consideration  
**Description:** Remove "Powered by Dashboard Link" branding

### E-32: API Rate Limit Customization
**Status:** Future consideration  
**Current:** Fixed rate limits per organization tier

### E-33: Advanced Analytics Dashboard
**Status:** Future consideration  
**Current:** Basic analytics only (open rates, SMS count)

### E-34: Team Collaboration Features
**Status:** Future consideration  
**Description:** Multiple admin users, role permissions, audit logs

## Resolved Items

### E-27: Annual Billing
**Status:** ✅ Resolved  
**Decision:** Documented in PRICING.md (20% discount for annual)

---

**Note:** This document is for tracking only. Features listed here should be documented in detail when implementation begins.

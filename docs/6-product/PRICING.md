# Pricing & Plans

## Plans

| Plan | Price | Limits | Target User |
|------|-------|--------|-------------|
| **Free** | $0/month | ## TODO: Define free tier limits (if any) | Trial/evaluation users |
| **Starter** | $99/month | Unlimited workers, 2 plugins, 1000 SMS/month | Small cleaning businesses (5-20 workers) |
| **Professional** | $199/month | Unlimited workers, 5 plugins, 5000 SMS/month, priority support | Growing businesses (20-50 workers) |
| **Enterprise** | Custom | Unlimited everything, custom integrations, dedicated support | Large businesses (50+ workers) |

## Business Logic

### Rules Enforced in Code

**Worker limits:**
- Free: Max 10 workers
- Starter/Professional/Enterprise: Unlimited workers

**Plugin limits:**
- Free: 1 plugin (manual entry only)
- Starter: 2 plugins (any combination)
- Professional: 5 plugins (any combination)
- Enterprise: Unlimited plugins

**SMS limits:**
- Free: 100 SMS/month
- Starter: 1000 SMS/month
- Professional: 5000 SMS/month
- Enterprise: Unlimited SMS (fair use policy)

**What happens when limits are hit:**
- **Worker limit:** "Upgrade to add more workers" message, add button disabled
- **Plugin limit:** "Upgrade to connect more plugins" message, connect button disabled
- **SMS limit:** "SMS limit reached, upgrade or wait until next month" message, send button disabled
- **Overage:** No overage charges, hard limits enforced (prevents surprise bills)

## Trial / Free Tier

**MVP approach (paid-only):**
- No free tier for MVP — validates genuine willingness to pay
- 14-day free trial for all plans (no credit card required)
- Trial includes full features of Starter plan
- After trial: prompt to subscribe or account paused

**Post-MVP (if needed):**
- Consider free tier with strict limits (10 workers, 1 plugin, 100 SMS/month)
- Free tier as lead magnet, upsell to paid plans
- Monitor conversion rate from free to paid

## Upgrade / Downgrade Behaviour

### Upgrade (Immediate)
1. User clicks "Upgrade" in admin dashboard
2. Redirected to Stripe checkout
3. Payment processed → Plan upgraded immediately
4. New limits applied instantly
5. Confirmation email sent

### Downgrade (End of Billing Period)
1. User clicks "Downgrade" in admin dashboard
2. Confirmation modal: "Downgrade will take effect on [date]"
3. User confirms → Downgrade scheduled
4. Current plan continues until end of billing period
5. New plan starts on next billing date
6. If over new limits (e.g., 3 plugins but downgrading to 2-plugin plan):
   - Warning shown: "You have 3 plugins but new plan allows 2. Please disconnect 1 plugin before downgrade."
   - Downgrade blocked until user complies

### Cancellation
1. User clicks "Cancel Subscription"
2. Confirmation modal: "Your account will remain active until [end of billing period]"
3. User confirms → Cancellation scheduled
4. Account remains active until end of billing period
5. After billing period: account paused (data retained for 30 days)
6. After 30 days: account deleted (GDPR right to be forgotten)

## Pricing Strategy Notes

**Why per-org pricing (not per-worker):**
- Removes growth penalty — businesses don't pay more as team grows
- Predictable costs for managers
- Simpler billing logic
- Encourages adoption (no hesitation to add workers)

**Why SMS limits:**
- SMS has real per-unit cost (2-3¢ each)
- Prevents abuse (spam, excessive sends)
- Aligns cost with usage
- Generous limits for normal use (1000 SMS = ~30 workers × daily send × 30 days)

**Why plugin limits:**
- Differentiates plans (free vs paid)
- Most businesses need 1-2 plugins (Google Calendar + manual)
- Professional plan covers power users (5 plugins)
- Enterprise for complex integrations

## Annual Billing Discount

**Industry standard: 15-20% discount for annual commitment**

| Plan | Monthly | Annual (save 17%) | Annual Price |
|------|---------|-------------------|-------------|
| **Starter** | $99/month | $990/year | $82.50/month |
| **Professional** | $199/month | $1,990/year | $165.83/month |
| **Enterprise** | Custom | Custom | Negotiated |

**Why 17% discount:**
- Industry standard is 15-20% (we're in the middle)
- Equivalent to 2 months free (12 months for price of 10)
- Reduces churn (annual commitment)
- Improves cash flow (upfront payment)
- Competitive with similar SaaS products

**Annual billing benefits:**
- Lower effective monthly cost
- No monthly billing hassle
- Priority support (faster response times)
- Early access to new features
- Dedicated account manager (Enterprise only)

**Payment terms:**
- Annual plans billed upfront (full year)
- Monthly plans billed on signup date each month
- All plans auto-renew unless cancelled
- Prorated refunds available (see refund policy)

---

## Refund Policy

### 30-Day Money-Back Guarantee

**Applies to:**
- First-time subscribers only (new customers)
- Both monthly and annual plans
- Valid for 30 days from initial purchase

**How it works:**
1. Customer requests refund within 30 days of purchase
2. Support team processes refund request (no questions asked)
3. Full refund issued within 5-7 business days
4. Account access continues until end of paid period
5. Data retained for 30 days after cancellation (GDPR compliance)

**Not eligible for refund:**
- Renewals (only first purchase)
- Accounts suspended for terms of service violations
- Requests after 30-day window
- Enterprise custom contracts (separate terms)

### Prorated Refunds (Annual Plans)

**If cancelling annual plan mid-year:**
- Refund = (Unused months / 12) × Annual price
- Example: Cancel after 3 months of $990 annual plan = $742.50 refund
- Processed within 10 business days
- Account remains active until end of paid period

**Not prorated:**
- Monthly plans (no refund for partial month)
- Downgrades (credit applied to next billing cycle)

### Refund Process

1. Customer contacts support via email or in-app chat
2. Support verifies eligibility (purchase date, plan type)
3. Support initiates refund in Stripe dashboard
4. Stripe processes refund to original payment method
5. Customer receives confirmation email
6. Account marked for cancellation (data retained 30 days)

**Processing time:**
- Credit card: 5-7 business days
- PayPal: 3-5 business days
- Bank transfer: 7-10 business days

---

## Pricing Page Copy & FAQ

### Headline
**"Stop chasing workers. Start delivering clarity."**

Send personalized daily dashboards to your team via SMS. No app install required.

### Value Propositions

**For Managers:**
- ⏱️ Save 2 hours/day on coordination calls
- 📱 Zero friction — workers tap link, see schedule instantly
- 🔌 Connect your existing tools (Google Calendar, Airtable, Notion)
- 📊 Track delivery and access (know who's seen their schedule)

**For Workers:**
- 📲 No app to download or login to remember
- 🎯 See only what matters: today's jobs, locations, access codes
- 🔄 Refresh anytime for latest updates
- 📸 Screenshot for offline reference

### FAQ

**Q: Do workers need to install an app?**  
A: No! Workers receive an SMS link and view their dashboard in their phone's browser. Zero friction.

**Q: What happens if I exceed my SMS limit?**  
A: Sending is paused until next month or you upgrade. No surprise charges. We'll notify you at 80% usage.

**Q: Can I cancel anytime?**  
A: Yes. Monthly plans cancel anytime. Annual plans are prorated. 30-day money-back guarantee for new customers.

**Q: How secure are the dashboard links?**  
A: Links expire after 1-24 hours (you choose). Tokens are hashed, access is logged. Workers can only see their own data.

**Q: Which plugins are supported?**  
A: Google Calendar, Airtable, Notion, and manual entry. More coming soon (request via support).

**Q: Do you offer a free trial?**  
A: Yes! 14-day free trial with full Starter plan features. No credit card required.

**Q: What if I have more than 50 workers?**  
A: Contact us for Enterprise pricing. We offer volume discounts and custom integrations.

**Q: Can I change plans later?**  
A: Yes. Upgrades are immediate. Downgrades take effect at next billing cycle.

**Q: Is my data safe?**  
A: Yes. Multi-tenant isolation, encrypted at rest and in transit, daily backups, GDPR compliant.

**Q: Do you offer annual billing?**  
A: Yes! Save 17% (2 months free) with annual billing.

---

## TODO: Finalize free tier limits (if offering free tier) — Business decision pending
## TODO: Add pricing page copy and FAQ — Marketing/copywriting task

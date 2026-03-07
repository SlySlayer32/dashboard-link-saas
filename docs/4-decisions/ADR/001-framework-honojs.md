# ADR-001: Use Hono.js instead of Express
**Date:** 2026-01-07  
**Status:** Accepted

## Context
Need a fast, TypeScript-first web framework for the API server. The application will be deployed to serverless/edge environments (Vercel, Cloudflare Workers) where cold start time and memory footprint are critical. Solo developer needs excellent TypeScript DX to move quickly without runtime errors.

## Options Considered

1. **Express.js** — Industry standard, mature ecosystem
   - Pros: Huge ecosystem, extensive documentation, team familiarity, battle-tested
   - Cons: Not TypeScript-first, 5x larger memory footprint, slower cold starts, middleware types are painful

2. **Fastify** — Fast, TypeScript-friendly
   - Pros: Fast, good TypeScript support, schema-based validation, plugin ecosystem
   - Cons: Still larger than Hono, more complex than needed for our use case

3. **Hono.js** — Modern, TypeScript-first, edge-optimized
   - Pros: 5x smaller memory footprint than Express, fastest cold starts, TypeScript-first design, built-in OpenAPI support, works on edge runtimes
   - Cons: Smaller ecosystem than Express, newer (less battle-tested), team learning curve

## Decision
Use Hono.js as the API framework.

**Primary reasons:**
- 5x smaller memory footprint critical for serverless cost optimization
- Fastest cold starts (critical for edge deployment and user experience)
- TypeScript-first design reduces runtime errors and improves DX for solo developer
- Built-in OpenAPI support simplifies API documentation
- Works seamlessly on edge runtimes (future-proofs deployment options)

## Consequences

**Positive:**
- Significantly faster cold starts improve API response times
- Smaller memory footprint reduces hosting costs
- TypeScript-first design catches errors at compile time
- Built-in OpenAPI support makes API documentation automatic
- Edge-ready architecture provides deployment flexibility

**Negative:**
- Smaller ecosystem means fewer third-party middleware options
- Team needs to learn new framework (mitigated: API is simple, documentation is good)
- Less Stack Overflow content for troubleshooting (mitigated: excellent official docs)
- Fewer developers familiar with Hono vs Express (hiring consideration)

**Neutral:**
- Middleware patterns are similar to Express (easy mental model transfer)
- Can still use most Express-compatible middleware with adapters

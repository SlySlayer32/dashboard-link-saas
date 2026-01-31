# How to Use SpecKit Modes

This guide explains how to use the 3 specification modes to ensure you get the right result: **Production-Ready Code** with **Controlled Scope**.

## The Golden Rule

**"MVP" means FEWER FEATURES, not WORSE CODE.**
Always expect production-quality code, even for MVP.

## The 3 Modes

### 1. MVP Mode (Start Here)
**Keywords**: `mvp`, `v1`
**Use when**: Starting a new project or major component.

**What it does**:
- Focuses ONLY on top 3-5 user stories
- Builds them to **production quality** (secure, error handling, tested)
- Explicitly defers everything else to V2

**Example Command**:
```
/speckit.specify mvp Build a worker dashboard with auth, schedule view, and SMS link delivery
```
**Result**:
- ✅ Auth system (Complete, Secure)
- ✅ Schedule view (Real data, handled errors)
- ✅ SMS delivery (Real integration, retries)
- ❌ Profile editing (Deferred to V2)
- ❌ Notifications (Deferred to V2)

### 2. Iteration Mode (Add Features)
**Keywords**: `v2`, `v3`, `v4`...
**Use when**: Adding specific features to an existing system.

**What it does**:
- Adds ONLY the requested new features
- Maintains the same **production quality**
- Respects existing code

**Example Command**:
```
/speckit.specify v2 Add profile editing and push notifications to the worker dashboard
```
**Result**:
- ✅ Profile editing (Complete)
- ✅ Push notifications (Complete)
- 🔒 Existing features untouched

### 3. Full Feature Mode (Build Everything)
**Keywords**: (none)
**Use when**: You want to spec out a complete system at once (rarely recommended for solo founders).

**What it does**:
- Includes ALL identified user stories
- Builds everything to **production quality**
- No deferrals

**Example Command**:
```
/speckit.specify Build a complete workforce management platform
```

## Quick Reference

| Keyword | Goal | Scope | Quality |
|---------|------|-------|---------|
| `mvp`, `v1` | **Launch Fast** | Top 3-5 Stories | ⭐ Production |
| `v2`, `v3` | **Add Value** | Specific Additions | ⭐ Production |
| (none) | **Big Bang** | Everything | ⭐ Production |

## Common Mistakes

❌ **Don't say**: "Build a basic MVP with simple auth"
👉 **Why**: AI hears "simple auth" and makes insecure code.
✅ **Say**: "Build MVP with auth" (AI defaults to secure auth).

❌ **Don't say**: "Just a prototype"
👉 **Why**: AI puts `TODO`s everywhere.
✅ **Say**: "MVP scope" (AI builds real code, just less of it).

# Decision note — Calendar booking provider (parked)

**Status:** Parked (no budget). Revisit when there's budget and calendar volume.
**Date:** 2026-07 (dates verify at revisit)
**Context:** Considered moving appointment booking off Cal.com so appointments land
natively in each client's own calendar and to reduce new-user setup friction.

## Decision
**Stay on Cal.com for now.** Do not migrate calendar providers. Instead, remove the
new-user *friction* for free (onboarding flow, guided Cal.com connect, hide Cal.com
primitives like Event Type IDs). Booking already works; a provider swap costs money
and effort without fixing the actual headache.

## Why the migration is parked
- Every alternative (Cronofy, Nylas) is a **paid monthly vendor**; there is no budget.
- It's real engineering, and it does **not** fix the new-user pain — that pain is UX
  (exposed Cal.com plumbing + no guided setup), which is fixable for $0.

## Options evaluated (list prices as of 2026-07 — re-verify)
| Option | Native calendar writes | Multi-provider | Entry cost | Notes |
|---|---|---|---|---|
| **Cal.com (current)** | via Cal.com | yes | already integrated | Setup friction is a UX problem, fixable free |
| **Nylas** | yes (Google/Outlook/iCloud) | yes | ~$10/mo incl. 5 calendars, then ~$1.50/calendar | Cheapest to start; thinner availability engine; rides Nylas' verified OAuth app (skip Google security review) |
| **Cronofy** | yes | yes | **~$819/mo** floor (Emerging, up to 1,000 calendars) | Best availability engine; entry price only makes sense at hundreds of calendars |
| **Direct Google + MS Graph** | yes | build per provider | $0 vendor | Most work; must pass Google OAuth security assessment (multi-week); rebuild availability engine |

## Recommendation for when we revisit
- **< ~400–500 connected calendars:** start on **Nylas** (dramatically cheaper, covers
  the need: native writes, one-click connect, multi-provider).
- **Hundreds+ of calendars and/or complex multi-attendee availability:** move to
  **Cronofy** for its availability engine.
- Build behind a **provider abstraction** matching the existing seam
  (`getAvailableSlots` / `reserveSlot` / `listBookings` / `cancelBooking` in
  `calcomService`) so the UI (`BookingModal`) never changes and we're never locked in.

## Sources
- Cronofy API pricing: https://www.cronofy.com/api-pricing
- Nylas pricing: https://www.nylas.com/pricing/

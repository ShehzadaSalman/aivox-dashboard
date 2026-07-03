# PRD — Lead → Appointment Conversion Surface

**Owner:** Product
**Status:** In progress
**Last updated:** 2026-07-01
**Primary persona:** End client (business owner / office manager — role `USER`/`ADMIN`)
**North-star metric:** Lead → Appointment conversion rate

---

## 1. Problem

Candibly captures leads from AI-answered calls well, but the step that turns a lead
into booked business — the part the customer actually pays for — is the weakest in
the product:

- The booking modal exposes Cal.com API primitives (**Event Type ID**, a free-text
  **timezone**) that a non-technical business owner does not understand.
- It uses a blind `datetime-local` field instead of showing real open slots, so users
  can pick a time that is already taken and only discover the failure *after* submit —
  a silently lost booking.
- The Leads screen is a passive table: a lead's status can be filtered but never
  changed, and there is no way to call or text a lead. The pipeline never advances.
- Nothing in the app reports the lead → appointment conversion rate, so the customer
  can't see the value they're getting.

## 2. Goals

1. Make booking an appointment from a lead take **≈2 taps**, with no exposure to API
   primitives.
2. Eliminate post-submit booking failures by only offering **real, available slots**.
3. Make Leads an **actionable worklist**: change status, one-tap call/text, act on the
   captured intent ("reason").
4. Surface the **conversion rate** so the customer feels the value.

### Non-goals (this iteration)

- Agent creation/editing for end clients.
- Rescheduling existing appointments (cancel already exists).
- Full design-system refactor of every screen (tracked separately).
- Multi-calendar / round-robin scheduling.

## 3. Users & context

The end client logs in anxious: *"Did the AI miss business, and is a hot lead waiting?"*
They are not technical. They live in Leads and Appointments, not in analytics.

## 4. Requirements

### 4.1 Booking modal → availability slot-picker  *(P0)*

- Given a lead, opening "Book appointment" shows **real available slots** fetched from
  Cal.com (`GET /api/slots/available`) for the configured event type.
- **Event Type ID is never shown** to the end client; it is read from the saved Cal.com
  integration config. If no event type is configured, show a clear inline message
  ("Ask your admin to connect Cal.com") instead of raw fields.
- Attendee name/email are **pre-filled** from the lead and editable.
- User picks a day, then a time slot from the returned availability. No free-text
  date/time entry.
- Timezone defaults to the browser timezone; not shown as an editable API string.
- On success: show a confirmation ("Booked for Tue, Jul 8 · 2:00 PM"), stamp the lead,
  and refetch. On failure: inline error, modal stays open with selection intact.

**Acceptance:** A user can book from a lead without ever seeing an Event Type ID or
typing a date; a slot that Cal.com reports as unavailable cannot be selected.

### 4.2 Leads worklist  *(P0)*

- Each lead row/card leads with the captured **reason/intent** as the headline.
- **Editable status** (New → Contacted → Qualified) that persists via
  `PATCH /api/dashboard/leads/:leadId` and optimistically updates the UI.
- **One-tap Call** (`tel:`) and **Text** (`sms:`) using the normalized phone number.
- **Book** action opens the slot-picker (4.1).
- Leads that have been booked are visibly stamped ("✓ Booked").

**Acceptance:** A user can move a lead through statuses and reach call/text/book from a
single row without opening a separate screen.

### 4.3 Conversion metric on home  *(P1)*

- Dashboard Overview shows **Leads → Appointments conversion rate** as a first-class
  card alongside leads captured and appointments booked, oriented to outcomes rather
  than call volume/cost.

**Acceptance:** The home screen shows conversion rate derived from leads and bookings.

## 5. API surface

| Need | Endpoint | Status |
|------|----------|--------|
| Available slots | `GET /api/slots/available` | Exists (backend); wire in frontend |
| Reserve slot | `POST /api/slots/reserve` | Exists |
| Update lead status | `PATCH /api/dashboard/leads/:leadId` | **New — add** |
| List leads | `GET /api/dashboard/leads` | Exists |
| List bookings | `GET /api/bookings` | Exists |

## 6. Rollout

Ship behind the existing Cal.com "Beta" integration gating. No migration required —
`Lead.status` already exists (`NEW`/`CONTACTED`/`QUALIFIED`).

## 7. Success measurement

- Primary: lead → appointment conversion rate (now visible in-app).
- Guardrail: booking failure rate after submit → target ~0 (slot-picker prevents
  collisions).
</content>
</invoke>

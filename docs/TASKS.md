# Tournament Arena task register

This document tracks implementation and documentation work that is visible to
the project team. Keep it synchronized with the current product and technical
documentation rather than using it as a private scratchpad.

## Completed

- [x] Document the product scope, MVP boundaries, and target users.
- [x] Document the React, Django, Channels, database, integration, and
  deployment architecture.
- [x] Document the shared design system and accessibility expectations.
- [x] Document development, security, testing, and delivery rules.
- [x] Document the implemented My Rooms workflow: room summaries, team
  waiting, participants, announcements, chat, results, team removal, and
  winner payouts.

## Active

- [ ] Add backend regression tests for room-detail visibility and participant
  authorization.
- [ ] Add frontend coverage for room loading, empty states, WebSocket
  connection states, and tab navigation.
- [ ] Add permission tests for team removal and staff-only winner payouts.
- [ ] Verify payout idempotency and duplicate-winner handling at the API layer.
- [ ] Verify production WebSocket routing, Redis configuration, and secure
  token handling.

## Release readiness

- [ ] Run the frontend lint and production build.
- [ ] Run Django checks and the backend test suite.
- [ ] Test the `/my-rooms` flow on desktop and narrow mobile widths.
- [ ] Test open, full, started, completed, and empty-room states.
- [ ] Confirm failed room, chat, removal, and payout requests show actionable
  errors without false success messages.
- [ ] Review documentation after endpoint, permission, or workflow changes.

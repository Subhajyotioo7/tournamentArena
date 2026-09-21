# Tournament Arena - Project Memory

This file is a concise handoff document for future development sessions. Keep
it current when project scope, architecture, standards, or delivery status
changes.

## Project memory

Tournament Arena is a full-stack competitive gaming tournament platform. The
main user journey is:

```text
discover tournament
  -> register solo or with a team
  -> verify email and game ID
  -> pay through the wallet
  -> join a tournament room
  -> communicate through live chat
  -> record results and manage payouts
```

The primary user groups are players, team captains/team members, and
tournament administrators or organizers.

### Technology baseline

- Frontend: React 19, Vite, React Router, Tailwind CSS, Inter Variable font.
- Backend: Django 5.2, Django REST Framework, SimpleJWT, Django Channels.
- Realtime: ASGI/WebSockets with Redis recommended for production.
- Data: SQLite for local development and PostgreSQL recommended for production.
- Integrations: Resend for email and Razorpay/PhonePe payment flows.
- Delivery: Nginx, Supervisor, Docker, and Kubernetes Helm assets.

### Important boundaries

- React is responsible for presentation, navigation, client state, and API
  calls.
- Django is the source of truth for business rules, authorization, payments,
  approvals, and persisted state.
- Provider credentials remain on the backend and are supplied through
  environment variables.
- HTTP chat history and WebSocket live updates are complementary; temporary
  WebSocket loss must not remove persisted messages.

### Key documentation

- [PRD.md](./PRD.md) defines the product overview, problem, goals, users, and
  MVP scope.
- [ARCHITECTURE.md](./ARCHITECTURE.md) defines system boundaries, technology,
  folder structure, and request/deployment flows.
- [RULES.md](./RULES.md) defines development, coding, technology, project, and
  validation standards.
- [DESIGN.md](./DESIGN.md) defines the visual system, palette, typography, and
  UI component guidance.

## Completed tasks

### Documentation baseline

- [x] Created the product requirements document with product overview,
  problem statement, goals, target users, MVP features, and MVP boundaries.
- [x] Created the architecture document with high-level architecture,
  technology stack, folder structure, integration points, and deployment
  flows.
- [x] Created the development rules document with general principles,
  technology rules, coding standards, project standards, testing guidance, and
  delivery checklist.
- [x] Created the design document with design principles, color palette,
  typography, responsive/accessibility guidance, and UI component standards.
- [x] Validated that each document contains its required top-level sections.

## In progress

- [ ] Continue implementing and refining the MVP product flows described in
  [PRD.md](./PRD.md): tournament discovery, registration, team participation,
  wallet/payment operations, game ID approval, rooms, chat, results, and
  administration.
- [ ] Keep frontend, backend, deployment configuration, and documentation
  synchronized as implementation changes are made.
- [ ] Add or extend regression coverage for authentication, authorization,
  registration state transitions, wallet/payment operations, payouts, and
  WebSocket room access as those areas evolve.
- [ ] Verify production configuration for PostgreSQL, Redis, email delivery,
  payment providers, Nginx, and process supervision before release.

No specific feature implementation was marked as actively in progress at the
time this memory was updated. Update this section when a feature is assigned,
started, blocked, or completed.

## Working conventions

- Read the relevant documentation before changing a cross-cutting workflow.
- Prefer existing components, services, Django apps, and configuration
  patterns over parallel implementations.
- Make focused changes and avoid unrelated refactors.
- Run the smallest relevant lint, build, Django check, or test command after
  implementation changes.
- Record blockers and important decisions here or in the relevant architecture
  documentation so the next session can continue without reconstructing
  context.
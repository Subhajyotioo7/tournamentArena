# Tournament Arena - Development Rules

This document defines the engineering principles, technology conventions,
coding standards, and project practices for Tournament Arena. These rules
apply to frontend, backend, documentation, and deployment changes.

## General principles

### Build for the product

- Keep changes aligned with the tournament participation flow: discovery,
  registration, payment, verification, room access, communication, results,
  and administration.
- Prefer a complete, maintainable solution over a quick workaround.
- Reuse existing components, helpers, services, and backend patterns before
  introducing new abstractions.
- Keep each change focused. Avoid unrelated refactors or formatting churn.
- Preserve existing behavior unless a behavior change is explicitly required.
- Treat the backend as the source of truth for business rules, permissions,
  payments, approvals, and persisted state.

### Reliability and safety

- Validate input at the API boundary and enforce authorization on the server.
- Never trust validation performed only by the browser.
- Do not expose secrets, payment credentials, email credentials, or internal
  configuration in frontend code, logs, screenshots, or documentation.
- Handle expected errors explicitly and show users a useful, actionable state.
- Do not silently swallow exceptions or return success-shaped responses for
  failed operations.
- Use transactions and idempotent logic for wallet changes, payments, payouts,
  registrations, and other operations where retries could duplicate state.
- Protect personally identifiable information and uploaded KYC documents.
- Consider mobile layouts, slow networks, reconnects, and partial failures in
  user-facing flows.

### Communication and review

- Use clear commit and pull request descriptions that explain the user impact,
  implementation, and validation performed.
- Review changes for security, authorization, data consistency, accessibility,
  and backward compatibility.
- Update directly related documentation when an endpoint, workflow, setup
  step, or architecture decision changes.

## Technology and framework rules

### Frontend

- Use React functional components and hooks.
- Use React Router for application navigation; do not implement competing
  routing logic inside individual pages.
- Keep reusable UI in `frontend/src/components/`, route-level screens in
  `frontend/src/pages/`, shared state in `frontend/src/context/`, and HTTP
  calls in `frontend/src/services/`.
- Use the existing Vite configuration and path alias (`@` for `src`) where it
  improves import clarity.
- Use Tailwind CSS and the existing UI patterns before adding custom CSS.
- Use the shared API service for authenticated requests so token handling and
  error behavior stay consistent.
- Treat WebSocket events as realtime updates, not as a replacement for
  persisted backend data.
- For room screens, load persisted message history before relying on live
  WebSocket events and close the socket when the selected room or page changes.
- Keep room-manager and staff controls conditional in the UI, but enforce
  participant, manager, staff, and payout permissions in Django.

### Backend

- Keep domain functionality inside the appropriate Django app:
  `api`, `tournaments`, `wallet`, `payments`, `chat`, or `hostpartner`.
- Keep root URL composition in `backend/backend/urls.py`; keep endpoint
  definitions in the owning app's `urls.py`.
- Use Django models and the ORM for persistence. Do not bypass model validation
  or write raw SQL without a documented, justified need.
- Use serializers for API input/output and keep views focused on request
  orchestration.
- Enforce authentication and permissions in backend views/consumers even when
  the frontend hides or disables an action.
- Use Django migrations for every model or schema change. Never edit generated
  migration history to conceal an incompatible change.
- Use ASGI/Channels conventions for WebSocket consumers and preserve
  authentication and room authorization for every connection.

### Integrations and infrastructure

- Keep Resend, Razorpay, PhonePe Payouts, Redis, database, and deployment settings
  behind environment variables or deployment configuration.
- Isolate provider-specific code in the relevant backend integration app.
- Preserve the route behavior defined by Vite for development and Nginx for
  production, including `/ws/` WebSocket upgrade headers.
- Do not commit `.env` files, credentials, local databases containing sensitive
  data, build output, virtual environments, or `node_modules`.

## Coding standards

### Naming and structure

- Use descriptive names that communicate intent; avoid single-letter names
  outside short loops or mathematical expressions.
- Use `PascalCase` for React components and Python classes.
- Use `camelCase` for JavaScript variables, functions, and props.
- Use `snake_case` for Python variables, functions, modules, and URL names.
- Use uppercase names for constants.
- Keep functions and components focused on one responsibility.
- Prefer early validation and clear guard clauses over deeply nested branches.

### JavaScript and React

- Use modern JavaScript modules and `const` by default; use `let` only when
  reassignment is required.
- Keep JSX readable and avoid deeply nested inline logic.
- Include correct hook dependencies and avoid disabling lint rules without a
  specific explanation.
- Do not use `any`-style escape hatches or unchecked object access when a
  proper guard or fallback is possible.
- Provide labels, keyboard access, visible focus states, and useful status
  messages for interactive controls.
- Avoid unnecessary requests and rerenders; refresh data deliberately after
  mutations.

### Python and Django

- Follow PEP 8 and Django conventions.
- Keep views, serializers, and consumers explicit about validation failures and
  permission failures.
- Use timezone-aware datetimes and project utilities for time-sensitive logic.
- Use `select_related`/`prefetch_related` when needed to avoid avoidable query
  multiplication in list and detail endpoints.
- Return consistent HTTP status codes and response shapes.
- Add tests for permission boundaries, invalid input, state transitions, and
  financial operations.
- Keep secrets and provider calls out of models unless the existing pattern
  clearly requires them.

### Documentation and comments

- Write documentation in clear, concise Markdown.
- Document public endpoints, setup requirements, important state transitions,
  and non-obvious operational behavior.
- Comment why a non-obvious decision exists, not what obvious code does.
- Keep examples safe: use placeholders for tokens, keys, personal data, and
  payment identifiers.

## Project standards

### Repository organization

- Frontend code belongs under `frontend/`; backend code belongs under
  `backend/`; product and technical documentation belongs under `docs/`.
- Keep feature code in its owning Django app rather than creating catch-all
  modules.
- Add shared frontend code only when it is genuinely reused across routes or
  components.
- Keep deployment changes synchronized across the relevant Nginx, Supervisor,
  Docker, Helm, and environment documentation.

### API standards

- Use the existing route groups and naming conventions:
  `/api/`, `/tournaments/`, `/wallet/`, `/payments/`, `/chat/`,
  `/hostpartner/`, and `/admin/`.
- Use authenticated endpoints for user-specific, financial, administrative,
  and participant data.
- Return validation errors that identify the affected field or action.
- Make mutation endpoints safe to retry where practical, especially for
  deposits, withdrawals, payouts, registration fees, and team invitations.
- Do not expose fields that the requesting user is not authorized to see.
- Room removal and winner/payout mutations must return explicit success or
  validation errors; the UI must not show a success state for a failed request.

### Database and data standards

- Every schema change must include a migration and appropriate test coverage.
- Preserve referential integrity and use explicit state transitions for
  registrations, approvals, payments, and payouts.
- Do not store secrets or raw payment credentials in application tables.
- Use backups, migration checks, and production database configuration
  appropriate to the deployment environment.

### Testing and validation

- Run the smallest relevant validation first, then expand when changes cross
  boundaries.
- Frontend changes should pass:

  ```text
  cd frontend
  npm run lint
  npm run build
  ```

- Backend changes should pass:

  ```text
  cd backend
  python manage.py check
  python manage.py test
  ```

- Test the affected user flow, not only the implementation detail. For
  example, payment changes should cover the transaction state and the visible
  wallet result.
- Add regression tests for fixed bugs when practical.
- Do not ignore failing checks without recording the reason and impact in the
  change review.

### Delivery checklist

Before considering a change complete:

- Confirm the requested behavior works end to end.
- Confirm unauthorized users cannot perform the new operation.
- Confirm errors and empty/loading states are handled.
- Confirm migrations and environment requirements are documented.
- Run relevant lint, build, Django checks, and tests.
- Review the diff for accidental secrets, generated files, debug output, and
  unrelated edits.

## Rule for exceptions

If an exception to these standards is necessary, document the reason, scope,
trade-offs, and follow-up plan in the pull request or relevant architecture
documentation. Exceptions should be deliberate and temporary where possible.
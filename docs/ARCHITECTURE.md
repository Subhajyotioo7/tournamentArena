# Tournament Arena - Architecture

## High-level architecture

Tournament Arena is a full-stack web application with a React single-page
application (SPA) as the presentation layer and a Django application as the
domain/API layer. The system uses HTTP for normal page data and commands, and
WebSockets for live tournament-room chat.

```text
                   Browser
                      |
          React SPA / React Router
                      |
          Vite proxy (development)
          or Nginx reverse proxy
             /       |        \
            /        |         \
       HTTP APIs   WebSockets   Static/media
          |           |             |
          v           v             v
   Django/DRF     Django          Nginx
   HTTP app       Channels        file serving
          |           |
          +-----+-----+
                |
        Domain Django apps
                |
      Database / external services
```

### Main runtime components

1. **Frontend** renders the user interface, manages client-side routing and
   authentication state, and calls backend endpoints through shared services.
2. **Reverse proxy** serves the built frontend and routes backend paths to the
   ASGI server. In local development, Vite provides the equivalent proxy.
3. **Django HTTP application** exposes authentication, tournament, wallet,
   payment, chat-history, host-partner, and administration endpoints.
4. **Django Channels** accepts authenticated WebSocket connections for live room
   chat.
5. **Database** stores users, profiles, tournaments, rooms, teams,
   registrations, wallet transactions, payments, messages, and results.
6. **External services** provide email delivery, payment processing, and
   production WebSocket channel storage where configured.

## Technology stack

### Frontend

- React 19 for the component-based user interface.
- Vite for development, bundling, and the local development proxy.
- React Router for SPA navigation.
- Tailwind CSS and the shared UI components for styling.
- `fetch`-based services for HTTP API calls.
- WebSocket API for live room chat.

### Backend

- Python 3.12-compatible runtime.
- Django 5.2 for the application framework and administration.
- Django REST Framework for HTTP APIs and serialization.
- SimpleJWT for JWT authentication.
- Django Channels and Daphne/ASGI for WebSocket support.
- Django ORM for persistence and database access.

### Data and integrations

- SQLite for local development.
- PostgreSQL recommended for production.
- Redis or the in-memory channel layer for Channels messaging; Redis is
  recommended in production.
- Razorpay integration for wallet deposits and payment processing.
- Resend for email verification and transactional email.

### Delivery and operations

- Nginx serves the frontend build and reverse-proxies backend traffic.
- Supervisor manages the backend process in the documented server deployment.
- Docker and Kubernetes Helm assets support containerized deployment.
- Static files are collected under Django's static-files directory; uploaded
  media is stored under the backend media directory.

## Folder structure

```text
tournamentArena/
├── backend/
│   ├── manage.py                 Django management entry point
│   ├── backend/
│   │   ├── settings.py           Environment and installed-app configuration
│   │   ├── urls.py               Root HTTP route composition
│   │   ├── asgi.py               HTTP + WebSocket application entry point
│   │   └── wsgi.py               WSGI entry point for compatible deployments
│   ├── api/                      Registration, login, profiles, email OTP
│   ├── tournaments/              Tournaments, rooms, teams, results, prizes
│   ├── wallet/                   Profiles, balances, deposits, withdrawals
│   ├── payments/                 Payment-provider integration and endpoints
│   ├── chat/                     Message history and WebSocket consumers
│   ├── hostpartner/              Host-partner requests and approvals
│   ├── media/                    User-uploaded files
│   └── requirements.txt          Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx               SPA routes and application shell
│   │   ├── main.jsx              React bootstrap
│   │   ├── components/           Reusable UI and room/team components
│   │   ├── pages/                Route-level screens
│   │   ├── context/              Shared state such as authentication
│   │   ├── services/             API and authentication clients
│   │   ├── config/               Frontend configuration and game themes
│   │   └── lib/                  Shared utilities and notifications
│   ├── public/                   Public assets
│   ├── vite.config.js            Build and development proxy configuration
│   └── package.json              JavaScript dependencies and scripts
├── docs/                         Product and technical documentation
├── nginx.conf                    Production reverse-proxy configuration
├── supervisor.conf               Backend process configuration
├── k8s-helm-chart/               Kubernetes deployment assets
└── build_production.sh           Production build helper
```

Each Django feature app owns its models, serializers, views, URLs, tests, and
administrative registrations where applicable. The root
`backend/backend/urls.py` composes those app-level URL modules rather than
placing all endpoint logic in one module.

## How the parts connect

### Browser to frontend

The browser loads the Vite development server locally or the compiled React
assets served by Nginx in production. React Router handles browser navigation
inside the SPA. API requests are made by the frontend service layer and include
the user's authentication token for protected operations.

### Frontend to Django HTTP APIs

The frontend uses the following backend route groups:

| Route group | Responsibility |
| --- | --- |
| `/api/` | Registration, login, email verification, profiles, password flows |
| `/tournaments/` | Tournament listings, rooms, teams, invitations, results, prizes |
| `/wallet/` | Wallet balances, transactions, deposits, withdrawals, KYC |
| `/payments/` | Payment-provider operations and payment status |
| `/chat/` | Persisted room-message history |
| `/hostpartner/` | Host-partner requests and approvals |
| `/admin/` | Django administration and backend model management |

The root Django URL configuration maps each group to its corresponding app.
The frontend's `vite.config.js` proxies these paths to
`http://localhost:8000` during development. In production, Nginx proxies the
same paths to the ASGI backend at `127.0.0.1:8000`.

### Authentication and authorization

Registration creates a pending verification flow. Resend sends the OTP or
verification link, and the backend only permits normal login after email
verification. Successful login returns JWT credentials. Frontend authentication
context and API services use those credentials on protected requests; Django
views enforce permissions and administrator access on the server.

### Tournament and wallet domain

Tournament endpoints use Django models and serializers to coordinate tournament
configuration, room creation, solo or team participation, invitations, game ID
approval, result recording, and prize distribution. Wallet and payment apps
maintain balances and transaction records, call the configured payment
provider, and expose administrative review flows for deposits, withdrawals, and
payouts.

### Live chat

Room chat has two paths:

1. The frontend calls `/chat/room/<room-id>/messages/` over HTTP to load
   persisted message history.
2. The frontend opens `/ws/room/<room-id>/` for live messages. `backend/asgi.py`
   routes the connection through Channels authentication and the chat URL
   router to `RoomChatConsumer`.

Channels uses Redis in production or the configured in-memory channel layer for
local development. Nginx and Vite both preserve the WebSocket upgrade when
proxying `/ws/`.

### Email and payment integrations

The backend owns calls to Resend and Razorpay so provider credentials are not
exposed to the browser. Provider responses are translated into application
records and user-visible statuses. Secrets and environment-specific endpoints
are supplied through environment variables rather than committed source files.

## Request and deployment flows

### Local development

```text
Browser -> Vite :5173
              -> /api, /wallet, /tournaments, /payments, /chat -> Django :8000
              -> /ws -> Django Channels :8000
```

### Production

```text
Browser -> Nginx :80/443
            |-> frontend/dist for SPA and assets
            |-> backend ASGI :8000 for HTTP APIs
            |-> backend ASGI :8000 with upgrade headers for /ws/
            |-> backend static/media paths where configured
```

Supervisor keeps the ASGI backend available. Nginx provides the public entry
point, SPA history fallback, compression, upload limits, security headers, and
WebSocket proxy settings.

## Architectural boundaries

- UI components must use frontend services/context rather than embedding
  backend credentials or provider secrets.
- Business rules and authorization remain in Django, not only in React.
- External payment and email providers are called from the backend.
- WebSocket chat is supplementary to persisted HTTP message history; a
  temporary connection loss must not remove stored messages.
- Environment-specific configuration belongs in `.env` or deployment
  configuration and must not be committed to source control.

### My Rooms interaction

The My Rooms page is a protected frontend route backed by two HTTP reads and
one WebSocket channel:

1. `GET /tournaments/my-rooms/` returns the user's joined or owned rooms and
   summary values used by the room cards.
2. `GET /tournaments/room/<uuid>/` returns the selected room's participants,
   teams, announcements, and recorded results.
3. `/ws/room/<uuid>/?token=<jwt>` authenticates the participant or staff user,
   persists sent messages, and broadcasts them to the tournament chat group.

Room managers can remove a team through
`POST /tournaments/room/<uuid>/remove-team/`. Staff can add a winner through
`POST /tournaments/room/<uuid>/add-winner/`; the backend validates the
participant and credits the wallet. These authorization and financial rules
remain server-side even though the UI hides controls from ordinary players.
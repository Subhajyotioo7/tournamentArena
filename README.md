# Tournament Arena

Tournament Arena is a full-stack tournament platform for competitive game rooms, player registration, wallet payments, team invitations, live room chat, game ID verification, and prize payouts.

## Features

- Tournament browsing and tournament detail pages
- Solo and team registration flows
- Game ID submission and admin approval
- Wallet balance, deposits, withdrawals, and Razorpay integration
- Email verification with a 6-digit OTP and Resend
- JWT authentication with unverified-login protection
- Live room chat with Django Channels and WebSockets
- React admin dashboard and Django admin site
- Responsive layouts for desktop and mobile

## Stack

- Backend: Django 5.2, Django REST Framework, SimpleJWT
- Realtime: Django Channels, Daphne, Redis or in-memory channels locally
- Frontend: React 19, Vite, React Router, Tailwind CSS
- Database: SQLite for local development; PostgreSQL is recommended for production
- Email: Resend Python SDK
- Payments: Razorpay
- Deployment: Nginx, Supervisor, Docker, and Helm assets

## Repository layout

```text
tournamentArena/
├── backend/              Django project and API
│   ├── api/              Authentication and account endpoints
│   ├── backend/          Django settings, ASGI, and WSGI
│   ├── chat/             WebSocket chat endpoints
│   ├── payments/         Razorpay integration
│   ├── tournaments/      Tournament, room, team, and result logic
│   ├── wallet/           Profiles, wallet, deposits, and withdrawals
│   ├── manage.py
│   └── requirements.txt
├── frontend/             React and Vite application
├── nginx.conf            Production reverse proxy configuration
├── supervisor.conf       Production process configuration
├── k8s-helm-chart/       Kubernetes deployment files
├── build_production.sh
├── setup_server.sh
├── start_frontend.sh
├── Makefile
└── README.md
```

## Requirements

- Python 3.12 or compatible Python 3 version
- Node.js and npm
- SQLite for local development
- A Resend account and API key for email verification
- Redis for production WebSockets

## Local setup

### Backend

Run these commands from the repository root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
python manage.py runserver 0.0.0.0:8000
```

On Windows PowerShell, use the virtual environment created for Windows. The checked-in `venv` may be Linux/WSL formatted, so run the backend from WSL when using `venv/bin/activate`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`.

The Vite development server proxies `/api`, `/wallet`, `/tournaments`, `/payments`, `/chat`, `/admin`, and `/ws` to the backend. Restart Vite after changing `vite.config.js`.

## Environment variables

Create `backend/.env`. Do not commit it or expose its values in logs, screenshots, or source control.

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
REDIS_URL=redis://localhost:6379/0
```

`backend/backend/settings.py` loads `backend/.env` using `python-dotenv`. In Resend testing mode, the default sender can only deliver to permitted recipients. For production, verify your domain in Resend and set `RESEND_FROM_EMAIL` to a verified address.

For the frontend, create `frontend/.env` only when the API is not being accessed through the Vite proxy:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/
```

## Email verification flow

1. A user submits the registration form.
2. Django creates the user and stores pending registration data in `EmailVerification`.
3. Resend sends a 6-digit OTP valid for 15 minutes and a verification link.
4. The frontend displays the OTP page immediately after registration.
5. `POST /api/verify-email/code/` validates the code.
6. Only after successful verification is the permanent `Profile` created.
7. Login returns HTTP 403 until the email is verified.

Useful frontend routes:

- `/register`: create an account and open OTP verification
- `/verify-email`: enter or resend an OTP
- `/verify-email/<uid>/<token>`: open a verification link
- `/login`: authenticate after verification

If an OTP migration is pending, run:

```bash
cd backend
source venv/bin/activate
python manage.py migrate
```

The migration creating the pending verification table is `wallet.0008`.

## Main API routes

```text
POST /api/register/
POST /api/login/
GET  /api/verify-email/<uidb64>/<token>/
POST /api/verify-email/code/
POST /api/verify-email/resend/
GET  /api/me/

GET  /tournaments/tournaments/
POST /tournaments/tournament/<id>/create-room/
POST /tournaments/room/<id>/join-solo/
POST /tournaments/room/<id>/create-team/
GET  /chat/room/<id>/messages/
```

Protected endpoints require:

```http
Authorization: Bearer <access-token>
```

## Admin access

There are two separate admin surfaces:

- React admin dashboard: `http://localhost:5173/admin`
- Django administration: `http://localhost:8000/admin/`

Use the React dashboard for Tournament Arena workflows such as Game ID approval, tournament administration, deposits, and withdrawals. Use Django admin for direct model/database administration.

Create a Django administrator with:

```bash
cd backend
source venv/bin/activate
python manage.py createsuperuser
```

## Common development commands

From the repository root:

```bash
make setup             # Install backend and frontend dependencies
make migrate           # Apply Django migrations
make dev-backend       # Start Django on port 8000
make dev-frontend      # Start Vite
make collectstatic     # Collect Django static files
make build-frontend    # Build frontend/dist
make build-prod        # Run the production build script
make clean             # Remove Python cache files
```

## Production deployment

The production configuration expects the frontend build at `/var/www/tournamentArena/frontend/dist` and Django on `127.0.0.1:8000`.

Build the application:

```bash
bash build_production.sh
```

For a server installation:

```bash
bash setup_server.sh
```

Nginx serves the React SPA and proxies backend paths. It includes history fallbacks so refreshing frontend routes such as `/my-rooms`, `/admin`, and `/tournaments/1` serves React instead of a backend HTML error page. Reload after configuration changes:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

The repository also includes `supervisor.conf`, Dockerfile files, and `k8s-helm-chart/` templates for alternative deployment strategies.

## Troubleshooting

### `No module named django`

Activate the backend virtual environment and run the command with its Python:

```bash
cd backend
source venv/bin/activate
python manage.py check
```

### `no such table: wallet_emailverification`

Apply migrations using the same environment that runs Django:

```bash
python manage.py migrate wallet
python manage.py showmigrations wallet
```

Confirm `wallet.0008` is marked `[X]`.

### Browser shows Django admin instead of the React admin page

Use `/admin`, not `/admin/login`. Restart Vite after proxy changes and use the production Nginx configuration when deployed.

### Email does not arrive

- Confirm `RESEND_API_KEY` is loaded from `backend/.env`.
- Confirm `RESEND_FROM_EMAIL` is permitted by Resend.
- Check the Django terminal for the Resend API error.
- Use the **Resend code** action on `/verify-email` for an existing unverified account.

### WebSocket chat does not connect

- Confirm the backend is running through Daphne/ASGI.
- Confirm Redis is running in production.
- Check that `/ws/` is configured for WebSocket upgrade headers in Nginx.
- In local development, use the Vite proxy and restart Vite after configuration changes.

## Security notes

- Never commit `.env` files or API keys.
- Rotate a Resend or Razorpay key immediately if it is exposed.
- Use a strong `DJANGO_SECRET_KEY` in production.
- Set `DJANGO_DEBUG=False` in production.
- Configure explicit `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
- PostgreSQL and Redis are recommended for production workloads.

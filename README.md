# Tournament Arena

Tournament Arena is a full-stack web application for managing online tournaments, player registrations, wallet payments, chat, and live gameplay coordination.

## Project structure

```text
TournamentArena/
├── backend/                  # Django REST API + WebSocket backend
│   ├── api/
│   ├── backend/
│   ├── chat/
│   ├── media/
│   ├── payments/
│   ├── tournaments/
│   ├── wallet/
│   ├── db.sqlite3
│   ├── manage.py
│   ├── requirements.txt
│   └── run_migrations.py
├── frontend/                 # React + Vite frontend
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
├── k8s-helm-chart/           # Kubernetes / Helm deployment files
├── build_production.sh       # Production build and config script
├── fix_static_files.sh       # Static file fix helper
├── nginx.conf                # Nginx reverse proxy config
├── setup_server.sh           # Ubuntu server setup script
├── start_frontend.sh         # Frontend startup helper
├── supervisor.conf           # Supervisor service config
├── Makefile                  # Local dev and deployment commands
├── .gitignore
└── README.md
```

## Tech stack

- Backend: Django, Django REST Framework, Channels, SQLite by default
- Frontend: React, Vite, React Router
- Real-time features: Django Channels + WebSockets
- Payments: Razorpay integration
- Deployment helpers: Nginx, Supervisor, Docker/Kubernetes assets

## Local development

### 1) Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

The frontend is configured to proxy API and WebSocket requests to the Django backend running on `http://localhost:8000`.

## Useful commands

From the project root:

```bash
make help
make install-backend
make install-frontend
make dev-backend
make dev-frontend
make migrate
make collectstatic
make build-frontend
make clean
```

## Production build

```bash
bash build_production.sh
```

This script prepares the backend environment, creates the frontend production build, and outputs deployment guidance for a server environment.

## Deployment assets

- `nginx.conf`: Nginx proxy setup for serving the app
- `supervisor.conf`: service registration for the Django app
- `k8s-helm-chart/`: Helm chart configuration for Kubernetes deployments
- `setup_server.sh`: initial Ubuntu server installation steps

## Notes

- The default backend database is SQLite for local development.
- Production environment variables such as `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and Redis connection settings should be configured as needed.
- Static files are handled with WhiteNoise in Django.

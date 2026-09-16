# AWS EC2 deployment

## Why `/api/login/` returned 405

The frontend container was serving the React files only. When the frontend
called the relative URL `/api/login/`, its Nginx server handled the request
itself and rejected the `POST` with `405 Not Allowed`; the request never
reached Django.

The frontend Nginx configuration now proxies `/api/`, `/wallet/`,
`/tournaments/`, `/hostpartner/`, `/payments/`, `/chat/`, `/admin/`, and
`/ws/` to the backend on port `8000`. The frontend can therefore use
same-origin URLs and does not need the browser to connect directly to port
8000.

## Rebuild and run on EC2

Run these commands from the project directory on the EC2 instance. Replace
`YOUR_EC2_PUBLIC_IP` with the instance public IP or, preferably, your domain.

```bash
# Build the updated frontend image.
docker build -t ta-preprod-frontend ./frontend

# Replace only the frontend container. Keep the existing backend container
# and its database intact.
docker stop ta-preprod-fro 2>/dev/null || true
docker rm ta-preprod-fro 2>/dev/null || true
docker run -d \
  --name ta-preprod-fro \
  --restart unless-stopped \
  --add-host host.docker.internal:host-gateway \
  -p 80:80 \
  ta-preprod-frontend
```

`--add-host host.docker.internal:host-gateway` is required on Linux/EC2 so
the frontend container can reach the backend port published on the EC2 host.
Docker Desktop usually provides this hostname automatically.

The backend container must already be running and publishing port `8000`
(your current `ta-preprod` container does this). If you need to recreate the
backend, back up `backend/db.sqlite3` and `backend/media/` first and mount
those paths as Docker volumes; removing a container without a volume can
remove its application data.

If port 80 is already used, map another host port temporarily, for example
`-p 5173:80`, and open that port in the EC2 security group. For normal
production traffic, use port 80/443 behind a domain.

## Environment variables

The backend container must have a production `backend/.env`, including at
least:

```env
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_ALLOWED_HOSTS=YOUR_EC2_PUBLIC_IP,your-domain.com
CORS_ALLOWED_ORIGINS=http://YOUR_EC2_PUBLIC_IP,https://your-domain.com
```

Keep payment, email, database, and Redis credentials in this file or in
AWS Secrets Manager; do not commit them.

Because the frontend now uses same-origin requests, leave
`VITE_API_BASE_URL` empty or unset for this Docker image. If the frontend is
served from a separate domain, rebuild it with that backend URL instead:

```bash
cd frontend
VITE_API_BASE_URL=https://api.your-domain.com npm run build
```

## Verify the deployment

Check that both containers are running:

```bash
docker ps
docker logs --tail 100 ta-preprod
docker logs --tail 100 ta-preprod-fro
```

From the EC2 host, verify Django directly:

```bash
curl -i http://127.0.0.1:8000/api/login/
```

The endpoint should no longer be served by the frontend Nginx. A `405` from
Django for a `GET` is expected because login accepts `POST`; the important
check is that the response is Django JSON rather than an Nginx HTML page.
Finally open the frontend URL and submit the login form. The browser request
should be `POST /api/login/` on the frontend host and return Django JSON.

## HTTPS

For production HTTPS, put an EC2 host-level Nginx or an AWS Application Load
Balancer in front of the frontend container, configure a certificate with
Let's Encrypt or ACM, and use `https://your-domain.com`. WebSockets must be
forwarded with upgrade headers; the included frontend Nginx configuration
already forwards `/ws/` with those headers.

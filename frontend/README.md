# Tournament Arena frontend

The frontend is the React/Vite single-page application for Tournament Arena.
It provides tournament discovery, registration, wallet, team, profile,
administration, and room-management workflows.

## Development

From this directory:

```bash
npm install
npm run dev
```

The Vite server runs on `http://localhost:5173`. During local development it
proxies `/api`, `/wallet`, `/tournaments`, `/payments`, `/chat`, `/admin`, and
`/ws` to the Django backend. Use `npm run build` for a production bundle and
`npm run lint` for the frontend lint check.

## Important routes

- `/`: tournament discovery
- `/my-rooms`: rooms joined or created by the signed-in user
- `/team-waiting/:roomId`: team invitations and split-payment progress
- `/wallet`: balance, deposits, withdrawals, and transactions
- `/admin`: protected tournament and payment administration

## My Rooms

`src/pages/MyRooms.jsx` loads the authenticated user's rooms and opens a
responsive room details view. The view includes:

- room status, capacity, available slots, countdown, payment state, and entry
  fee
- participant and team information, including game IDs and pending invitations
- persisted room-message history plus live WebSocket chat
- admin announcements and, for authorized managers, team removal
- result viewing for participants and winner declaration with wallet payout for
  administrators

The backend remains authoritative for room membership, permissions, result
creation, and payouts. The frontend only presents those states and sends
authenticated requests through the configured API base URL.

## Environment

Create `.env` only when the frontend is not using the Vite proxy:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/
```

Never commit credentials or tokens in frontend environment files.

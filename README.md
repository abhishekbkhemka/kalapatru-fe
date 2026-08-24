# Kalapatru Frontend

React + Vite SPA (separate from the Django API).

## Quick start with Docker

From the **backend** repo (`../kalapatru`):

```bash
docker compose up --build
```

Then open http://localhost:5173 — login `admin` / `admin123`.

## Local npm (API already running)

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to your API (default `http://127.0.0.1:8000`).

## Roles

| Role | Access |
|------|--------|
| admin | Full access + user management |
| operator | Create/update forwarding notes & dispatches |
| viewer | Read-only |

Legacy AngularJS app is preserved under `_legacy/`.

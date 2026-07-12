# AssetFlow

> AssetFlow is an asset management web application (client + server) to track assets, allocations, audits, bookings, maintenance, notifications and reporting.

## Table of Contents
- Project overview
- Tech stack
- Repo structure
- Prerequisites
- Environment variables
- Setup (server and client)
- Database migrations & seed
- Running locally
- Build & deployment
- Tests
- Contributing
- License

## Project overview

AssetFlow is composed of two major parts:
- `client/` — frontend (Vite + React + TypeScript) providing UI pages and components.
- `server/` — backend (Node + TypeScript) providing REST APIs, real-time sockets, database access (Drizzle), jobs and uploads.

Key features
- Asset CRUD and details
- Allocations, bookings and maintenance flows
- Audit cycles and reporting
- Notifications and activity logs
- Authentication, roles and guards

## Tech stack
- Frontend: React, Vite, TypeScript, Tailwind / CSS tokens (see `client/`)
- Backend: Node.js, TypeScript, Drizzle ORM, PostgreSQL (migrations under `migrations/`)
- Real-time: Socket.io (or similar, see `server/config/socket.ts`)
- Storage: Local `uploads/` directory (or cloud in production)

## Repo structure

- `client/` — frontend app (Vite)
- `server/` — backend API, configs, migrations, seeds and jobs
- `uploads/` — runtime uploaded files (images, attachments)

Open the folders to explore pages and controllers.

## Prerequisites

- Node.js (recommended LTS, e.g. 18+)
- pnpm / npm / yarn (any package manager; examples below use `npm`)
- PostgreSQL (or the database configured in your `DATABASE_URL`)

## Environment variables

Create `.env` files for both `client/` and `server/` (if applicable). The server expects at least:

- `DATABASE_URL` — Postgres connection string
- `PORT` — server port (default 3000)
- `JWT_SECRET` — secret used for signing tokens
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` — SMTP credentials (optional)
- `NODE_ENV` — `development` | `production`
- `UPLOAD_DIR` — (optional) path for file uploads

Notes: Check `server/config/env.ts` for the exact variables used by this project and add any missing keys to your `.env`.

## Setup

From the repository root run install for client and server:

```bash
cd server
npm install

cd ../client
npm install
```

### Server setup

1. Copy or create `.env` in `server/` with the variables above.
2. Run database migrations (see your migration tooling). Common commands:

```bash
cd server
# run migrations (example)
npm run migrate
# or: pnpm run migrate
```

3. Seed test data (if available):

```bash
npm run seed
```

4. Start the development server:

```bash
npm run dev
```

### Client setup

1. Copy or create `.env` in `client/` if the app expects runtime config (see `vite.config.ts`).
2. Start the dev server:

```bash
cd client
npm run dev
```

Open the client URL shown by Vite (default `http://localhost:5173`) and ensure the server API is available.

## Database migrations & seeds

- Migrations are in the `migrations/` directory. Use your migration runner to apply them.
- If the project uses a Drizzle migration runner, follow the `server/package.json` scripts for exact commands.

## Running locally (summary)

- Start server: `cd server && npm run dev`
- Start client: `cd client && npm run dev`
- Run migrations: `cd server && npm run migrate`
- Seed DB: `cd server && npm run seed`

## Production build & deployment

- Client: `npm run build` inside `client/` then deploy the `dist/` to static host (Vercel, Netlify, S3).
- Server: build via TypeScript build script and run the compiled output with `node` or use PM2 / Docker.
- Consider configuring cloud storage for `uploads/` and environment secrets for mail and DB.

Example Docker (high level)

1. Build server image with Node and the compiled JS.
2. Build client static assets and copy to a static webserver image or serve via CDN.

## Tests

- If the repo includes tests, run them from the specific package:

```bash
cd server
npm test

cd ../client
npm test
```

See `package.json` files in each folder for exact scripts.

## Contributing

- Fork the repo, create a feature branch, implement, add tests, open a PR.
- Follow code style and linting rules present in the workspace.

## Troubleshooting

- If the server cannot connect to the DB, check `DATABASE_URL` and ensure Postgres is running.
- If uploads fail, ensure `uploads/` directory exists and is writable.
- Check logs in server console for stack traces and error details.

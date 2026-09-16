# Hotspot

Interactive hotspot/campaign builder — turn images into shoppable, clickable experiences with hotspots, lead capture, and analytics.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Konva (canvas editor), Recharts
- **Backend:** NestJS 11, Prisma 6, PostgreSQL 16, JWT auth
- **Tooling:** pnpm workspaces, Turborepo

## Project Structure

```
hotspot/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # NestJS backend
├── turbo.json        # Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- Node.js >= 18
- pnpm
- Docker (for PostgreSQL)

## Getting Started

1. Install dependencies:
   ```sh
   pnpm install
   ```

2. Start PostgreSQL:
   ```sh
   docker compose up -d
   ```

3. Set environment variables in `apps/api/.env`:
   ```
   DATABASE_URL="postgresql://hotspot:hotspot_password@localhost:5433/hotspot_db"
   DIRECT_URL="postgresql://hotspot:hotspot_password@localhost:5433/hotspot_db"
   JWT_SECRET="your-secret-key"
   ```

4. Run database migrations:
   ```sh
   pnpm db:push
   ```

5. Start development servers:
   ```sh
   pnpm dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm --filter @hotspot/web dev` | Frontend only |
| `pnpm --filter @hotspot/api dev` | Backend only |

## API Endpoints

All routes are prefixed with `/api`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /auth/register | Throttle | Register user |
| POST | /auth/login | Throttle | Login |
| CRUD | /campaigns | JWT | Manage campaigns |
| POST | /leads | Public | Capture leads |
| GET | /leads | JWT | List leads |
| POST | /analytics/:id/log | Public | Log events |
| GET | /analytics/:id | JWT | View analytics |
| CRUD | /domains | JWT | Manage custom domains |
| GET | /public/campaigns/:id | Public | Public campaign view |
| POST | /uploads | JWT | Upload files |

# Encore

Encore is a full-stack ticket booking system with three distinct portal experiences: customer, organiser, and admin. The architecture is designed around one durable PostgreSQL correctness boundary for seat holds and booking confirmation.

## Architecture decisions

- **PostgreSQL + Drizzle:** seat ownership, hold expiry, idempotent confirmations, and user accounts survive process restarts and Render sleep. A process timer is never used for correctness.
- **Nest guards + Next proxy:** Nest is the authoritative authorization boundary. Next 16's `proxy.ts` only provides fast optimistic redirects based on the presence of an auth cookie; it does not replace server-side authorization.
- **Short access + rotated refresh cookies:** the access JWT lasts 15 minutes; the refresh token is opaque, hashed in PostgreSQL, stored in an httpOnly cookie, and revoked on rotation/logout.
- **One API process:** keeps the free-tier footprint small. Realtime and durable jobs can be added without splitting the deployable process prematurely.

## Local setup

```bash
corepack enable
pnpm install
cp .env.example .env
# Start PostgreSQL, then:
docker compose up -d postgres
# If Docker Desktop is unavailable, create a Neon project and paste its pooled
# DATABASE_URL into .env instead.
pnpm --filter @encore/api db:generate
pnpm --filter @encore/api db:migrate
pnpm --filter @encore/api db:seed
pnpm dev
```

Customer: http://localhost:3000 · API: http://localhost:4000/api/health

Seed accounts use the explicitly configured `SEED_PASSWORD` for the admin and organiser addresses created by the seed command. The seed command refuses to run when it is missing; never commit the real value.

## Deployment

Deploy the web app to Vercel and the API to Render as one Node web service. Keep the repository root as the Render service root so the pnpm workspace lockfile is available. The checked-in `render.yaml` builds the API from the workspace and runs migrations before startup.

Set these Render variables: `DATABASE_URL`, `JWT_ACCESS_SECRET` (32+ random characters), `FRONTEND_URL`, and `NODE_ENV=production`. Set `NEXT_PUBLIC_API_URL` in Vercel. Run migrations as a controlled release step before enabling traffic. Render Free is suitable for a portfolio/pilot but sleeps after inactivity and has no production SLA; use a paid always-on instance for real ticket sales.

Before deployment, run:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
docker compose config
```

## Verification

`pnpm typecheck` and `pnpm build` are required before deployment. The core integration suite must cover concurrent holds (one winner), expired holds, idempotent confirmation, refresh rotation, role denial, and booking cancellation before calling the system production-ready.

# Hosted Application URLs

## Frontend (Vercel)
**URL:** `https://tickets.ajiteshsharma.dev`
*(Replace with your actual Vercel deployment URL once domain is live)*

Alternatively, the Vercel auto-generated URL:
**URL:** `https://encore-ticket-booking.vercel.app`
*(Replace with your actual .vercel.app URL from the Vercel dashboard)*

---

## Backend API (Render)
**URL:** `https://<your-render-service>.onrender.com`
*(Replace with your actual Render Web Service URL)*

**Health Check Endpoint:**
`GET https://<your-render-service>.onrender.com/api/health`

Expected response:
```json
{ "status": "ok", "service": "encore-api", "database": true }
```

---

## GitHub Repository
**URL:** `https://github.com/AJ1312/encore-ticket-booking`

---

## Demo Credentials (for evaluators)

| Role       | Email                    | Password          |
|------------|--------------------------|-------------------|
| Admin      | admin@encore.local       | SeedPassword123!  |
| Organiser  | organiser@encore.local   | SeedPassword123!  |
| Customer   | customer@encore.local    | SeedPassword123!  |

> Note: These accounts are seeded by running `pnpm --filter @encore/api db:seed`

# Hosted Application URLs

## Frontend
**Live URL:** https://tickets.ajiteshsharma.dev
**DNS:** Cloudflare (DNS-only, grey cloud) → Vercel for SSL and CDN delivery

## Backend API
**URL:** https://encore-ticket-booking.onrender.com
**Health Check:** https://encore-ticket-booking.onrender.com/api/health

## Job Queue
**BullMQ + Upstash Redis (serverless):** Active
Background workers for hold expiry, waitlist allocation, and email dispatch are coordinated via Upstash Redis on BullMQ.

## GitHub Repository
**URL:** https://github.com/AJ1312/encore-ticket-booking

---

## Infrastructure Stack

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | Vercel | Next.js 15, global CDN |
| DNS & Security | Cloudflare | DDoS protection, DNS-only mode |
| Backend API | Render | NestJS, free tier, auto-deploy from GitHub |
| Database | Neon (PostgreSQL) | Serverless, SSL, connection pooling |
| Job Queue | Upstash Redis + BullMQ | Serverless Redis, no always-on cost |
| Email | Resend | Transactional emails for booking confirmation |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@encore.local | SeedPassword123! |
| Organiser | organiser@encore.local | SeedPassword123! |
| Customer | customer@encore.local | SeedPassword123! |

> Seeded via: `pnpm --filter @encore/api db:seed`

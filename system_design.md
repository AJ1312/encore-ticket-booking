# System Design Write-Up
## Encore — Ticket Booking Platform

**Ajitesh Sharma**
VIT Vellore · Batch 2023 · Passout 2027
Computer Science & Engineering — Information Security
**Project: Ticket Booking**

---

## 1. Architecture Overview

The system is split into three deployment tiers, each independently scaled:

```
  Browser (Next.js 15 / Vercel CDN)
        │  HTTPS + Bearer JWT
  Backend API (NestJS / Render)
  Auth · Seats · Bookings · Waitlist · Jobs
        │  Drizzle ORM + SQL
  PostgreSQL (Neon — serverless)
        │
  Upstash Redis ← BullMQ job queue
```

**DNS layer:** The domain `tickets.ajiteshsharma.dev` is managed on Cloudflare with DNS-only mode (grey cloud). Cloudflare provides DDoS protection and DNS resolution speed, while Vercel handles SSL termination and CDN delivery at the edge.

The frontend talks to the Render backend exclusively over HTTPS with short-lived JWT Bearer tokens. No cookies are used for cross-origin auth — this sidesteps Safari and Firefox cross-site cookie blocking entirely.

---

## 2. Seat Hold & TTL Mechanism

The core challenge: a user picks seats and starts checkout, but might abandon the tab. Those seats can't be locked forever — but they also can't be sold to someone else mid-checkout.

When a user selects seats, the API runs a single **atomic Postgres transaction**:

```
POST /api/shows/:showId/hold
  │
  ├─ SELECT seat WHERE status = 'available' FOR UPDATE
  ├─ UPDATE show_seats SET
  │    status       = 'held'
  │    heldByUserId = <userId>
  │    heldUntil    = NOW() + INTERVAL '15 min'   ← the TTL
  │    version      = version + 1
  └─ INSERT INTO holds (userId, seatIds, heldUntil)

API returns: { holdId, heldUntil }
Frontend starts: 15:00 countdown
```

Every subsequent checkout step — payment intent, discount, confirmation — checks the server timestamp against `heldUntil`. If expired, the API returns **HTTP 409 Conflict** immediately. No sweep needed; the TTL enforces itself per-request.

---

## 3. Concurrency Prevention

**The double-booking problem:** Two users click Book on the same seat at the same millisecond. A simple SELECT + UPDATE would let both through.

**Solution — Optimistic Concurrency Control (OCC):**

Every seat row has a `version` integer. The hold UPDATE is conditional:

```sql
UPDATE show_seats
SET    status = 'held', version = version + 1, ...
WHERE  id      = $seatId
  AND  status  = 'available'
  AND  version = $clientVersion   -- stale = 0 rows updated = fail
```

If User B's request arrives after User A already incremented `version`, User B's WHERE clause matches zero rows. The transaction is aborted and User B gets an immediate 409 — seat gone. One seat, one winner, always.

**For queue operations (waitlist):** `SELECT … FOR UPDATE SKIP LOCKED` lets multiple BullMQ workers process different waitlist entries in parallel without blocking each other.

---

## 4. Waitlist Auto-Assignment Flow

When a show sells out, users join the FIFO (first-in, first-out) waitlist. The BullMQ background worker handles allocation automatically when a held seat expires:

```
Hold TTL expires
      │
BullMQ worker picks up release_expired_holds job
      │
  ┌── TRANSACTION ─────────────────────────────────┐
  │  Reset show_seats → available                  │
  │  Cancel holds record                           │
  └────────────────────────────────────────────────┘
      │
  Check waitlist_entries for this show + category
  ORDER BY createdAt ASC  (FIFO)
  FOR UPDATE SKIP LOCKED
      │
  Found?
  YES ──► Assign new 15-min hold directly to user
          Update entry → status: 'offered'
          offerExpiresAt = NOW() + 15 min
          Dispatch email via Resend API
  NO  ──► Seat returns to public pool
```

The key design choice: freed seats **bypass the public pool** and go directly to the next person in line. The general booking flow never sees the seat until the waitlist is exhausted.

---

## 5. Time-Limited Offer Handling

Once offered, the waitlisted user has 15 minutes — enforced by the same TTL logic as regular holds. If ignored, the BullMQ worker's next cycle detects `offerExpiresAt <= NOW()`, marks the entry expired, and runs allocation again for the next person. This loop repeats until the waitlist is empty.

**Worker scheduling (self-sustaining):**

```
App starts → INSERT 'release_expired_holds' job into Postgres jobs table
                │
         BullMQ pulls job from Upstash Redis every 30s
                │
         After completing → schedule next run 30s later
                │
         No cron daemon, no external scheduler — self-rescheduling
```

---

## 6. Security

| Mechanism | Detail |
|-----------|--------|
| JWT Auth | HS256, 7-day access tokens, refresh-token rotation |
| Passwords | Argon2id — memory-hard, GPU-resistant |
| DNS | Cloudflare — DDoS protection, fast resolution |
| CORS | Whitelist: Vercel + ajiteshsharma.dev only |
| Rate limiting | NestJS Throttler — 100 req/60s per IP |
| SQL safety | Drizzle ORM parameterised queries — no injection risk |
| HTTP headers | Helmet middleware — XSS, MIME, clickjack protection |

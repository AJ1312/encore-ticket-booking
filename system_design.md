# System Design Write-Up
## Encore — Ticket Booking Platform

**AJITESH SHARMA**  
VIT Vellore · Batch 2023 · Passout 2027  
Computer Science & Engineering — Specialisation in Information Security  
**Project Title: Ticket Booking**

---

## 1. Architecture Overview

Encore is a full-stack, high-concurrency ticket booking platform. The system is split into three independently deployed layers:

```
┌─────────────────────────────────────────────────────────┐
│  USER BROWSER                                           │
│  Next.js 15 (React) — Vercel CDN                        │
└────────────────────┬────────────────────────────────────┘
                     │  HTTPS / Bearer JWT
┌────────────────────▼────────────────────────────────────┐
│  BACKEND API                                            │
│  NestJS (Node.js) — Render                              │
│  Auth · Seats · Bookings · Payments · Waitlist · Jobs   │
└────────────────────┬────────────────────────────────────┘
                     │  Drizzle ORM / SQL
┌────────────────────▼────────────────────────────────────┐
│  DATABASE                                               │
│  PostgreSQL (Neon) — Serverless, SSL                    │
│  Persistent state for all business logic                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Seat Hold & TTL Mechanism

When a user picks seats, the system must temporarily reserve them while the user completes payment — without permanently blocking the seat if they abandon checkout.

**Flow:**

```
User selects seats
       │
       ▼
POST /shows/:id/hold
       │
       ▼
┌──────────────────────────────────┐
│  ATOMIC DB TRANSACTION           │
│                                  │
│  SELECT seat WHERE status =      │
│  'available' FOR UPDATE          │
│  ── verifies seat is free        │
│                                  │
│  UPDATE show_seats SET           │
│    status = 'held',              │
│    heldByUserId = user.id,       │
│    heldUntil = NOW() + 15min,    │
│    version = version + 1         │
│                                  │
│  INSERT into holds (session)     │
└──────────────────────────────────┘
       │
       ▼
 User has 15-minute countdown
 to complete payment
```

The `heldUntil` timestamp is the **TTL (Time-To-Live)**. Every subsequent API call during checkout validates the TTL server-side. If the clock runs out before payment, the API returns `409 Conflict` and the cart is dead — no database sweep needed.

---

## 3. Concurrency Prevention

The core challenge: two users clicking "Book" on the same seat at the exact same millisecond. Encore solves this with two layers:

**Layer 1 — Optimistic Concurrency Control (OCC):**  
Every seat row has a `version` integer. The hold update is conditional:

```sql
UPDATE show_seats
SET    status = 'held', version = version + 1, ...
WHERE  id = $seatId
  AND  status = 'available'
  AND  version = $expectedVersion   -- fails if anyone beat you
```

If another user modified the row first, `version` no longer matches, the `WHERE` clause hits zero rows, and the transaction fails cleanly. One user wins, the other gets an instant error and is told the seat is gone.

**Layer 2 — Pessimistic Lock for Queue Operations:**  
For waitlist allocation (more sensitive), the system uses `SELECT ... FOR UPDATE SKIP LOCKED`. This lets multiple background workers scan for pending waitlist entries simultaneously without blocking each other, ensuring high throughput even under load.

---

## 4. Waitlist Auto-Assignment Flow

When a show sells out, users can join the waitlist. This operates as a strict **FIFO queue** (first-in, first-out):

```
Seat hold expires (15 min TTL)
           │
           ▼
Background Worker triggers
release_expired_holds job
           │
           ▼
   ┌───────────────────┐
   │  Any waitlisted   │
   │  users for this   │◄── FIFO: earliest joiner wins
   │  seat category?   │
   └───────┬───────────┘
           │ YES
           ▼
Assign 15-min hold directly to
waitlisted user (skips public pool)
           │
           ▼
Update waitlist entry → 'offered'
Set offerExpiresAt = NOW() + 15min
           │
           ▼
Dispatch email via Resend API:
"You have 15 minutes to claim
your ticket!"
           │
     ┌─────┴──────┐
     │            │
  User        User ignores
  checks out  (offer expires)
     │            │
  Booking      Cycle repeats →
  confirmed    next person in queue
```

---

## 5. Time-Limited Offer Handling

The waitlist offer uses the exact same TTL engine as the seat hold. The background worker runs every 30 seconds and checks:

- `show_seats` for seats past `heldUntil` → releases them
- `waitlist_entries` for entries past `offerExpiresAt` → marks as `expired`

This creates a **self-healing loop**: abandoned offers automatically cascade down the queue to the next person, with zero manual intervention from organisers.

**Job Queue Architecture:**

```
Bootstrap → INSERT 'release_expired_holds' job
                │
         Background Worker (polls every 30s)
                │
         ┌──────▼──────────────────────┐
         │  Claim job FOR UPDATE       │
         │  SKIP LOCKED (safe multi-  │
         │  worker concurrency)        │
         └──────┬──────────────────────┘
                │
         Execute job → re-schedule
         next run 30s later
```

---

## 6. Security Highlights

- All API routes require **JWT Bearer tokens** (7-day expiry, HS256)
- Passwords hashed with **Argon2id** (memory-hard, timing-safe)
- **CORS** restricted to whitelisted origins only
- **Throttler** guard prevents brute-force attacks
- All DB queries use **parameterised statements** via Drizzle ORM — no SQL injection risk

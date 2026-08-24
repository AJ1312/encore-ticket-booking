# Encore Ticket Booking System

Encore is a high-performance, resilient ticket booking platform designed for high-concurrency environments. It solves the critical "FairHold" problem—preventing double-bookings when thousands of users attempt to book the exact same seat simultaneously, while strictly enforcing hold expirations, waitlist auto-allocations, and robust payments.

## Application URLs
- **Live Site**: [https://tickets.ajiteshsharma.dev](https://tickets.ajiteshsharma.dev)
- **Backend API (Health Check)**: [https://encore-ticket-booking.onrender.com/api/health](https://encore-ticket-booking.onrender.com/api/health)

---

## 🚀 Setup Guide

### Prerequisites
- Node.js (v22+)
- pnpm (v10+)
- PostgreSQL (Local, Neon, Render, or Supabase)

### 1. Install Dependencies
This project uses a monorepo structure managed by pnpm.
```bash
pnpm install
```

### 2. Environment Configuration
Copy the example environment file and configure it:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` is correctly pointed to your PostgreSQL instance and `JWT_ACCESS_SECRET` is at least 32 characters long.

### 3. Database Migration and Seeding
Run the database migrations and seed it with demo data (events, venues, demo users):
```bash
pnpm --filter @encore/api db:migrate
pnpm --filter @encore/api db:seed
```

### 4. Start the Application
Start both the Next.js frontend and NestJS backend concurrently:
```bash
pnpm dev
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🛠 Database Schema Overview

The architecture utilizes a highly normalized PostgreSQL database using Drizzle ORM:
- **`users`**: Contains authentication and role data (Admin, Organiser, Customer).
- **`venues` & `seats`**: Stores physical layouts, categories (e.g., VIP, General), and geographical locations.
- **`events` & `shows`**: Master events and individual time-bound occurrences (shows).
- **`show_seats`**: State engine for tickets. Tracks `available`, `held`, or `booked` statuses mapped to a specific user and TTL (Time-to-Live). Uses optimistic concurrency control (`version` column).
- **`holds`**: Tracks active cart sessions.
- **`bookings` & `payments`**: Financial and ownership tracking for finalized passes.
- **`waitlist_entries`**: FIFO queue mapping customers to specific shows and seat categories.
- **`jobs`**: Asynchronous task queue tracking background worker jobs.

---

## 🧠 Core System Logic & Explanations

### Seat Hold Mechanism & TTL
When a user selects a seat, the system creates a **15-minute cryptographically secure hold**:
1. **Pessimistic Lock & Versioning**: The `show_seats` table is updated atomically. The seat's `status` changes from `available` to `held`, assigning the `heldByUserId` and `heldUntil` (current time + 15 mins).
2. **Time-to-Live (TTL)**: If checkout is not completed before `heldUntil`, the hold natively becomes invalid.
3. **Cart Binding**: A record in the `holds` table tracks the entire session, ensuring the user has ownership during checkout.

### Background Worker & Hold Release
Encore runs a resilient asynchronous worker (via BullMQ or a lightweight database poller) that routinely executes `release_expired_holds` jobs:
1. It queries `show_seats` where `heldUntil <= now()` and `status = 'held'`.
2. It resets these seats back to `available`.
3. It cancels the corresponding `holds`.
4. It immediately checks the `waitlist_entries` to see if a customer is queued for that exact seat category.

### Waitlist Auto-Assignment Flow
The waitlist operates on a strict **FIFO (First-In, First-Out)** basis natively inside the database transaction:
1. When a seat becomes available (via hold expiration or booking cancellation), the worker queries the oldest `waiting` user in the `waitlist_entries` table for that specific show and category.
2. If found, the system *automatically* places a new 15-minute hold on the seat for that waitlisted user.
3. The waitlist entry is updated to `offered` and assigned a TTL (`offerExpiresAt`).
4. An automated email (via Resend) is dispatched informing the user they have 15 minutes to claim their tickets. If they fail to checkout, the cycle repeats.

---

## 📖 API Documentation (Key Endpoints)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register a new customer | No |
| `POST` | `/api/auth/login` | Authenticate and receive JWT session | No |
| `GET`  | `/api/shows/:showId/seats` | Retrieve realtime seat availability matrix | No |
| `POST` | `/api/shows/:showId/hold` | Atomically reserve seats (15 min TTL) | Yes |
| `POST` | `/api/shows/:showId/payment-intent` | Finalize hold and generate payment context | Yes |
| `POST` | `/api/bookings/confirm` | Confirm payment and issue ticket pass | Yes |
| `POST` | `/api/waitlist` | Join the FIFO waitlist for a sold-out category | Yes |

*Note: All authenticated endpoints require a `Bearer <token>` header.*

# Core System Logic & Explanations

## Seat Hold Mechanism & TTL
When a user selects a seat, the system creates a **15-minute cryptographically secure hold**:
1. **Pessimistic Lock & Versioning**: The `show_seats` table is updated atomically. The seat's `status` changes from `available` to `held`, assigning the `heldByUserId` and `heldUntil` (current time + 15 mins).
2. **Time-to-Live (TTL)**: If checkout is not completed before `heldUntil`, the hold natively becomes invalid.
3. **Cart Binding**: A record in the `holds` table tracks the entire session, ensuring the user has ownership during checkout.

## Background Worker & Hold Release
Encore runs a resilient asynchronous worker (via BullMQ or a lightweight database poller) that routinely executes `release_expired_holds` jobs:
1. It queries `show_seats` where `heldUntil <= now()` and `status = 'held'`.
2. It resets these seats back to `available`.
3. It cancels the corresponding `holds`.
4. It immediately checks the `waitlist_entries` to see if a customer is queued for that exact seat category.

## Waitlist Auto-Assignment Flow
The waitlist operates on a strict **FIFO (First-In, First-Out)** basis natively inside the database transaction:
1. When a seat becomes available (via hold expiration or booking cancellation), the worker queries the oldest `waiting` user in the `waitlist_entries` table for that specific show and category.
2. If found, the system *automatically* places a new 15-minute hold on the seat for that waitlisted user.
3. The waitlist entry is updated to `offered` and assigned a TTL (`offerExpiresAt`).
4. An automated email (via Resend) is dispatched informing the user they have 15 minutes to claim their tickets. If they fail to checkout, the cycle repeats.

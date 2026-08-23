# Database Schema Overview

The architecture utilizes a highly normalized PostgreSQL database using Drizzle ORM:

- **`users`**: Contains authentication and role data (Admin, Organiser, Customer).
- **`venues` & `seats`**: Stores physical layouts, categories (e.g., VIP, General), and geographical locations.
- **`events` & `shows`**: Master events and individual time-bound occurrences (shows).
- **`show_seats`**: State engine for tickets. Tracks `available`, `held`, or `booked` statuses mapped to a specific user and TTL (Time-to-Live). Uses optimistic concurrency control (`version` column).
- **`holds`**: Tracks active cart sessions.
- **`bookings` & `payments`**: Financial and ownership tracking for finalized passes.
- **`waitlist_entries`**: FIFO queue mapping customers to specific shows and seat categories.
- **`jobs`**: Asynchronous task queue tracking background worker jobs.

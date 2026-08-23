# API Documentation (Key Endpoints)

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

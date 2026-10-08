# ReachInbox Hiring Assignment - Full-stack Email Job Scheduler

## Architecture Overview

This project is a robust, production-ready email scheduler.

- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (via Prisma ORM) for persistence across server restarts.
- **Queue System**: BullMQ backed by Redis for reliable job scheduling. BullMQ strictly uses Redis to manage delayed jobs, avoiding OS-level cron.
- **Search**: Elasticsearch for indexing and fast searching of scheduled and sent emails.
- **Email Delivery**: Nodemailer configured with Ethereal Email (Mock SMTP).
- **Frontend**: Next.js (App Router) + Tailwind CSS with Google OAuth via NextAuth.

### How Scheduling Works
When a user schedules a campaign, the backend creates `EmailJob` records in PostgreSQL with `status: PENDING`. Simultaneously, it enqueues these jobs into BullMQ with a calculated delay (time until scheduled time + cumulative delay for individual emails). BullMQ stores this queue in Redis and natively handles delayed processing.

### How Persistence is Handled
Since BullMQ data is backed by Redis (and optionally configured with append-only files for durability), and jobs are stored in PostgreSQL, any server restart will not lose data. When the worker starts again, BullMQ automatically resumes processing the queue where it left off, and PostgreSQL ensures we have a permanent record of all job statuses.

### Rate Limiting & Concurrency
- **Concurrency**: The BullMQ worker is instantiated with a `concurrency` setting (default: 5), allowing it to process multiple jobs in parallel.
- **Rate Limiting (Per Sender)**: Enforced via Redis atomic counters keyed by `rate_limit:{senderId}:{hour_window}`. When a worker picks up a job, it increments the counter. If the count exceeds the `hourlyLimit` set for that campaign, the worker automatically delays the job to the next available hour window using BullMQ's `job.moveToDelayed()` and throws a `DelayedError()`. This prevents the job from failing while safely moving it to a future time, preserving order.
- **Minimum Delay**: Implemented using a sleep block within the worker for the specified `delaySeconds`. Since the worker has high concurrency, it handles the delay without severely blocking the global queue processing rate.
- **Slack Notification**: If a rate limit is hit, the worker checks if a notification has already been sent for the current hour window (via Redis). If not, it fires a webhook to the user's connected Slack account.

## How to Run the Project

### Prerequisites
- Docker & Docker Compose
- Node.js v18+

### 1. Start Infrastructure (PostgreSQL, Redis, Elasticsearch)
```bash
docker compose up -d
```

### 2. Setup Backend
1. Navigate to `backend` folder: `cd backend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` (or use the created `.env`) and adjust configurations.
4. Run DB migrations: `npx prisma migrate dev --name init`
5. Generate Prisma Client: `npx prisma generate`
6. Start backend: `npm run dev` (Ensure `ts-node-dev` or `nodemon` is setup, or just run `npx ts-node src/index.ts`)

### 3. Setup Frontend
1. Navigate to `frontend` folder: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env.local` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=super-secret-key
   NEXT_PUBLIC_API_URL=http://localhost:3001
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
4. Start frontend: `npm run dev`

### 4. Ethereal Email Setup
The backend automatically creates a dynamic Ethereal Email test account upon the first email sent if you don't provide explicit `SMTP_USER` and `SMTP_PASS` in the backend `.env`. Look at the backend console logs to see the generated credentials and a link to view the mocked inbox.

## Features Implemented
### Backend
✅ API to schedule emails
✅ Persistent PostgreSQL Database via Prisma
✅ BullMQ Delayed Jobs (No Cron)
✅ Ethereal Email Integration
✅ Elasticsearch Indexing for searchability
✅ Live BullMQ Dashboard (`http://localhost:3001/admin/queues`)
✅ Restart-safe persistence
✅ Worker Concurrency Configuration
✅ Configurable minimum delay between individual emails
✅ Configurable rate limits per hour per sender (using Redis atomic counters)
✅ Job delaying/rescheduling into next hour upon limit hit
✅ Slack Webhook Notification when limit is hit

### Frontend
✅ Google OAuth Login (NextAuth)
✅ Dashboard with 'Scheduled' and 'Sent' tabs
✅ Compose Email Modal
✅ CSV Lead Upload & Parsing
✅ Scheduling configurations (Start Time, Delay, Hourly Limit)
✅ Premium, dynamic UI matching best practices with modern dark-mode aesthetics.

## Trade-offs & Assumptions
- **Slack OAuth**: A full Slack OAuth requires a registered Slack App with valid redirect URIs. For this assignment, we simulated the connection by accepting a Webhook URL that the user provides, which allows for live verifiable testing immediately without configuring a Slack App.
- **Search**: For simplicity, a basic wildcard search is implemented with Elasticsearch.
- **NextAuth ID**: The frontend uses the user's email as the unique identifier (`senderId`) to communicate with the backend, simplifying state management.

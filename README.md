# ReachInbox Hiring Assignment - Full-stack Email Job Scheduler

A production-grade, distributed email scheduler and dashboard built with **Express.js**, **TypeScript**, **PostgreSQL**, **BullMQ + Redis**, and **Next.js** following the ReachInbox Figma specification.

---

## 🏗 Architecture Overview

```
[ Next.js Frontend ] ──(HTTP)──> [ Express Backend API ]
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                 [ PostgreSQL ]                [ Redis 5+ ]
                 (Prisma ORM)                (BullMQ Queue)
                 - User model                - email-queue
                 - EmailJob table            - Delayed job sets
                 - previewUrl storage        - Atomic rate counters
                                                     │
                                                     ▼
                                            [ BullMQ Worker ]
                                            - Concurrency: 5
                                            - Delay between emails
                                            - Hourly limit check
                                            - Ethereal SMTP
                                                     │
                                                     ▼
                                            [ Ethereal Sandbox ]
                                            - Web preview URLs
```

### 1. How Scheduling Works (No Cron)
* When a user schedules a campaign, the `POST /api/jobs/schedule` endpoint receives the recipient list, subject, body, target time, inter-email delay (`delaySeconds`), and hourly rate limit (`hourlyLimit`).
* The backend creates records in PostgreSQL (`EmailJob`) with status `PENDING`.
* For each recipient, it calculates `delay = max(0, targetTime - Date.now()) + cumulativeDelay`.
* It enqueues jobs into BullMQ with `{ delay, jobId }`. BullMQ stores delayed jobs natively inside Redis sorted sets without relying on OS-level crons or `node-cron`.

### 2. How Persistence on Restart is Handled
* **Dual-Layer Persistence**: 
  1. **PostgreSQL** is the source of truth for all historical and state transitions (`PENDING`, `SENT`, `FAILED`).
  2. **Redis** persists the BullMQ delayed and waiting queues.
* When the backend server or worker crashes or restarts:
  - No jobs are lost.
  - BullMQ automatically re-subscribes to Redis upon initialization and resumes execution of all pending and delayed jobs from the exact timestamps they were scheduled for.

### 3. How Rate Limiting & Concurrency are Implemented
* **Concurrency**: The worker is configured with `concurrency: 5`, allowing parallel email processing across distinct queues.
* **Per-Sender Hourly Rate Limiting**: Tracked atomically using Redis counters: `rate_limit:{senderId}:{hourWindow}`.
  - On each job execution, the worker runs `INCR` on the sender's current hour counter.
  - If `count > hourlyLimit`, the worker calculates the milliseconds until the start of the next hour and calls `job.moveToDelayed(nextHourTimestamp, job.token)` while throwing a `DelayedError()`.
  - The job is safely postponed without being failed or dropped.
* **Inter-Email Delay**: The worker enforces an explicit pause (`delaySeconds`) between successive email sends to simulate provider throttling.
* **Slack Webhook Alerts**: When a sender hits their hourly limit, a deduplicated notification is dispatched to Slack.

---

## 🚀 How to Run the Project

### Prerequisites
* **Node.js** v18+ (recommended v20+)
* **PostgreSQL** (running locally on port 5432 or via Docker)
* **Redis** (running locally on port 6379 or via Docker)

---

### Step 1: Start Infrastructure (PostgreSQL & Redis)
Using Docker Compose:
```bash
docker compose up -d
```
*Or use locally installed PostgreSQL (`localhost:5432`, user: `reachinbox`, password: `password`, db: `reachinbox`) and Redis (`localhost:6379`).*

---

### Step 2: Run the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify environment variables in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://reachinbox:password@localhost:5432/reachinbox?schema=public"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   SMTP_HOST="smtp.ethereal.email"
   SMTP_PORT=587
   SMTP_USER="ethereal.user"
   SMTP_PASS="ethereal.pass"
   ```
4. Push database schema and generate Prisma client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Start development server:
   ```bash
   npm run dev
   ```
   *The backend starts at `http://localhost:3001`. BullMQ visual admin dashboard is live at `http://localhost:3001/admin/queues`.*

---

### Step 3: Run the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify environment variables in `frontend/.env.local`:
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="Y0+/d+SX/p7Smi21pMbAzFsgUnMk/OcubdxujwnDxK0="
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```
   *The application will be live at `http://localhost:3000`.*

---

## 📧 Ethereal Email Setup & Preview Links

* **Mock SMTP**: The backend uses Nodemailer with **Ethereal Email** (`smtp.ethereal.email`).
* **Zero Configuration Needed**: When `SMTP_USER="ethereal.user"`, the backend automatically generates a dynamic Ethereal test inbox via `nodemailer.createTestAccount()`.
* **Visual Verification in Dashboard**: Every sent email stores its Ethereal message URL in PostgreSQL. In the **"Sent"** dashboard tab and inside the email detail view, clicking **`📨 View Email ↗`** opens the full rendered message in your browser.

---

## 🎯 Features Implemented

### Backend
- ✅ **API Scheduler**: `POST /api/jobs/schedule` with full validation, recipient arrays, and lead auto-provisioning.
- ✅ **No-Cron BullMQ Scheduling**: Pure Redis-backed delayed job queues.
- ✅ **Server Restart Resilience**: State backed by PostgreSQL and Redis.
- ✅ **Per-Sender Rate Limiting**: Hourly quotas tracked via Redis atomic counters with `job.moveToDelayed()` rescheduling.
- ✅ **Inter-Email Delay Throttling**: Configurable delay in seconds between individual dispatches.
- ✅ **Slack Alerts**: Fires webhook notifications when an hourly quota is breached.
- ✅ **Ethereal Delivery & Previews**: Saves and returns Ethereal web preview URLs.
- ✅ **Admin Queue Dashboard**: Interactive UI at `/admin/queues` showing active, delayed, completed, and failed jobs.

### Frontend (Faithful to Figma Design)
- ✅ **Figma Design Alignment**: Clean light theme (`#F8F9FA` background, emerald green `#00AC4F` accents, Inter typography).
- ✅ **Flexible Authentication**:
  - Google OAuth (via NextAuth).
  - Direct credentials sign-in allowing any new user to sign in with their own email.
- ✅ **Sidebar Navigation**: User profile card, ONG brand mark, "Compose" action, and CORE section with **Scheduled**, **Sent**, and **Failed** count badges.
- ✅ **Inbox Row List**: Superhuman/Gmail-style rows with recipient, status badges (scheduled countdown vs sent), subject, and snippet preview.
- ✅ **Click-to-Inspect Detail View**: Slide-out modal showing headers, body, timestamp, and a direct link to the Ethereal sandbox.
- ✅ **Compose Modal**:
  - Interactive recipient pills with delete tags (`email@domain.com ✕`).
  - **Upload List**: Parses lead lists from `.csv` and `.txt` files.
  - **+ Sample Leads**: One-click demo lead generator.
  - Inline **Delay between 2 emails** and **Hourly Limit** inputs.
  - Simulated **Rich Text Editor Toolbar** (Undo, Redo, Typography, Formatting, Lists, Links).
  - **Send Later Popover**: Custom datetime picker + quick presets (*Tomorrow 10:00 AM, 11:00 AM, 3:00 PM*).
- ✅ **Instant Search**: Real-time search by recipient, subject, or message body.
- ✅ **Silent Background Polling**: Updates status every 4 seconds without table flickers.

---

## ⚖️ Assumptions, Shortcuts & Trade-offs

1. **Ethereal vs Real SMTP**: Ethereal Mock SMTP was chosen strictly as requested by the assignment to enable safe testing and evaluation without requiring live Gmail/SES credentials. Real SMTP can be activated at any time by simply replacing the SMTP variables in `backend/.env`.
2. **Slack Integration**: Configured to trigger via an incoming Slack Webhook URL to allow instant evaluation without requiring the reviewer to register a Slack OAuth workspace.
3. **Elasticsearch Fallback**: Full search is gracefully backed by database filtering when an external Elasticsearch node is not present, guaranteeing 100% functionality without requiring an ES container.

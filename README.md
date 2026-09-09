# Lab Workflow & Request Management

A system for **Aj. Milk's lab ("vase")** to track lab requests — submission, viewing, status tracking, and triage/closure — replacing the current mix of email threads, chat messages, and ad-hoc spreadsheets.

A web application for tracking laboratory requests, approvals, and processing status. The system allows users to submit requests, review current workloads, monitor status changes, and manage workflow progress for the lab team.

## Tech Stack

- Frontend: Next.js 16 + React 19
- Backend: Express.js + Prisma ORM
- Database: MySQL 8
- Containerization: Docker Compose

## Project Structure

```text
.
├── README.md
├── docs/
├── source/
│   ├── docker-compose.yml
│   ├── backend/
│   │   ├── index.js
│   │   ├── package.json
│   │   ├── prisma/
│   │   ├── routes/
│   │   └── .env.example
│   └── frontend/
│       ├── app/
│       ├── hooks/
│       └── package.json
```

## Prerequisites

Before starting, make sure you have the following installed:

- Node.js 20 or later
- npm
- Docker Desktop or Docker Engine
- Docker Compose
- Git

## Local Development Setup

### 1) Clone the repository

```bash
git clone <repository-url>
cd Sonny-boy-Lab-Workflow-Request-Management
```

### 2) Install dependencies

Install dependencies for both the backend and frontend:

```bash
cd source/backend
npm install

cd ../frontend
npm install
```

### 3) Configure environment variables

Create the backend environment file:

```bash
cd ../backend
cp .env.example .env
```

Update the values in `.env` to match your local setup:

```env
DATABASE_USER="user"
DATABASE_PASSWORD="password"
DATABASE_NAME="mydb"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
JWT_SECRET=some-long-random-string
```

For the frontend, create a local environment file if needed:

```bash
cd ../frontend
cp .env.example .env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5175
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 4) Start the database

From the `source` folder:

```bash
cd ../source
docker compose up -d db
```

This starts the MySQL container on port `3306`.

### 5) Run Prisma migrations

```bash
cd backend
npx prisma migrate dev
```

This creates the database schema and applies all migrations.

### 6) Start the backend

```bash
npm run dev
```

The API runs on:

- http://localhost:5175
- Health check: http://localhost:5175/health

### 7) Start the frontend

Open a second terminal:

```bash
cd source/frontend
npm run dev
```

Then open:

- http://localhost:3000

## Running with Docker Compose

You can also run the full stack in Docker:

```bash
cd source
docker compose up --build
```

This starts:

- MySQL database on port `3306`
- Backend on port `5175`
- Frontend on port `3000`

To stop the containers:

```bash
docker compose down
```

## Useful Commands

### Backend

```bash
cd source/backend
npm install
npm run dev
npx prisma migrate dev
npx prisma studio
```

### Frontend

```bash
cd source/frontend
npm install
npm run dev
npm run build
npm run start
npm run lint
```

## Development Notes

- The backend uses `dotenv` to load environment values from `.env`.
- The frontend uses `NEXT_PUBLIC_*` variables for client-side API settings.
- If Google login is being used, make sure the same Google Client ID is configured in both backend and frontend environment files.
- If the database is not ready yet, wait a few seconds and rerun Prisma migration commands.

## Troubleshooting

### Database connection fails

Check that MySQL is running:

```bash
docker compose ps
```

Then verify your `DATABASE_URL` and database credentials in `.env`.

### Prisma migration issues

Run:

```bash
cd source/backend
npx prisma migrate reset
npx prisma migrate dev
```

### Frontend cannot reach backend

Ensure that `NEXT_PUBLIC_API_URL` matches the backend port:

```env
NEXT_PUBLIC_API_URL=http://localhost:5175
```

## Group Members

| Name | Student ID | GitHub Username |
|---|---|---|
| Pannathon Nithiwatcharin | 6710545695 | Pannathon-n |
| Krittin Konsiang | 6510545241 | Theme86 |
| Paramee Saejia | 6710545709 | Paramee-Saejia |
| Piyapong Ausawarachan | 6710545725 | PiyapongAusawarachan |
| Phubet Ueananta | 6710545814 | kmsimust |

## Documentation


- `docs/` — PDFs: Software Requirement Specification (SRS), Software Proposal, Iteration Report
- `docs/` — Diagrams (JSON): Plane.so Gantt Chart, draw.io diagrams (Use Case, Activity, Sequence)
- `docs/` contains project design documents and diagrams.
- `source/backend/prisma/` contains the Prisma schema and migration files.
- `source/frontend/app/` contains the Next.js UI pages.

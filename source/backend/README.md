# Backend Setup and Development

This backend service is built with Express.js and Prisma for the lab request management system.

## Prerequisites

- Node.js 20 or later
- npm
- MySQL 8 running locally or via Docker

## Environment setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update `.env` with your local database and app configuration:

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

## Install dependencies

```bash
npm install
```

## Start the database

If you are using Docker for MySQL:

```bash
cd ../
docker compose up -d db
```

## Run Prisma migrations

```bash
npx prisma migrate dev
```

## Start the backend in development mode

```bash
npm run dev
```

The server runs at:

- http://localhost:5175
- Health endpoint: http://localhost:5175/health

## Production-like startup

```bash
node -r tsx/cjs index.js
```

## Useful commands

```bash
npx prisma generate
npx prisma studio
npx prisma migrate reset
```

## Docker

To run the backend with the database container:

```bash
docker compose up -d db backend
```

To run migrations inside the backend container:

```bash
docker compose exec backend npx prisma migrate deploy
```

## Notes

- The API expects `FRONTEND_URL` to be configured for CORS in the runtime environment.
- If you use Google login, make sure the same `GOOGLE_CLIENT_ID` is set in the frontend environment as well.
- If the app is started from the root project, use `source/backend` as the working directory for backend commands.

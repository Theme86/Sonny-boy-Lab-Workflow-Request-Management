## Setup
1. Copy `.env.example` to `.env`, fill in your local MySQL credentials
2. `npm install`
3. `npx prisma migrate dev`

## docker
docker compose up -d db backend
docker compose exec backend npx prisma migrate deploy
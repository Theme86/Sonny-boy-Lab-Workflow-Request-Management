# Lab Workflow & Request Management

A web app for Aj. Milk's lab to submit and track lab requests, book lab rooms, and manage equipment and consumables. It replaces email threads, chat messages and spreadsheets.


---
## Team Members
| ID Number | Name | Github Username |
|---|---|---|
| 6510545241 | Krittin Konsiang | Theme86 |
| 6710545695 | Pannathon Nithiwatcharin | Pannathon |
| 6710545709 | Paramee Saejia | Mammos |
| 6710545725 | Piyapong Ausawarachan | PiyapongAusawarachan |
| 6710545814 | Phubet Ueananta | kmsimust |

---

## Tech Stack & Architecture

| Part | Tech | Port |
|---|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS | `3000` |
| Backend | Express 5, Prisma 7 | `5175` |
| Database | MySQL 8 | `3307` on your machine (`3306` inside Docker) |

```text
.
├── README.md
├── docs/
└── source/
    ├── docker-compose.yml
    ├── .env.example          ← secrets for Docker Compose
    ├── backend/              ← Express API, Prisma schema and migrations
    └── frontend/             ← Next.js app
```
---

## 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), for the database and for running everything in Docker
- [Node.js 20](https://nodejs.org/) or later, with npm, for running the apps without Docker and for running tests
- Git
- A Google account, to create the sign-in client ID (next step)

## 2. Create a Google sign-in client ID (one time)

Users sign in with Google, so the app needs an OAuth Client ID.

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. **Create credentials → OAuth client ID**, application type **Web application**.
3. Under **Authorized JavaScript origins**, add `http://localhost:3000`.
4. Copy the **Client ID**. It looks like `1234-abc.apps.googleusercontent.com`.

The Client ID isn't a secret. The same ID can be shared by the whole team.

## 3. Clone the repository

```bash
git clone https://github.com/Theme86/Sonny-boy-Lab-Workflow-Request-Management.git
cd Sonny-boy-Lab-Workflow-Request-Management/source
```

All commands below are run from `source/` unless a step says otherwise.

---

## Option A: Run everything with Docker (recommended)

This is the quickest way to run the whole system, and the closest to production.

### A1. Add the secrets

```bash
cp .env.example .env
```

Edit `source/.env`:

```env
JWT_SECRET=<a long random string>
GOOGLE_CLIENT_ID=<your-id>.apps.googleusercontent.com
```

To generate a random `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`.env` is in `.gitignore`. Never commit it.

### A2. Build and start

```bash
docker compose up -d --build
```

The first build takes a few minutes. Check that all three containers are running:

```bash
docker compose ps
```

### A3. Create the database tables

The backend container doesn't run migrations by itself, so run them once:

```bash
docker compose exec backend npx prisma migrate deploy
```

It should end with `All migrations have been successfully applied.`

### A4. Optional: add sample consumables

```bash
docker compose exec backend npm run seed:consumables
```

### A5. Create the first Lab Manager

Everyone who signs in starts as a **member**. To get admin access:

1. Open http://localhost:3000 and **sign in with Google once**.
2. Promote your account:
   ```bash
   docker compose exec backend npm run set-role -- your-email@ku.th lab_manager
   ```
3. **Log out and log in again** so your session gets the new role.

From then on, the Lab Manager can change other users' roles on the **Users** page.

### A6. Open the app

- App: http://localhost:3000
- API health check: http://localhost:5175/health

### Updating after code changes

Docker copies the code into the image when it builds, so a plain `up` keeps running the old code. Rebuild after changing code:

| What changed | Command |
|---|---|
| Backend code | `docker compose up -d --build backend` |
| Frontend code | `docker compose up -d --build frontend` |
| `package.json` / lock file | `docker compose up -d --build` |
| New migration in `prisma/migrations` | `docker compose up -d --build backend`, then `docker compose exec backend npx prisma migrate deploy` |
| `NEXT_PUBLIC_…` values | `docker compose up -d --build frontend` (these are fixed into the frontend at build time) |

### Stopping

```bash
docker compose down        # stops containers; keeps database and uploaded images
docker compose down -v     # ⚠️ also DELETES the database and all uploaded images
```

---

## Option B: Run backend and frontend locally (for development)

Better for day-to-day coding: the backend restarts automatically and the frontend updates in the browser as soon as you save. MySQL still runs in Docker, so everyone uses the same database setup.

### B1. Start the database only

```bash
docker compose up -d db
```

### B2. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`. **The port is `3307`**, because Docker exposes MySQL on 3307 on your machine:

```env
DATABASE_USER="user"
DATABASE_PASSWORD="password"
DATABASE_NAME="mydb"
DATABASE_HOST="localhost"
DATABASE_PORT=3307
DATABASE_URL="mysql://user:password@localhost:3307/mydb"

GOOGLE_CLIENT_ID=<your-id>.apps.googleusercontent.com
JWT_SECRET=<a long random string>
FRONTEND_URL=http://localhost:3000
PORT=5175
```

Then:

```bash
npm ci                          # install exact versions from package-lock.json
npx prisma generate             # generate the Prisma client
npx prisma migrate deploy       # create/update tables
npm run seed:consumables        # optional sample data
npm run dev                     # http://localhost:5175
```

After signing in once (see B3), create your Lab Manager:

```bash
npm run set-role -- your-email@ku.th lab_manager
```

### B3. Frontend

In a second terminal:

```bash
cd frontend
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5175
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-id>.apps.googleusercontent.com
```

Then:

```bash
npm ci
npm run dev                     # http://localhost:3000
```

---

## Running tests and checks

Run these before pushing or opening a pull request:

```bash
# backend
cd source/backend
npm test

# frontend
cd ../frontend
npm test            # unit and component tests (Vitest)
npm run lint        # ESLint
npm run build       # production build: catches errors that `npm run dev` only warns about
```

`npm run dev` only **warns** about some errors that make `npm run build` (and therefore Docker) **fail**, such as a missing import. Always run `npm run build` before merging.

---

## Working with dependencies

- **Commit `package.json` and `package-lock.json` together.** Both Docker images use `npm ci`, which fails if the lock file is missing or doesn't match `package.json`.
- After `git pull`, run `npm ci` (not `npm install`) so you get exactly the same versions as everyone else.
- Adding a package: `npm install <package>`, then commit both files.
- Don't delete `package-lock.json` to fix problems. Delete `node_modules/` and run `npm ci` instead.

## Database changes (Prisma)

1. Edit `backend/prisma/schema.prisma`.
2. Create a migration (local development only):
   ```bash
   cd source/backend
   npx prisma migrate dev --name short_description
   ```
3. Commit the new folder in `prisma/migrations/` together with the schema change.
4. Other members apply it with `npx prisma migrate deploy` (or the Docker command in A3).

Never edit or delete a migration that has already been pushed. Create a new one instead.

Browse the data with `npx prisma studio` (run from `backend/`).

## Uploaded images

Images are stored on the backend's disk, and the database stores only their paths:

| Images | Folder |
|---|---|
| User avatars and banners | `backend/public/userImages/` |
| Equipment | `backend/public/equipmentImages/` |
| Consumables | `backend/public/consumableImages/` |
| Rooms | `backend/public/labRoomImages/` |

In Docker, each folder needs a volume in `docker-compose.yml`. Without one, the images are deleted every time the container is rebuilt:

```yaml
  backend:
    volumes:
      - user_images:/app/public/userImages
      - equipment_images:/app/public/equipmentImages
      - consumable_images:/app/public/consumableImages
      - lab_room_images:/app/public/labRoomImages

volumes:
  db_data:
  user_images:
  equipment_images:
  consumable_images:
  lab_room_images:
```

## Time zones

- All times are **stored in UTC** in MySQL. Keep the database on UTC (`command: --default-time-zone=+00:00` on the `db` service).
- The browser converts times to the viewer's local time, so in Thailand everything shows Bangkok time (UTC+7).
- Looking at the database directly shows UTC, which is 7 hours behind Bangkok. To see local time:
  ```sql
  SELECT CONVERT_TZ(created_at, '+00:00', '+07:00') FROM requests;
  ```
- Always send times from the frontend with a time zone (`date.toISOString()`), never as a plain `"YYYY-MM-DD HH:mm"`.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `npm ci` fails during `docker compose up --build` | `package-lock.json` is missing or out of sync with `package.json` | Run `npm install` in that folder, commit both files, rebuild |
| `next build` fails with "Export … doesn't exist in target module" | A wrong import that dev mode only warns about | Fix the import; run `npm run build` before pushing |
| `P3018 … Table 'users' already exists` on `migrate deploy` | The database volume has tables from an older setup | If the data doesn't matter: `docker compose down`, `docker volume rm source_db_data` (check the name with `docker volume ls`), `docker compose up -d`, then migrate again |
| `403 Forbidden` when creating rooms, equipment, etc. | Your account isn't Lab Manager, or your session is from before the role change | Run `set-role` (A5), then **log out and log in again** |
| Google sign-in fails or the popup closes | `http://localhost:3000` isn't an authorized origin, or the Client ID is wrong | Check step 2 and both `.env` files |
| Sign-in works on `localhost` but not from another device's IP | In production mode the login cookie is `Secure`, which browsers only accept on `localhost` or HTTPS | Test on `localhost`, or put the app behind HTTPS |
| Images show as broken after a rebuild | The image folder has no Docker volume | Add the volumes under **Uploaded images**, then upload the images again |
| Backend can't reach the database when run locally | Wrong port | Use `DATABASE_PORT=3307` in `backend/.env` |
| Port already in use | Another app is using 3000, 5175 or 3307 | Stop that app, or change the port mapping in `docker-compose.yml` |
| Times look 7 hours off in the database or logs | They're stored and logged in UTC (expected) | See **Time zones** |

## Useful commands

```bash
docker compose logs -f backend          # follow backend logs
docker compose exec backend sh          # shell inside the backend container
docker compose exec db mysql -uuser -ppassword mydb   # MySQL prompt
npx prisma studio                       # browse data (from backend/)
npm run set-role -- <email> <member|ta|lecturer|lab_manager>
```

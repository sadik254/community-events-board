# Community Events Board

A small community events app built with Next.js App Router, TypeScript, Prisma 7 and SQLite. Visitors can browse and filter active upcoming events, save category preferences, view a personalized feed, set reminders and design an event card. Admins can create events and switch their active status.

## Run locally (under 5 minutes)

Requirements: Node.js 20+ and npm.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `JWT_SECRET` to a random secret of at least 64 characters. The example includes a development-only secret; replace it before using the app beyond local development.
3. Create the local SQLite database and apply migrations: `npx prisma migrate deploy`
4. Generate Prisma Client: `npx prisma generate`
5. Add the 15 sample events: `npx tsx prisma/seed.ts`
6. Create the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`: `npx tsx prisma/seed-admin.ts`
7. Start the app: `npm run dev`, then visit http://localhost:3000.

Sample admin login (from the checked-in example values):

- Email: `admin@example.com`
- Password: `admin123`

Change both values in `.env` before running `seed-admin.ts` if you want different credentials. The seed command creates or updates that account and stores a bcrypt hash.

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite database location, such as `file:./dev.db` |
| `JWT_SECRET` | Secret used to sign 24-hour JWTs; use at least 64 characters |
| `ADMIN_EMAIL` | Email used to seed the admin account |
| `ADMIN_PASSWORD` | Password used to seed the admin account (8–72 bytes) |

## API overview

All routes return JSON. Authenticated routes accept the `community_session` HttpOnly cookie set by login or an `Authorization: Bearer <JWT>` header.

| Method | Route | Purpose / access |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create a user account |
| `POST` | `/api/auth/login` | Verify credentials and return a JWT (also sets the session cookie) |
| `GET` | `/api/auth/me` | Return the current user |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/events?category=MUSIC&city=Coimbatore&q=night&page=1&pageSize=6` | Active upcoming events; filters combine, with pagination |
| `GET` | `/api/events/[id]` | View an active upcoming event |
| `GET` | `/api/feed` | Authenticated user's upcoming events in favourite categories |
| `GET`, `PUT` | `/api/favourites` | Read or replace authenticated user's favourite categories |
| `GET`, `PUT` | `/api/events/[id]/design` | Read or save authenticated user's theme and up to 3 stickers |
| `GET`, `PUT`, `DELETE` | `/api/events/[id]/reminder` | Read, set or remove a reminder for the authenticated user |
| `GET`, `POST` | `/api/admin/events` | Admin-only list and event creation |
| `PATCH` | `/api/admin/events/[id]` | Admin-only active/inactive update; events are retained |

## Design and implementation answers

### 1. Database structure and why

`User` stores a unique email, bcrypt password hash and role. `Event` stores event details, an `isActive` flag, start time and price in paise; separate `FavouriteCategory`, `Reminder` and `CardDesign` rows connect user choices to users and events. Composite keys prevent duplicate favourites, reminders and per-event designs, while keeping each feature independently queryable.

### 2. Filter query and index

The events endpoint builds one Prisma `where` clause, adding category, exact city and title/description text conditions only when supplied; all conditions are ANDed, and title/description are ORed within search. It also requires active events with `startsAt >= now`, then sorts by start time and paginates. The schema includes `[isActive, startsAt]` and `[category, city, isActive, startsAt]` indexes; for a larger production dataset I would check the actual query plan and add/tune an index for the most common category/city combinations (SQLite substring search with `contains` is not accelerated by a normal B-tree index).

### 3. Passwords and admin protection

Passwords are hashed with bcryptjs at cost 12; plaintext passwords are never stored. Login signs a 24-hour HS256 JWT and returns it while setting an HttpOnly, SameSite=Lax cookie; API auth also accepts Bearer tokens. The admin page and each admin API handler resolve the current user on the server and require role `ADMIN`; create/status-change endpoints also check request origin when provided.

## AI assistance

AI assistance was used to suggest some changes to develop it faster and document the project. I reviewed the generated changes and can explain the code and make changes to it.

## Remaining work / limitations

- The app is intended for local evaluation; production deployment would need a persistent database, production secrets and hosting configuration.

## Useful commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma migrate deploy` — apply migrations
- `npx tsx prisma/seed.ts` — seed 15 sample events
- `npx tsx prisma/seed-admin.ts` — create/update the configured admin account

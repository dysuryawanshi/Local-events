# Local Events

Discover local events (music, food, family, sports, arts), filter by type and day, open the ticket link, save events to your account, and add them to the phone calendar.

- `app/`: Expo SDK 57 app (Expo Router, React Native Paper)
- `api/`: Express + Prisma + PostgreSQL API

Use Node 22.13.x (`fnm use 22.13.1`).

## API

```bash
cd api
cp .env.example .env        # set DATABASE_URL and JWT_SECRET
npm install
npx prisma db push          # create tables
npm run seed                # idempotent; safe to re-run
npm run build && npm start  # or: npm run dev
```

The API listens on `0.0.0.0:$PORT` (default 4000). Health check: `GET /health`.

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/events?type=MUSIC&from=ISO&to=ISO` | public |
| GET | `/events/:id` | public |
| POST | `/events` | ADMIN |
| POST | `/auth/login` | public |
| GET | `/auth/me` | signed in |
| GET | `/me/saved` | signed in |
| PUT / DELETE | `/me/saved/:id` | signed in |

Seed accounts: `alex@example.com` / `password123` (member, three saved events) and `admin@example.com` / `admin12345` (admin).

Seed dates are relative to the day you run the seed. The fourth day (today + 3) is left empty so the empty-day filter state is real. Re-run `npm run seed` to move the events forward.

### Local database used during development

During the build, a project-local PostgreSQL 17 cluster was created in `.pgdata/` on port 5434 with trust auth (localhost only). To start it again after a reboot:

```bash
"/c/Program Files/PostgreSQL/17/bin/pg_ctl.exe" -D .pgdata -o "-p 5434 -c listen_addresses=localhost" -l .pgdata/server.log start
```

To use your main PostgreSQL server instead, change `DATABASE_URL` in `api/.env`, then run `npx prisma db push` and `npm run seed`.

## App

```bash
cd app
cp .env.example .env        # EXPO_PUBLIC_API_URL
npm install
npm run web                 # browser
npm start                   # Expo dev server for Android / iOS
npx expo export --platform web --output-dir dist
```

`EXPO_PUBLIC_API_URL` values:

- Web or iOS simulator: `http://127.0.0.1:4000`
- Android emulator: `http://10.0.2.2:4000`
- Physical phone: `http://<computer LAN IP>:4000`

### Add to calendar

- On iOS, the event is written to the default calendar (write-only calendar permission).
- On Android, the event is written to the primary writable calendar (READ/WRITE_CALENDAR permission).
- On web, browsers have no calendar API, so the app downloads an `.ics` file that opens in your calendar app.

The device calendar uses the `expo-calendar` native module, so test it in a development build (`npx expo run:android` / `run:ios`). It may not be available in Expo Go.

# Pulse Hospital — Backend & Dashboard Integration

## What was added

### Backend (no external database required)
All backend code lives in `src/lib/server/`:

| File | Purpose |
|------|---------|
| `db.ts` | JSON file-based data store at `data/pulse-db.json`. Seeded with demo doctors, patients, appointments, invoices, and notifications on first run. Uses Node's built-in `crypto.scryptSync` for secure password hashing. |
| `auth.ts` | Login / logout / session server functions. Sessions stored in the same JSON file, with an `httpOnly` cookie. |
| `api.ts` | All dashboard data server functions — admin overview, doctor CRUD, appointment status updates, billing, reports, doctor overview, schedule, notifications, profile. |

### Authentication
- Cookie name: `pulse_session` (httpOnly, 7-day TTL)
- Passwords hashed with scrypt (Node built-in — no bcrypt dependency needed)

### Demo credentials (seeded on first run)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pulseheart.com` | `Admin@123` |
| Doctor | `amit.verma@pulseheart.com` | `Doctor@123` |

### New routes

| Path | Description |
|------|-------------|
| `/login` | Shared login page with Admin / Doctor tabs |
| `/admin` | Admin dashboard (Dashboard, Doctors, Appointments, Billing, Reports, Settings) |
| `/doctor` | Doctor dashboard (Dashboard, My Appointments, Patients, Schedule, Reports & Documents, Notifications, Profile, Settings) |

**Removed from Admin:** Staff, Users & Roles, Patients, Departments  
**Removed from Doctor:** Prescriptions

### Navbar changes
The public-facing `Navbar` now has a **Staff Login** dropdown (Admin Login / Doctor Login) in desktop view, and two separate login buttons in the mobile drawer. Both link to `/login`.

## Running locally

```bash
npm install
npm run dev
```

The app will start on `http://localhost:3000`. The database is automatically seeded at `data/pulse-db.json` on the first request.

## Upgrading to a real database

Replace `src/lib/server/db.ts` with a Drizzle/Prisma/Postgres adapter that exports the same `getDb()` / `saveDb()` interface. Nothing else needs to change.

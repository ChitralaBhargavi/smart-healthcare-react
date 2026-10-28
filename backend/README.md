# SmartCare backend (Phase 1)

This backend uses Node.js, Express, JavaScript ES modules, JSON middleware,
CORS, environment configuration, request logging, Mongoose, MongoDB Atlas,
asynchronous file operations, and a small EventEmitter demonstration.

Phase 2 adds MongoDB schemas, doctor CRUD, and repeatable doctor seeding.
Phase A adds hashed-password authentication, role-aware login, and protected
session cookies. Doctor CRUD write endpoints now
require an authenticated doctor session, but ownership checks and the complete
doctor profile workflow are deferred; do not expose them publicly.

Phase B adds MongoDB-backed appointments, doctor-scoped appointment
management, availability control, status notifications, and patient/doctor
REST synchronization. The frontend no longer uses localStorage for appointment
records.

Secure doctor account setup adds short-lived, single-use hashed setup tokens,
rate-limited setup requests, configurable SMTP delivery, and a dry-run account
provisioning script. Existing doctor accounts are not automatically relinked
or given new passwords.

## Install and start

From the project root:

```powershell
Set-Location -LiteralPath 'C:\Users\Mallesh\Downloads\VAIDHIKA\smart-healthcare-react-main\backend'
Copy-Item .env.example .env
npm.cmd install
npm.cmd run seed:doctors
npm.cmd run link:doctor -- --email=doctor@example.com --doctorId=1
npm.cmd run dev
```

`npm.cmd run dev` uses Node's built-in watch mode. For a normal start:

```powershell
npm.cmd start
```

The default backend URL is `http://localhost:5000`. Change `PORT`,
`CLIENT_ORIGIN`, `MONGODB_URI`, or `DB_NAME` in your local `.env` when needed.

## Testing

Run the unit/business-rule tests without a database:

```powershell
npm.cmd test
```

The HTTP integration suite is deliberately separate and refuses to run unless
`TEST_MONGODB_URI` points to a dedicated MongoDB database whose name contains
`test`. Set `TEST_DB_NAME` to the same isolated database name when needed:

```powershell
$env:TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/smartcare_test'
$env:TEST_DB_NAME = 'smartcare_test'
npm.cmd run test:integration
Remove-Item Env:TEST_MONGODB_URI, Env:TEST_DB_NAME
```

Do not point these variables at the ordinary `smartcare` database or at a
production cluster. Integration cleanup deletes only records identified by
the test run.

Doctor setup email delivery requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
`SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM`. In production, setup requests
fail safely when SMTP is incomplete; development-only setup previews are not
returned in production. The current rate limiter is process-local and must be
replaced with a shared store for multi-instance deployments.

Notifications currently synchronize through API refreshes. WebSockets/SSE and
appointment rescheduling are not implemented because they are outside the
current workflow requirements.
Never commit `.env`.

## Secure doctor account setup

Doctor setup requires these optional environment variables:

```env
DOCTOR_SETUP_TOKEN_MINUTES=20
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
```

In non-production development, if SMTP is not configured, the setup request
returns a clearly labelled preview link. This development preview must never
be enabled in production. In production, configure SMTP and do not expose
setup tokens in API responses or logs.

The setup endpoints are:

```text
POST /api/auth/doctor/setup/request
POST /api/auth/doctor/setup/complete
```

Setup tokens are stored only as SHA-256 hashes, expire after the configured
short interval, and become unusable after completion. Doctor login remains
blocked for accounts created by the provisioning script until setup completes.

## Provision the six doctor accounts safely

The provisioning script matches existing profiles by their stable `legacyId`,
checks linked users and normalized email collisions, and never creates doctor
profiles. Always inspect the dry run first:

```powershell
Set-Location -LiteralPath 'C:\Users\Mallesh\Downloads\VAIDHIKA\smart-healthcare-react-main\backend'
npm.cmd run provision:doctors
```

The script reports `already-linked`, `ready-to-create`, and conflict states.
It performs no writes unless both explicit flags are supplied:

```powershell
npm.cmd run provision:doctors -- --apply=true --confirm=PROVISION_DOCTORS
```

Only `ready-to-create` accounts are created. New accounts have the `doctor`
role, no password, and a link to the existing Doctor document. Existing
passwords, emails, appointments, notifications, and ambiguous mappings are
not overwritten. The apply operation rolls back newly created links and users
if a later write fails.

After applying approved records, each doctor opens `/doctor/setup`, enters the
provided email address, and requests a setup link. They then follow the
time-limited link, verify the token, choose a strong password, and log in at
`/doctor/login`.

### Local development password recovery for dummy-email accounts

If a doctor cannot access a dummy email inbox, use the protected local CLI
instead of adding a password to a URL, shell history, `.env`, or source file.
It updates only an existing doctor account selected by its exact email or stable
legacy ID, requires explicit confirmation, and refuses to run when
`NODE_ENV=production`:

```powershell
Set-Location -LiteralPath 'C:\Users\Mallesh\Downloads\VAIDHIKA\smart-healthcare-react-main\backend'
npm.cmd run set:doctor-password -- --doctorEmail=doctor@example.com --apply=true --confirm=SET_DOCTOR_PASSWORD
```

Alternatively:

```powershell
npm.cmd run set:doctor-password -- --legacyId=2 --apply=true --confirm=SET_DOCTOR_PASSWORD
```

The script prompts for the new password twice without accepting it as a command
line argument, validates the existing strong-password policy, hashes it with
the application's bcrypt configuration, clears `doctorSetupRequired`, and
invalidates outstanding setup tokens. It does not set
`doctorEmailVerifiedAt`, because this local operation does not prove ownership
of the email address. It prints only the configured database name and selected
doctor identity, never credentials or tokens.

## Configure MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user and keep its password private.
3. Add your development IP address to Atlas Network Access.
4. Copy the application connection string into `backend/.env`.
5. Replace the placeholder username, password, and cluster host only in the
   local `.env` file.

Example shape (do not use these placeholder values as credentials):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
DB_NAME=smartcare
JWT_SECRET=replace-with-a-long-random-local-secret
AUTH_COOKIE_NAME=smartcare_auth
```

The server connects before it begins accepting requests. If `MONGODB_URI` is
missing or invalid, startup exits with a safe diagnostic that does not print
the URI or credentials. `JWT_SECRET` must be at least 32 characters.

## Seed doctors

From `backend\`, run:

```powershell
npm.cmd run seed:doctors
```

The script reads the existing `..\..\public\doctors.json`, maps its numeric
`id` to the Doctor model's stable `legacyId`, and upserts records without
deleting unrelated documents. It reports inserted, updated, and skipped
counts. Running it again does not create duplicates.

## Run frontend and backend

Terminal 1:

```powershell
Set-Location -LiteralPath 'C:\Users\Mallesh\Downloads\VAIDHIKA\smart-healthcare-react-main\backend'
npm.cmd run dev
```

Terminal 2:

```powershell
Set-Location -LiteralPath 'C:\Users\Mallesh\Downloads\VAIDHIKA\smart-healthcare-react-main'
npm.cmd run dev
```

The frontend runs on `http://localhost:5173`, and the backend runs on
`http://localhost:5000`. The Phase 1 frontend still uses its existing local
JSON and `localStorage` behavior; it is not connected to these example routes
yet.

## Verify the server

In a browser, open:

```text
http://localhost:5000/api/health
```

Or run:

```powershell
curl.exe http://localhost:5000/api/health
curl.exe http://localhost:5000/api/health/db
curl.exe http://localhost:5000/api/example
curl.exe http://localhost:5000/api/doctors
curl.exe http://localhost:5000/api/doctors/1
```

Expected health response:

```json
{
  "status": "ok",
  "message": "SmartCare backend is running."
}
```

The database health endpoint returns HTTP 200 when Mongoose is connected and
HTTP 503 when it is unavailable:

```json
{
  "status": "ok",
  "message": "MongoDB is connected."
}
```

## Doctor CRUD

```text
GET    /api/doctors
GET    /api/doctors/:id
POST   /api/doctors
PATCH  /api/doctors/:id
DELETE /api/doctors/:id
```

The `:id` value can be a MongoDB ObjectId or one of the seeded numeric legacy
ids. Create and update bodies use the fields in `public/doctors.json`.

Example create request:

```powershell
$doctor = @{
  legacyId = 99
  name = 'Dr. Example'
  specialization = 'General Medicine'
  experience = 5
  qualification = 'MBBS'
  hospital = 'SmartCare Clinic'
  fee = 300
  rating = 4.5
  availableDays = 'Mon - Fri'
  availableTime = '9:00 AM - 1:00 PM'
  about = 'Educational CRUD example.'
  image = 'f1.jpg'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:5000/api/doctors' `
  -Method Post -ContentType 'application/json' -Body $doctor
```

Delete the example after testing by using its returned MongoDB `_id`:

```powershell
Invoke-RestMethod -Uri 'http://localhost:5000/api/doctors/<returned-id>' `
  -Method Delete
```

Inspect the `smartcare` database and `doctors` collection in the Atlas
Collections view. The Mongoose model creates indexes, including the unique
`legacyId` index, when connected.

## Phase B appointment and availability APIs

Authenticated patient APIs:

```text
POST  /api/appointments
GET   /api/appointments/my
PATCH /api/appointments/:id/cancel
```

Authenticated doctor APIs:

```text
GET   /api/doctors/me
GET   /api/appointments/doctor
PATCH /api/appointments/:id/status
PATCH /api/doctors/:id/availability
```

Public availability:

```text
GET /api/doctors/:id/availability
```

Appointment status values are `pending`, `confirmed`, `rejected`,
`cancelled`, and `completed`. The server validates ownership, doctor
availability, dates, times, status transitions, and duplicate active
doctor/date/time slots.

The existing doctor account must be linked to a seeded profile once:

```powershell
npm.cmd run seed:doctors
npm.cmd run link:doctor -- --email=doctor@example.com --doctorId=1
```

The link command updates only the selected doctor profile's `user` reference.
It does not delete records.

## Notifications

Authenticated notification APIs:

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

Appointment creation creates patient and doctor notifications when the doctor
profile is linked. Doctor status changes notify the patient, and patient
cancellation notifies the doctor.

## Phase A authentication

Authentication uses the existing `User` model, bcrypt password hashes, and an
HTTP-only cookie containing a signed JWT. Passwords and authentication tokens
are not stored in React `localStorage`.

Patient endpoints:

```text
POST /api/auth/register
POST /api/auth/login
```

Doctor endpoint:

```text
POST /api/auth/doctor-login
```

Shared session endpoints:

```text
GET  /api/auth/me
POST /api/auth/logout
```

Patient registration always creates `role: patient`; the browser cannot choose
or elevate its role. Doctor accounts must be provisioned by a backend operator:

```powershell
npm.cmd run create:doctor -- --fullName="Dr. Example" --email=doctor@example.com --password="at-least-8-chars"
```

This command hashes the password before saving it. It does not print the
password. Doctor login is available in the frontend at
`http://localhost:5173/doctor/login`.

The cookie is configured as `HttpOnly`, `SameSite=Lax`, and `Secure` in
production. Protected backend routes can use `authenticateUser` and
`requireRole('patient')` or `requireRole('doctor')` from
`backend/src/middleware/authenticateUser.js`.

## Syllabus mapping

- `backend/src/server.js`: Node.js server entry point and environment-based port.
- `backend/src/app.js`: Express app, JSON parsing, CORS, routes, and centralized
  error handling.
- `backend/src/routes/exampleRoutes.js`: Express GET/POST routing and JSON
  request/response handling.
- `backend/src/middleware/requestLogger.js`: custom middleware that logs only
  method, path, status, and duration; request bodies are never logged.
- `backend/src/utils/fileExample.js`: asynchronous `node:fs/promises` file read.
- `backend/src/utils/demoEmitter.js`: custom `EventEmitter` event and listener.
- `backend/.env.example`: placeholder environment configuration.
- `backend/src/config/db.js`: asynchronous Mongoose connection, status, and
  graceful disconnect.
- `backend/src/models/`: Mongoose schemas for users, doctors, and appointments.
- `backend/src/controllers/doctorController.js`: MongoDB CRUD controller.
- `backend/src/routes/doctorRoutes.js`: doctor API routes.
- `backend/src/scripts/seedDoctors.js`: repeatable JSON-to-MongoDB seed script.
- `backend/src/models/User.js`: role-aware user schema with password hash.
- `backend/src/controllers/authController.js`: patient and doctor auth flows.
- `backend/src/middleware/authenticateUser.js`: signed-cookie authentication and
  role authorization middleware.
- `backend/src/utils/auth.js`: JWT and safe public-user helpers.
- `backend/src/scripts/createDoctorUser.js`: hashed doctor-account provisioning.
- `backend/src/scripts/linkDoctorUser.js`: links a doctor account to one
  existing seeded doctor profile.
- `backend/src/models/Notification.js`: MongoDB notification schema.
- `backend/src/controllers/appointmentController.js`: appointment creation,
  ownership filtering, status transitions, and cancellation.
- `backend/src/controllers/availabilityController.js`: persisted availability
  control.
- `backend/src/controllers/notificationController.js`: authenticated
  notification listing and read state.

Phase A demonstrates authentication and role-based authorization. Later phases
will add protected appointment, availability, and notification routes.

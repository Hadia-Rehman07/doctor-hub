# Doctor Hub — Backend API

A production-ready healthcare consultation and patient history management system built with **TypeScript**, **Express**, and **Supabase**.

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Runtime      | Node.js 18+                       |
| Language     | TypeScript 5                      |
| Framework    | Express 4                         |
| Database     | Supabase (PostgreSQL)             |
| Auth         | JWT + bcryptjs                    |
| File Storage | Supabase Storage                  |
| Security     | Helmet, CORS, Rate Limiting       |

---

## Project Structure

```
doctor-hub/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client (service role)
│   ├── controllers/
│   │   ├── auth.controller.ts   # Register, login, forgot/reset password
│   │   ├── doctor.controller.ts # Search & filter doctors
│   │   ├── appointment.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── history.controller.ts # Immutable medical records
│   │   ├── clinic.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification + RBAC
│   │   ├── validate.ts          # express-validator helper
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── doctor.routes.ts
│   │   ├── appointment.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── history.routes.ts
│   │   ├── clinic.routes.ts
│   │   └── admin.routes.ts
│   ├── types/
│   │   └── index.ts             # All TypeScript interfaces & enums
│   └── index.ts                 # App entry point
├── supabase/
│   └── migrations/
│       └── 001_schema.sql       # Full DB schema (run once in Supabase)
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Appointment Workflow

```
Patient Search → Filter by Disease → Book Appointment
    → Upload Payment Screenshot → Assistant Verifies
    → Appointment Confirmed ✓
```

Status flow: `pending` → `payment_uploaded` → `payment_verified` → `confirmed`

---

## User Roles & Permissions

| Role        | Capabilities                                               |
|-------------|-----------------------------------------------------------|
| patient     | Search doctors, book appointments, view own history        |
| doctor      | Manage schedule/clinics, add records & prescriptions       |
| assistant   | Verify/reject payments                                     |
| admin       | Manage users, verify doctors, view dashboard               |
| super_admin | Full system control, create admin accounts                 |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/doctor-hub.git
cd doctor-hub
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase/migrations/001_schema.sql`
3. Go to **Storage** → create a public bucket called `payment-screenshots`
4. Copy your **Project URL**, **anon key**, and **service_role key** from Settings → API

### 3. Configure Environment

```bash
cp .env.example .env
# Fill in your Supabase keys and JWT secret
```

### 4. Run

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

---

## API Reference

### Auth  `POST /api/auth/`

| Method | Endpoint               | Description          | Auth |
|--------|------------------------|----------------------|------|
| POST   | `/register`            | Register patient/doctor | No |
| POST   | `/login`               | Login                | No  |
| GET    | `/profile`             | Get own profile      | Yes |
| POST   | `/forgot-password`     | Request reset token  | No  |
| POST   | `/reset-password`      | Reset with token     | No  |

### Doctors  `GET /api/doctors/`

| Method | Endpoint      | Query Params                                        | Auth     |
|--------|---------------|-----------------------------------------------------|----------|
| GET    | `/`           | `treatment_type`, `disease`, `city`, `specialization` | No     |
| GET    | `/:id`        | —                                                   | No       |
| PATCH  | `/:id`        | —                                                   | doctor   |

### Appointments  `/api/appointments/`

| Method | Endpoint      | Description                  | Role    |
|--------|---------------|------------------------------|---------|
| POST   | `/`           | Book appointment             | patient |
| GET    | `/my`         | Patient's appointments       | patient |
| GET    | `/doctor`     | Doctor's appointments        | doctor  |
| PATCH  | `/:id/cancel` | Cancel appointment           | patient/admin |

### Payments  `/api/payments/`

| Method | Endpoint                         | Description                | Role      |
|--------|----------------------------------|----------------------------|-----------|
| POST   | `/:appointment_id/screenshot`    | Upload payment proof       | patient   |
| GET    | `/pending`                       | List pending payments      | assistant |
| PATCH  | `/:id/verify`                    | Approve or reject payment  | assistant |
| GET    | `/appointment/:appointment_id`   | Get payment details        | any auth  |

### Medical History  `/api/history/`

| Method | Endpoint                   | Description                  | Role    |
|--------|----------------------------|------------------------------|---------|
| GET    | `/my`                      | Patient's own history        | patient |
| GET    | `/patient/:patient_id`     | A patient's full history     | doctor  |
| POST   | `/`                        | Add history record (append)  | doctor  |
| POST   | `/prescriptions`           | Add prescription (immutable) | doctor  |
| GET    | `/prescriptions/:id`       | Get prescription             | any auth|

### Admin  `/api/admin/`  *(admin/super_admin only)*

| Method | Endpoint              | Description             |
|--------|-----------------------|-------------------------|
| GET    | `/stats`              | Dashboard statistics    |
| GET    | `/users`              | List all users          |
| PATCH  | `/users/:id/toggle`   | Activate/deactivate user|
| POST   | `/users`              | Create assistant/admin  |
| PATCH  | `/doctors/:id/verify` | Verify a doctor         |

---

## Security

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT** tokens, 7-day expiry
- **Helmet** HTTP headers
- **Rate limiting** — 200 req/15 min global, 20 req/15 min on auth
- **RBAC** enforced at middleware level on every protected route
- Medical history & prescriptions are **immutable** (DB-level triggers prevent UPDATE/DELETE)
- File uploads restricted to JPEG/PNG/WebP, max 5 MB

---

## Deployment (Railway / Render / Fly.io)

```bash
npm run build          # Compiles TypeScript → dist/
node dist/index.js     # Start production server
```

Set all `.env` variables in your hosting dashboard. No other configuration needed.

---

## Marks Distribution (per project spec)

| Module                  | Marks |
|-------------------------|-------|
| Architecture Design     | 15    |
| Database Design         | 15    |
| Authentication & RBAC   | 10    |
| Workflow Logic          | 15    |
| API & Backend           | 10    |
| Frontend UX             | 10    |
| Analytics & Reports     | 10    |
| Code Quality            | 5     |
| Deployment              | 5     |
| Viva & Presentation     | 5     |
| **Total**               | **100** |

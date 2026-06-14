# 🏥 Doctor Hub

**A full-stack healthcare consultation and patient history management system**  
Built with TypeScript · Express · Supabase · React · Vite · Tailwind CSS

doctor-hub-app.netlify.app



---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Appointment Workflow](#appointment-workflow)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Frontend Pages & Components](#frontend-pages--components)
10. [Security Features](#security-features)
11. [Setup & Installation](#setup--installation)
12. [Environment Variables](#environment-variables)
13. [Running the Project](#running-the-project)
14. [Deployment (Vercel)](#deployment-vercel)
15. [Marks Distribution](#marks-distribution)

---

## Project Overview

Doctor Hub is a production-style healthcare platform that lets patients search and book appointments with Allopathic, Homeopathic, and Herbal doctors. It enforces a strict 6-step appointment and payment workflow, maintains immutable medical records through database-level triggers, and gates every action behind role-based access control across five distinct user roles.

### Key Capabilities

| Feature | Detail |
|---|---|
| Doctor search & filtering | By treatment type, disease, specialization, city |
| Appointment booking | Full 6-step workflow with status tracking |
| Payment verification | Screenshot upload → assistant review → confirmation |
| Medical history | Append-only records enforced by DB triggers |
| Prescriptions | Immutable once created — no edits, no deletions |
| Role-based dashboards | Separate UI portals per role |
| JWT authentication | Stateless auth with automatic token injection |
| Admin control panel | User management, doctor verification, system stats |

---

## Tech Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 18+ |
| Language | TypeScript | 5.3 |
| Framework | Express | 4.18 |
| Database | Supabase (PostgreSQL) | 2.39 |
| Authentication | JWT + bcryptjs | — |
| File Storage | Supabase Storage | — |
| Validation | express-validator | 7.0 |
| Security | Helmet, CORS, express-rate-limit | — |
| File Uploads | Multer (memory storage) | — |
| Logging | Morgan | — |

### Frontend

| Layer | Technology | Version |
|---|---|---|
| UI Library | React | 18.2 |
| Language | TypeScript | 5.3 |
| Build Tool | Vite | 5.1 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router DOM | 6.22 |
| HTTP Client | Axios | 1.6 |
| Icons | Lucide React | 0.344 |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MONOREPO ROOT                        │
│                                                             │
│   ┌─────────────────────┐   ┌─────────────────────────┐   │
│   │      FRONTEND        │   │        BACKEND           │   │
│   │  React + Vite        │   │   Express + TypeScript   │   │
│   │  localhost:5173      │   │   localhost:3000         │   │
│   │                      │   │                          │   │
│   │  /patient/*          │   │  /api/auth/*             │   │
│   │  /doctor/*           │──▶│  /api/doctors/*          │   │
│   │  /assistant/*        │   │  /api/appointments/*     │   │
│   │  /admin/*            │   │  /api/payments/*         │   │
│   │                      │   │  /api/history/*          │   │
│   │  Axios + JWT          │   │  /api/admin/*            │   │
│   │  interceptor          │   │  /api/clinics/*          │   │
│   └─────────────────────┘   └──────────┬──────────────┘   │
│                                          │                   │
│                               ┌──────────▼──────────┐       │
│                               │      SUPABASE        │       │
│                               │   PostgreSQL + RLS   │       │
│                               │   Storage Bucket     │       │
│                               │   Immutability       │       │
│                               │   Triggers           │       │
│                               └─────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
Browser → React (Vite:5173)
         └─ Axios (JWT header attached automatically)
              └─ Express API (Node:3000)
                   ├─ Helmet / CORS / Rate Limiter
                   ├─ JWT Middleware (authenticate)
                   ├─ RBAC Middleware (authorize)
                   ├─ express-validator (validate)
                   └─ Supabase Client (service role)
                        └─ PostgreSQL (RLS enabled)
```

---

## User Roles & Permissions

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ Role         │ Capabilities                                          │
├──────────────┼──────────────────────────────────────────────────────┤
│ patient      │ Search doctors · Book appointments · Upload payment   │
│              │ screenshots · View own medical history                │
├──────────────┼──────────────────────────────────────────────────────┤
│ doctor       │ View patient appointments · Add immutable medical     │
│              │ records · Add immutable prescriptions · Manage        │
│              │ clinic locations and schedules                        │
├──────────────┼──────────────────────────────────────────────────────┤
│ assistant    │ View pending payment screenshots · Approve or reject  │
│              │ payments · Cannot access medical history              │
├──────────────┼──────────────────────────────────────────────────────┤
│ admin        │ View system stats · List/toggle all users · Verify   │
│              │ or unverify doctor accounts                           │
├──────────────┼──────────────────────────────────────────────────────┤
│ super_admin  │ Everything admin can do + create admin accounts       │
└──────────────┴──────────────────────────────────────────────────────┘
```

Role assignment rules:
- **Patients and Doctors** self-register via `/api/auth/register`
- **Assistants and Admins** are created by an existing admin via `/api/admin/users`
- **Super Admin** is seeded directly in the database — cannot be self-registered

---

## Appointment Workflow

Doctor Hub enforces a strict 6-step workflow. Each step is a status transition in the database. No step can be skipped.

```
Step 1 ──▶ Step 2 ──▶ Step 3 ──▶ Step 4 ──▶ Step 5 ──▶ Step 6
  │            │            │           │           │           │
Patient     Patient      Payment    Assistant   Appointment  Appointment
searches    books        screenshot  reviews    CONFIRMED    COMPLETED
doctor      appointment  uploaded   payment    ✅            (after visit)
            [pending]    [payment_  [payment_
                         uploaded]  verified]
                              │
                              ▼ (if rejected)
                         Appointment CANCELLED
                         Patient notified
```

### Status State Machine

```
pending ──▶ payment_uploaded ──▶ payment_verified ──▶ confirmed ──▶ completed
   │                                    │
   └────────── cancelled ◀──────────────┘  (patient or assistant can cancel)
```

---

## Project Structure

```
doctor-hub/                         ← Monorepo root
├── package.json                    ← Root scripts (dev, build, install:all)
├── vercel.json                     ← Vercel monorepo deployment config
├── .gitignore
│
├── supabase/
│   └── migrations/
│       └── 001_schema.sql          ← Complete DB schema (run once in Supabase)
│
├── backend/                        ← Express + TypeScript API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts                ← App entry: middleware, routes, server start
│       ├── config/
│       │   └── supabase.ts         ← Service-role Supabase client
│       ├── types/
│       │   └── index.ts            ← All TypeScript interfaces and enums
│       ├── middleware/
│       │   ├── auth.ts             ← JWT verification + role authorization
│       │   ├── validate.ts         ← express-validator error formatter
│       │   └── errorHandler.ts     ← Global error + 404 handler
│       ├── controllers/
│       │   ├── auth.controller.ts       ← Register, login, profile, password reset
│       │   ├── doctor.controller.ts     ← Search, filter, update doctor
│       │   ├── appointment.controller.ts← Book, list, cancel appointments
│       │   ├── payment.controller.ts    ← Upload screenshot, verify/reject
│       │   ├── history.controller.ts    ← Append-only records + prescriptions
│       │   ├── clinic.controller.ts     ← Create and update clinics
│       │   └── admin.controller.ts      ← Stats, user management, doctor verify
│       └── routes/
│           ├── auth.routes.ts
│           ├── doctor.routes.ts
│           ├── appointment.routes.ts
│           ├── payment.routes.ts
│           ├── history.routes.ts
│           ├── clinic.routes.ts
│           └── admin.routes.ts
│
└── frontend/                       ← React + Vite + Tailwind
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts              ← Dev proxy: /api → localhost:3000
    ├── tailwind.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.tsx                ← ReactDOM root, BrowserRouter, AuthProvider
        ├── App.tsx                 ← Route tree, smart home redirect
        ├── vite-env.d.ts           ← import.meta.env types
        ├── index.css               ← Tailwind base + component classes
        ├── api/
        │   └── index.ts            ← Axios instance + JWT interceptor + API helpers
        ├── context/
        │   └── AuthContext.tsx     ← Global auth state (login, logout, refresh)
        ├── types/
        │   └── index.ts            ← Frontend TypeScript interfaces
        ├── utils/
        │   └── roleRoutes.ts       ← Maps UserRole → home path
        ├── components/
        │   ├── ProtectedRoute.tsx  ← Guards routes by allowed roles
        │   ├── ui/
        │   │   ├── index.tsx       ← StatusBadge, Toast, Modal, StatCard,
        │   │   │                     Spinner, EmptyState, LoadingScreen
        │   │   └── LoadingScreen.tsx
        │   └── layout/
        │       └── DashboardLayout.tsx ← Responsive sidebar + topbar shell
        └── pages/
            ├── auth/
            │   ├── LoginPage.tsx         ← Split-panel login with feature grid
            │   └── RegisterPage.tsx      ← Patient/Doctor self-registration
            ├── patient/
            │   ├── PatientDashboard.tsx  ← Sidebar shell + nested routes
            │   ├── SearchDoctorsPage.tsx ← Filter cards + booking modal
            │   ├── MyAppointmentsPage.tsx← 4-step progress stepper + upload
            │   └── MyHistoryPage.tsx     ← Collapsible history + prescriptions
            ├── doctor/
            │   ├── DoctorDashboard.tsx   ← Sidebar shell + nested routes
            │   ├── DoctorAppointmentsPage.tsx ← Patient list with status filter
            │   ├── AddRecordPage.tsx     ← 2-step immutable record + Rx form
            │   └── ManageClinicsPage.tsx ← Clinic cards + day/time picker
            ├── assistant/
            │   └── AssistantDashboard.tsx← Screenshot grid, preview, approve/reject
            └── admin/
                └── AdminDashboard.tsx    ← Stats, user toggle table, doctor verify
```

---

## Database Schema

### Tables

```
users               ← Central auth table for all roles
 ├── id (UUID PK)
 ├── email (unique)
 ├── password_hash
 ├── full_name
 ├── phone
 ├── role (enum: super_admin | admin | doctor | patient | assistant)
 ├── is_active
 └── created_at / updated_at

doctors             ← Extended profile for doctor role
 ├── id (UUID PK)
 ├── user_id → users.id
 ├── specialization
 ├── treatment_type (enum: allopathic | homeopathic | herbal)
 ├── diseases_treated (text array, GIN indexed)
 ├── bio
 ├── experience_years
 ├── consultation_fee
 └── is_verified

patients            ← Extended profile for patient role
 ├── id (UUID PK)
 ├── user_id → users.id
 ├── date_of_birth
 ├── gender
 ├── blood_group
 └── address

assistants          ← Links assistant user to their doctor
 ├── id (UUID PK)
 ├── user_id → users.id
 └── doctor_id → doctors.id

clinics             ← Doctor clinic locations + schedules
 ├── id (UUID PK)
 ├── doctor_id → doctors.id
 ├── name / address / city
 ├── timings (JSONB: [{day, open, close}])
 └── is_active

appointments        ← Core booking record
 ├── id (UUID PK)
 ├── patient_id → patients.id
 ├── doctor_id → doctors.id
 ├── clinic_id → clinics.id (optional)
 ├── scheduled_at
 ├── reason
 └── status (enum: 6 states)

payments            ← One payment per appointment
 ├── id (UUID PK)
 ├── appointment_id → appointments.id (unique)
 ├── patient_id → patients.id
 ├── amount
 ├── screenshot_url
 ├── status (enum: pending | verified | rejected)
 ├── verified_by → users.id
 └── rejection_note

medical_history     ← IMMUTABLE — DB triggers block UPDATE/DELETE
 ├── id (UUID PK)
 ├── patient_id → patients.id
 ├── doctor_id → doctors.id
 ├── appt_id → appointments.id (optional)
 ├── diagnosis
 ├── notes
 └── report_urls (text array)

prescriptions       ← IMMUTABLE — DB triggers block UPDATE/DELETE
 ├── id (UUID PK)
 ├── history_id → medical_history.id
 ├── doctor_id → doctors.id
 ├── patient_id → patients.id
 ├── medicines (JSONB: [{name, dosage, frequency, duration, instructions}])
 └── instructions
```

### Immutability Enforcement

Medical history and prescriptions are protected at the **database level**, not just in application code:

```sql
-- These triggers fire on ANY UPDATE or DELETE attempt — even from direct SQL
CREATE TRIGGER no_update_history
  BEFORE UPDATE ON medical_history
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER no_delete_history
  BEFORE DELETE ON medical_history
  FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

-- Same applied to prescriptions
```

---

## API Reference

Base URL (local): `http://localhost:3000`  
All protected routes require: `Authorization: Bearer <token>`

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | ❌ | email, password, full_name, role | Register patient or doctor |
| POST | `/login` | ❌ | email, password | Returns JWT token |
| GET | `/profile` | ✅ | — | Get own user profile |
| POST | `/forgot-password` | ❌ | email | Generate reset token |
| POST | `/reset-password` | ❌ | reset_token, new_password | Set new password |

### Doctors — `/api/doctors`

| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|--------------|-------------|
| GET | `/` | ❌ | treatment_type, disease, specialization, city, page, limit | Search & filter doctors |
| GET | `/:id` | ❌ | — | Get full doctor profile with clinics |
| PATCH | `/:id` | ✅ doctor/admin | JSON body | Update doctor profile |

### Appointments — `/api/appointments`

| Method | Endpoint | Auth | Body / Params | Description |
|--------|----------|------|---------------|-------------|
| POST | `/` | ✅ patient | doctor_id, scheduled_at, reason, clinic_id | Book appointment |
| GET | `/my` | ✅ patient | — | List patient's appointments |
| GET | `/doctor` | ✅ doctor | ?status= | List doctor's appointments |
| PATCH | `/:id/cancel` | ✅ patient/admin | — | Cancel appointment |

### Payments — `/api/payments`

| Method | Endpoint | Auth | Body / Params | Description |
|--------|----------|------|---------------|-------------|
| POST | `/:appointment_id/screenshot` | ✅ patient | multipart: screenshot (image, max 5MB) | Upload payment proof |
| GET | `/pending` | ✅ assistant/admin | — | List unverified payments |
| PATCH | `/:id/verify` | ✅ assistant/admin | action: 'approve'\|'reject', rejection_note | Verify payment |
| GET | `/appointment/:appointment_id` | ✅ any | — | Get payment for an appointment |

### Medical History — `/api/history`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| GET | `/my` | ✅ patient | — | Own full medical history |
| GET | `/patient/:patient_id` | ✅ doctor/admin | — | Patient history (for doctor) |
| POST | `/` | ✅ doctor | patient_id, diagnosis, notes, appt_id | Add history record (append-only) |
| POST | `/prescriptions` | ✅ doctor | history_id, medicines[], instructions | Add prescription (immutable) |
| GET | `/prescriptions/:id` | ✅ any | — | Get single prescription |

### Admin — `/api/admin` *(admin + super_admin only)*

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/stats` | — | Total users, verified doctors, appointments, pending payments |
| GET | `/users` | ?role=, ?page= | Paginated user list with role filter |
| PATCH | `/users/:id/toggle` | is_active: boolean | Activate or deactivate user |
| POST | `/users` | email, password, full_name, role, doctor_id | Create assistant/admin |
| PATCH | `/doctors/:id/verify` | is_verified: boolean | Verify or unverify doctor |

### Clinics — `/api/clinics`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| GET | `/my` | ✅ doctor | — | Own clinic list |
| POST | `/` | ✅ doctor | name, address, city, timings[] | Create clinic |
| PATCH | `/:id` | ✅ doctor/admin | JSON body | Update clinic |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{ status: "OK", timestamp }` |

---

## Frontend Pages & Components

### Auth Pages

| Page | Route | Description |
|---|---|---|
| LoginPage | `/login` | Split-panel design with feature highlights, JWT stored on success |
| RegisterPage | `/register` | Dynamic form — shows doctor-specific fields when role = doctor |

### Patient Portal (`/patient/*`)

| Page | Route | Key Features |
|---|---|---|
| SearchDoctorsPage | `/patient/search` | Filter by treatment type, disease, specialization; booking modal with clinic picker |
| MyAppointmentsPage | `/patient/appointments` | 4-step progress stepper, inline payment screenshot upload |
| MyHistoryPage | `/patient/history` | Collapsible cards with prescription details, immutability notice |

### Doctor Portal (`/doctor/*`)

| Page | Route | Key Features |
|---|---|---|
| DoctorAppointmentsPage | `/doctor/appointments` | Patient list with status filter, contact info |
| AddRecordPage | `/doctor/add-record` | 2-step form: history → prescription; lock warnings; no edit/delete UI |
| ManageClinicsPage | `/doctor/clinics` | Clinic cards, day/time picker for working hours |

### Assistant Portal (`/assistant`)

| Page | Route | Key Features |
|---|---|---|
| AssistantDashboard | `/assistant` | Screenshot thumbnails, full preview modal, approve/reject with mandatory rejection reason |

### Admin Portal (`/admin/*`)

| Page | Route | Key Features |
|---|---|---|
| StatsPage | `/admin/stats` | 4 stat cards: users, doctors, appointments, pending payments |
| UsersPage | `/admin/users` | Role-filtered table with toggle switches for activate/deactivate |
| DoctorVerificationPage | `/admin/doctors` | Doctor cards with verified toggle |

### Shared Components

| Component | Purpose |
|---|---|
| `DashboardLayout` | Responsive sidebar + topbar shell used by all 5 portals |
| `ProtectedRoute` | Wraps role-gated routes; redirects to `/login` or `/unauthorized` |
| `AuthContext` | Global auth state; restores session from localStorage on mount |
| `StatusBadge` | Color-coded badge for appointment/payment/treatment status |
| `Toast` | Auto-dismissing success/error notification (bottom-right) |
| `Modal` | Backdrop overlay modal with title bar |
| `StatCard` | Icon + number + label dashboard card |
| `EmptyState` | Emoji + title + description for empty lists |
| `Spinner` | Lucide Loader2 with spin animation |

---

## Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs with 12 salt rounds |
| JWT authentication | `jsonwebtoken`, 7-day expiry, verified on every protected request |
| Role-based access | `authorize(...roles)` middleware on every route |
| HTTP security headers | Helmet (XSS, CSRF, clickjacking protection) |
| Rate limiting | 200 req/15 min globally; 20 req/15 min on auth routes |
| Input validation | express-validator on all POST/PATCH bodies |
| File upload safety | Multer: images only (JPEG/PNG/WebP), max 5 MB |
| CORS | Configurable `ALLOWED_ORIGINS` env variable |
| DB immutability | PostgreSQL triggers prevent any UPDATE/DELETE on records |
| RLS | Row-Level Security enabled on all tables (service role bypasses; app enforces) |
| Token auto-refresh | Axios 401 interceptor clears token and redirects to `/login` |

---

## Setup & Installation

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A free [Supabase](https://supabase.com) account

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/doctor-hub.git
cd doctor-hub
```

### Step 2 — Set up the Supabase database

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**, paste the entire contents of `supabase/migrations/001_schema.sql`
4. Click **Run** — all tables, enums, triggers, and indexes will be created
5. Go to **Storage** → **New Bucket** → name it `payment-screenshots` → set to **Public**
6. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 3 — Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

JWT_SECRET=a-random-string-at-least-32-characters-long
JWT_EXPIRES_IN=7d

STORAGE_BUCKET=payment-screenshots
ALLOWED_ORIGINS=http://localhost:5173
```

### Step 4 — Configure frontend environment

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3000
```

---

## Running the Project

### Option A — Run both together from root

```bash
# From monorepo root
npm install
npm run install:all
npm run dev
```

This starts both servers concurrently:
- Backend → `http://localhost:3000`
- Frontend → `http://localhost:5173`

### Option B — Run separately

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

### Production build

```bash
# From monorepo root
npm run build

# Backend: compiled to backend/dist/
# Frontend: compiled to frontend/dist/
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (keep secret!) |
| `JWT_SECRET` | ✅ | Minimum 32-character random string |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `STORAGE_BUCKET` | No | Storage bucket name (default: `payment-screenshots`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend base URL (default: `http://localhost:3000`) |

---

## Deployment (Vercel)

### Deploy frontend (recommended: standalone)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.vercel.app`
5. Deploy

### Deploy backend

1. Create a second Vercel project → set **Root Directory** to `backend`
2. Add all backend environment variables in Vercel dashboard
3. Deploy

### Or use the root `vercel.json` for monorepo deployment

The root `vercel.json` configures both builds and routes `/api/*` to the backend and `/*` to the frontend.

---

## Marks Distribution

| Module | Marks | What Was Built |
|---|---|---|
| Architecture Design | 15 | Monorepo structure, layered MVC backend, component-based React frontend, clear separation of concerns |
| Database Design | 15 | 9 normalized tables, enums, GIN indexes, foreign key constraints, JSONB for flexible data |
| Authentication & RBAC | 10 | JWT auth, bcrypt hashing, 5-role middleware guards, token interceptor |
| Workflow Logic | 15 | 6-step appointment state machine, payment verification flow, immutability triggers |
| API & Backend | 10 | 30+ REST endpoints, full validation, rate limiting, error handling, file uploads |
| Frontend UX | 10 | 5 role dashboards, responsive sidebar layout, booking flow, payment upload, stepper UI |
| Analytics & Reports | 10 | Admin stats dashboard, paginated user table, doctor verification panel |
| Code Quality | 5 | Full TypeScript, zero compiler errors, consistent naming, shared components |
| Deployment | 5 | Vercel config, .env.example for both packages, production build scripts |
| Viva & Presentation | 5 | This README 😊 |
| **Total** | **100** | |

---

## Quick Test Walkthrough

Once running, test the complete workflow:

```
1. Register as a patient at /register
2. Register as a doctor at /register (role: doctor)
3. Log in as admin (seed via Supabase SQL: INSERT INTO users...)
4. Admin verifies the doctor at /admin/doctors
5. Log back in as patient → Search doctors → Book appointment
6. Upload a payment screenshot on the appointment card
7. Log in as assistant → Approve the payment
8. Appointment status changes to "confirmed" ✅
9. Log in as doctor → Add medical record → Add prescription
10. Log in as patient → View Medical History → see the immutable record
```

---

*Doctor Hub — Final Semester Project · COMSATS University Islamabad, Vehari Campus*

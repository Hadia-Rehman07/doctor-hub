-- ============================================================
--  Doctor Hub – Full Database Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- ENUM TYPES
-- ──────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('super_admin','admin','doctor','patient','assistant');
CREATE TYPE treatment_type  AS ENUM ('allopathic','homeopathic','herbal');
CREATE TYPE appt_status     AS ENUM ('pending','payment_uploaded','payment_verified','confirmed','cancelled','completed');
CREATE TYPE payment_status  AS ENUM ('pending','verified','rejected');

-- ──────────────────────────────────────────────
-- USERS  (central auth table)
-- ──────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  role          user_role NOT NULL DEFAULT 'patient',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- DOCTORS
-- ──────────────────────────────────────────────
CREATE TABLE doctors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization   TEXT NOT NULL,
  treatment_type   treatment_type NOT NULL,
  diseases_treated TEXT[] DEFAULT '{}',
  bio              TEXT,
  experience_years INT DEFAULT 0,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- PATIENTS
-- ──────────────────────────────────────────────
CREATE TABLE patients (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender       TEXT,
  blood_group  TEXT,
  address      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- ASSISTANTS
-- ──────────────────────────────────────────────
CREATE TABLE assistants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id  UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- CLINICS
-- ──────────────────────────────────────────────
CREATE TABLE clinics (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id  UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  address    TEXT NOT NULL,
  city       TEXT NOT NULL,
  timings    JSONB DEFAULT '[]',   -- [{day:"Mon", open:"09:00", close:"17:00"}]
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- APPOINTMENTS
-- ──────────────────────────────────────────────
CREATE TABLE appointments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id   UUID NOT NULL REFERENCES patients(id),
  doctor_id    UUID NOT NULL REFERENCES doctors(id),
  clinic_id    UUID REFERENCES clinics(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  reason       TEXT,
  status       appt_status NOT NULL DEFAULT 'pending',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- PAYMENTS
-- ──────────────────────────────────────────────
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID UNIQUE NOT NULL REFERENCES appointments(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  amount          NUMERIC(10,2) NOT NULL,
  screenshot_url  TEXT,
  status          payment_status NOT NULL DEFAULT 'pending',
  verified_by     UUID REFERENCES users(id),   -- assistant user id
  verified_at     TIMESTAMPTZ,
  rejection_note  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- MEDICAL HISTORY  (IMMUTABLE – no UPDATE/DELETE allowed)
-- ──────────────────────────────────────────────
CREATE TABLE medical_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  doctor_id   UUID NOT NULL REFERENCES doctors(id),
  appt_id     UUID REFERENCES appointments(id),
  diagnosis   TEXT NOT NULL,
  notes       TEXT,
  report_urls TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO updated_at – records are append-only
);

-- ──────────────────────────────────────────────
-- PRESCRIPTIONS  (IMMUTABLE – no UPDATE/DELETE allowed)
-- ──────────────────────────────────────────────
CREATE TABLE prescriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  history_id  UUID NOT NULL REFERENCES medical_history(id),
  doctor_id   UUID NOT NULL REFERENCES doctors(id),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  medicines   JSONB NOT NULL DEFAULT '[]',
  -- [{ name, dosage, frequency, duration, instructions }]
  instructions TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NO updated_at – immutable
);

-- ──────────────────────────────────────────────
-- ROW-LEVEL SECURITY (RLS) – baseline policies
-- ──────────────────────────────────────────────
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions    ENABLE ROW LEVEL SECURITY;

-- Service-role bypasses RLS (used by our backend)
-- All fine-grained access control is enforced in application middleware.

-- ──────────────────────────────────────────────
-- IMMUTABILITY TRIGGERS
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION prevent_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Records in % are immutable and cannot be modified or deleted.', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER no_update_medical_history
  BEFORE UPDATE ON medical_history FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER no_delete_medical_history
  BEFORE DELETE ON medical_history FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

CREATE TRIGGER no_update_prescriptions
  BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION prevent_mutation();
CREATE TRIGGER no_delete_prescriptions
  BEFORE DELETE ON prescriptions FOR EACH ROW EXECUTE FUNCTION prevent_mutation();

-- ──────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appts_updated_at   BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────
CREATE INDEX idx_doctors_treatment   ON doctors(treatment_type);
CREATE INDEX idx_doctors_diseases    ON doctors USING GIN(diseases_treated);
CREATE INDEX idx_appts_patient       ON appointments(patient_id);
CREATE INDEX idx_appts_doctor        ON appointments(doctor_id);
CREATE INDEX idx_appts_status        ON appointments(status);
CREATE INDEX idx_history_patient     ON medical_history(patient_id);
CREATE INDEX idx_prescriptions_pat   ON prescriptions(patient_id);

export type UserRole = 'super_admin' | 'admin' | 'doctor' | 'patient' | 'assistant';
export type TreatmentType = 'allopathic' | 'homeopathic' | 'herbal';
export type AppointmentStatus =
  | 'pending'
  | 'payment_uploaded'
  | 'payment_verified'
  | 'confirmed'
  | 'cancelled'
  | 'completed';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  treatment_type: TreatmentType;
  diseases_treated: string[];
  bio?: string;
  experience_years: number;
  consultation_fee: number;
  is_verified: boolean;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id?: string;
  scheduled_at: string;
  reason?: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  appointment_id: string;
  patient_id: string;
  amount: number;
  screenshot_url?: string;
  status: PaymentStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_note?: string;
}

export interface MedicalHistory {
  id: string;
  patient_id: string;
  doctor_id: string;
  appt_id?: string;
  diagnosis: string;
  notes?: string;
  report_urls: string[];
  created_at: string;
}

export interface Prescription {
  id: string;
  history_id: string;
  doctor_id: string;
  patient_id: string;
  medicines: Medicine[];
  instructions?: string;
  created_at: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// JWT payload
export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

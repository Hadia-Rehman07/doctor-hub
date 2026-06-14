export type UserRole = 'super_admin' | 'admin' | 'doctor' | 'patient' | 'assistant'
export type TreatmentType = 'allopathic' | 'homeopathic' | 'herbal'
export type AppointmentStatus =
  | 'pending'
  | 'payment_uploaded'
  | 'payment_verified'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Doctor {
  id: string
  user_id: string
  specialization: string
  treatment_type: TreatmentType
  diseases_treated: string[]
  bio?: string
  experience_years: number
  consultation_fee: number
  is_verified: boolean
  users: { full_name: string; email: string; phone?: string }
  clinics?: Clinic[]
}

export interface Patient {
  id: string
  user_id: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
  users?: { full_name: string; phone?: string }
}

export interface Clinic {
  id: string
  doctor_id: string
  name: string
  address: string
  city: string
  timings: ClinicTiming[]
  is_active: boolean
}

export interface ClinicTiming {
  day: string
  open: string
  close: string
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  clinic_id?: string
  scheduled_at: string
  reason?: string
  status: AppointmentStatus
  notes?: string
  created_at: string
  doctors?: { specialization: string; treatment_type: string; users: { full_name: string } }
  patients?: { date_of_birth?: string; gender?: string; users: { full_name: string; phone?: string } }
  payments?: { status: PaymentStatus; amount: number }[]
}

export interface Payment {
  id: string
  appointment_id: string
  patient_id: string
  amount: number
  screenshot_url?: string
  status: PaymentStatus
  verified_by?: string
  verified_at?: string
  rejection_note?: string
  created_at: string
  appointments?: {
    scheduled_at: string
    reason?: string
    status: AppointmentStatus
    doctors: { users: { full_name: string }; specialization: string }
    patients: { users: { full_name: string; phone?: string } }
  }
}

export interface MedicalHistory {
  id: string
  patient_id: string
  doctor_id: string
  appt_id?: string
  diagnosis: string
  notes?: string
  report_urls: string[]
  created_at: string
  doctors?: { specialization: string; treatment_type: string; users: { full_name: string } }
  prescriptions?: Prescription[]
}

export interface Prescription {
  id: string
  history_id: string
  doctor_id: string
  patient_id: string
  medicines: Medicine[]
  instructions?: string
  created_at: string
}

export interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

export interface DashboardStats {
  total_users: number
  verified_doctors: number
  total_appointments: number
  pending_payments: number
}

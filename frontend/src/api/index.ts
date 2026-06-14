import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor: attach JWT from localStorage ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dh_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dh_token')
      localStorage.removeItem('dh_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Typed API helpers ────────────────────────────────────────────────────────

// Auth
export const authApi = {
  register: (data: object) => api.post('/api/auth/register', data),
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  profile: () => api.get('/api/auth/profile'),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (reset_token: string, new_password: string) =>
    api.post('/api/auth/reset-password', { reset_token, new_password }),
}

// Doctors
export const doctorApi = {
  list: (params?: object) => api.get('/api/doctors', { params }),
  getById: (id: string) => api.get(`/api/doctors/${id}`),
  update: (id: string, data: object) => api.patch(`/api/doctors/${id}`, data),
}

// Appointments
export const appointmentApi = {
  book: (data: object) => api.post('/api/appointments', data),
  myAppointments: () => api.get('/api/appointments/my'),
  doctorAppointments: (status?: string) =>
    api.get('/api/appointments/doctor', { params: status ? { status } : undefined }),
  cancel: (id: string) => api.patch(`/api/appointments/${id}/cancel`),
}

// Payments
export const paymentApi = {
  uploadScreenshot: (appointmentId: string, file: File) => {
    const form = new FormData()
    form.append('screenshot', file)
    return api.post(`/api/payments/${appointmentId}/screenshot`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  pending: () => api.get('/api/payments/pending'),
  verify: (id: string, action: 'approve' | 'reject', rejection_note?: string) =>
    api.patch(`/api/payments/${id}/verify`, { action, rejection_note }),
  getByAppointment: (appointmentId: string) =>
    api.get(`/api/payments/appointment/${appointmentId}`),
}

// Medical History
export const historyApi = {
  myHistory: () => api.get('/api/history/my'),
  patientHistory: (patientId: string) => api.get(`/api/history/patient/${patientId}`),
  addRecord: (data: object) => api.post('/api/history', data),
  addPrescription: (data: object) => api.post('/api/history/prescriptions', data),
  getPrescription: (id: string) => api.get(`/api/history/prescriptions/${id}`),
}

// Admin
export const adminApi = {
  stats: () => api.get('/api/admin/stats'),
  users: (params?: object) => api.get('/api/admin/users', { params }),
  toggleUser: (id: string, is_active: boolean) =>
    api.patch(`/api/admin/users/${id}/toggle`, { is_active }),
  createUser: (data: object) => api.post('/api/admin/users', data),
  verifyDoctor: (id: string, is_verified: boolean) =>
    api.patch(`/api/admin/doctors/${id}/verify`, { is_verified }),
}

// Clinics
export const clinicApi = {
  myClinics: () => api.get('/api/clinics/my'),
  create: (data: object) => api.post('/api/clinics', data),
  update: (id: string, data: object) => api.patch(`/api/clinics/${id}`, data),
}

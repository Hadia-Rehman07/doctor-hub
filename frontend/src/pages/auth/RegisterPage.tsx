import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '', role: 'patient',
    specialization: '', treatment_type: 'allopathic', consultation_fee: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload: any = { full_name: form.full_name, email: form.email, password: form.password, phone: form.phone, role: form.role }
      if (form.role === 'doctor') {
        payload.specialization = form.specialization
        payload.treatment_type = form.treatment_type
        payload.consultation_fee = parseFloat(form.consultation_fee) || 0
      }
      const res = await authApi.register(payload)
      localStorage.setItem('dh_token', res.data.token)
      localStorage.setItem('dh_user', JSON.stringify(res.data.user))
      navigate(form.role === 'doctor' ? '/doctor' : '/patient')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">🏥</div>
          <span className="font-semibold text-slate-800">Doctor Hub</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Create your account</h1>
        <p className="text-slate-500 text-sm mb-6">Join Doctor Hub as a patient or doctor.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 shadow-card border border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full name</label>
              <input className="input" placeholder="Dr. Ayesha Khan" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min 8 chars" value={form.password} onChange={set('password')} required minLength={8} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+92 300 0000000" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="col-span-2">
              <label className="label">Register as</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {form.role === 'doctor' && (
              <>
                <div className="col-span-2">
                  <label className="label">Specialization</label>
                  <input className="input" placeholder="Cardiologist, General Physician…" value={form.specialization} onChange={set('specialization')} required />
                </div>
                <div>
                  <label className="label">Treatment type</label>
                  <select className="input" value={form.treatment_type} onChange={set('treatment_type')}>
                    <option value="allopathic">Allopathic</option>
                    <option value="homeopathic">Homeopathic</option>
                    <option value="herbal">Herbal</option>
                  </select>
                </div>
                <div>
                  <label className="label">Consultation fee (PKR)</label>
                  <input className="input" type="number" placeholder="1500" value={form.consultation_fee} onChange={set('consultation_fee')} />
                </div>
              </>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage

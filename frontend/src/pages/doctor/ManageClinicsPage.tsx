import React, { useState, useEffect } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { clinicApi } from '../../api'
import { Clinic } from '../../types'
import { Spinner, EmptyState, Modal, Toast } from '../../components/ui'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ManageClinicsPage: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '' })
  const [timings, setTimings] = useState<{ day: string; open: string; close: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const fetch = async () => {
    setLoading(true)
    try { const res = await clinicApi.myClinics(); setClinics(res.data.clinics) }
    catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const toggleDay = (day: string) => {
    setTimings((t) =>
      t.find((x) => x.day === day) ? t.filter((x) => x.day !== day) : [...t, { day, open: '09:00', close: '17:00' }]
    )
  }

  const setTiming = (day: string, field: 'open' | 'close', val: string) =>
    setTimings((t) => t.map((x) => x.day === day ? { ...x, [field]: val } : x))

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await clinicApi.create({ ...form, timings })
      setToast({ msg: 'Clinic added successfully.', type: 'success' })
      setShowModal(false); setForm({ name: '', address: '', city: '' }); setTimings([])
      fetch()
    } catch (err: any) {
      setToast({ msg: err.response?.data?.message ?? 'Failed to create clinic.', type: 'error' })
    } finally { setSubmitting(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Clinics</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your clinic locations and schedules.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Clinic
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : clinics.length === 0 ? (
        <EmptyState icon="🏥" title="No clinics yet" description="Add your first clinic to allow patients to book appointments." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{clinic.name}</p>
                  <p className="text-slate-500 text-xs">{clinic.address}</p>
                  <p className="text-slate-400 text-xs">{clinic.city}</p>
                </div>
              </div>
              {clinic.timings?.length > 0 && (
                <div className="space-y-1">
                  {clinic.timings.map((t) => (
                    <div key={t.day} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 w-8">{t.day}</span>
                      <span className="text-slate-700 font-medium">{t.open} – {t.close}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Clinic">
        <div className="space-y-4">
          <div>
            <label className="label">Clinic name</label>
            <input className="input" placeholder="City Care Clinic" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="123 Main St" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" placeholder="Lahore" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>

          <div>
            <label className="label">Working days & hours</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DAYS.map((day) => {
                const active = timings.find((t) => t.day === day)
                return (
                  <button key={day} onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                      ${active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
            {timings.map((t) => (
              <div key={t.day} className="flex items-center gap-3 mb-2">
                <span className="text-xs font-medium text-slate-600 w-8">{t.day}</span>
                <input type="time" className="input py-1 text-xs" value={t.open}
                  onChange={(e) => setTiming(t.day, 'open', e.target.value)} />
                <span className="text-slate-400 text-xs">to</span>
                <input type="time" className="input py-1 text-xs" value={t.close}
                  onChange={(e) => setTiming(t.day, 'close', e.target.value)} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1 justify-center" disabled={submitting || !form.name || !form.city}
              onClick={handleCreate}>
              {submitting ? 'Saving…' : 'Add Clinic'}
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default ManageClinicsPage

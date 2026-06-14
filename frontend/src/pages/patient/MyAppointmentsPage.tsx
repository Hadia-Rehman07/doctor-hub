import React, { useState, useEffect, useRef } from 'react'
import { Upload, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { appointmentApi, paymentApi } from '../../api'
import { Appointment } from '../../types'
import { StatusBadge, Spinner, EmptyState, Toast } from '../../components/ui'

const STEP_LABELS = [
  { status: 'pending', label: 'Booked', icon: <Clock className="w-4 h-4" /> },
  { status: 'payment_uploaded', label: 'Payment Uploaded', icon: <Upload className="w-4 h-4" /> },
  { status: 'payment_verified', label: 'Payment Verified', icon: <AlertCircle className="w-4 h-4" /> },
  { status: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="w-4 h-4" /> },
]

const stepIndex = (status: string) => STEP_LABELS.findIndex((s) => s.status === status)

const MyAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await appointmentApi.myAppointments()
      setAppointments(res.data.appointments)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const triggerUpload = (apptId: string) => {
    setUploadTarget(apptId)
    fileRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return
    setUploading(uploadTarget)
    try {
      await paymentApi.uploadScreenshot(uploadTarget, file)
      setToast({ msg: 'Screenshot uploaded! Awaiting assistant verification.', type: 'success' })
      await fetch()
    } catch (err: any) {
      setToast({ msg: err.response?.data?.message ?? 'Upload failed.', type: 'error' })
    } finally { setUploading(null); setUploadTarget(null); e.target.value = '' }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await appointmentApi.cancel(id)
      await fetch()
      setToast({ msg: 'Appointment cancelled.', type: 'success' })
    } catch (err: any) {
      setToast({ msg: err.response?.data?.message ?? 'Could not cancel.', type: 'error' })
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Appointments</h2>
        <p className="text-slate-500 text-sm mt-1">Track your bookings through the 6-step workflow.</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : appointments.length === 0 ? (
        <EmptyState icon="📅" title="No appointments yet" description="Search for a doctor and book your first appointment." />
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const currentStep = stepIndex(appt.status)
            const isActive = !['cancelled', 'completed'].includes(appt.status)
            const payment = appt.payments?.[0]

            return (
              <div key={appt.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Dr. {appt.doctors?.users?.full_name ?? '—'}
                    </p>
                    <p className="text-slate-500 text-sm">{appt.doctors?.specialization}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {new Date(appt.scheduled_at).toLocaleString()} {appt.reason ? `· ${appt.reason}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={appt.status} />
                    {payment && <span className="text-xs text-slate-500">PKR {payment.amount.toLocaleString()}</span>}
                  </div>
                </div>

                {/* Progress stepper */}
                {isActive && (
                  <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                    {STEP_LABELS.map((step, i) => (
                      <React.Fragment key={step.status}>
                        <div className={`flex items-center gap-1.5 text-xs font-medium shrink-0 px-2 py-1 rounded-full
                          ${i <= currentStep ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                          {step.icon} {step.label}
                        </div>
                        {i < STEP_LABELS.length - 1 && (
                          <div className={`w-4 h-0.5 shrink-0 ${i < currentStep ? 'bg-teal-400' : 'bg-slate-200'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {appt.status === 'cancelled' && (
                  <div className="flex items-center gap-2 text-red-500 text-xs mb-4">
                    <XCircle className="w-4 h-4" /> Appointment cancelled
                  </div>
                )}
                {appt.status === 'completed' && (
                  <div className="flex items-center gap-2 text-teal-600 text-xs mb-4">
                    <CheckCircle className="w-4 h-4" /> Appointment completed
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {appt.status === 'pending' && (
                    <button
                      className="btn-primary text-xs py-1.5"
                      disabled={uploading === appt.id}
                      onClick={() => triggerUpload(appt.id)}>
                      <Upload className="w-3.5 h-3.5" />
                      {uploading === appt.id ? 'Uploading…' : 'Upload Payment'}
                    </button>
                  )}
                  {isActive && appt.status !== 'confirmed' && (
                    <button className="btn-secondary text-xs py-1.5" onClick={() => handleCancel(appt.id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default MyAppointmentsPage

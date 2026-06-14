import React, { useState, useEffect } from 'react'
import { appointmentApi } from '../../api'
import { Appointment } from '../../types'
import { StatusBadge, Spinner, EmptyState } from '../../components/ui'

const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await appointmentApi.doctorAppointments(filter || undefined)
      setAppointments(res.data.appointments)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [filter])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Patient Appointments</h2>
          <p className="text-slate-500 text-sm mt-1">View and manage your scheduled consultations.</p>
        </div>
        <select className="input w-auto text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : appointments.length === 0 ? (
        <EmptyState icon="📅" title="No appointments" description="No appointments match the selected filter." />
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {appt.patients?.users?.full_name ?? 'Patient'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {appt.patients?.users?.phone && `📞 ${appt.patients.users.phone} · `}
                    {appt.patients?.gender && `${appt.patients.gender} · `}
                    {new Date(appt.scheduled_at).toLocaleString()}
                  </p>
                  {appt.reason && <p className="text-slate-500 text-xs mt-1 italic">"{appt.reason}"</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={appt.status} />
                  {appt.payments?.[0] && (
                    <span className="text-xs text-slate-500">PKR {appt.payments[0].amount.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorAppointmentsPage

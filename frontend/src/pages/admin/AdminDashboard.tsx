import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { BarChart2, Users, UserCheck, Settings } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { adminApi, doctorApi } from '../../api'
import { User, DashboardStats, Doctor } from '../../types'
import { Spinner, EmptyState, StatCard, Toast, StatusBadge } from '../../components/ui'

// ── Stats Overview ────────────────────────────────────────────────────────────
const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats()
      .then((r) => setStats(r.data.stats))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">System Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.total_users ?? 0} icon="👥" color="bg-blue-50 text-blue-600" />
        <StatCard label="Verified Doctors" value={stats?.verified_doctors ?? 0} icon="🩺" color="bg-teal-50 text-teal-600" />
        <StatCard label="Total Appointments" value={stats?.total_appointments ?? 0} icon="📅" color="bg-purple-50 text-purple-600" />
        <StatCard label="Pending Payments" value={stats?.pending_payments ?? 0} icon="💳" color="bg-amber-50 text-amber-600" />
      </div>
    </div>
  )
}

// ── User Management ───────────────────────────────────────────────────────────
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [roleFilter, setRoleFilter] = useState('')

  const fetch = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (roleFilter) params.role = roleFilter
      const res = await adminApi.users(params)
      setUsers(res.data.users)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [roleFilter])

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await adminApi.toggleUser(id, !current)
      setToast({ msg: `User ${!current ? 'activated' : 'deactivated'}.`, type: 'success' })
      await fetch()
    } catch {
      setToast({ msg: 'Action failed.', type: 'error' })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">All Users</h2>
        <select className="input w-auto text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="assistant">Assistant</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon="👤" title="No users found" />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">{u.full_name}</td>
                    <td className="px-5 py-3 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3"><StatusBadge status={u.role} /></td>
                    <td className="px-5 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggle(u.id, u.is_active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200
                          ${u.is_active ? 'bg-teal-500' : 'bg-slate-300'}`}
                        title={u.is_active ? 'Deactivate user' : 'Activate user'}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
                          ${u.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Doctor Verification ───────────────────────────────────────────────────────
const DoctorVerificationPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const fetch = async () => {
    setLoading(true)
    try { const res = await doctorApi.list({ limit: 50 }); setDoctors(res.data.doctors) }
    catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleVerify = async (id: string, current: boolean) => {
    try {
      await adminApi.verifyDoctor(id, !current)
      setToast({ msg: `Doctor ${!current ? 'verified' : 'unverified'}.`, type: 'success' })
      await fetch()
    } catch { setToast({ msg: 'Action failed.', type: 'error' }) }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">Doctor Verification</h2>
      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : doctors.length === 0 ? (
        <EmptyState icon="🩺" title="No doctors registered" />
      ) : (
        <div className="space-y-3">
          {doctors.map((doc) => (
            <div key={doc.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{doc.users?.full_name}</p>
                <p className="text-slate-500 text-xs">{doc.specialization} · {doc.treatment_type}</p>
                <p className="text-slate-400 text-xs">{doc.experience_years} yrs exp · PKR {doc.consultation_fee.toLocaleString()} fee</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={doc.is_verified ? 'verified' : 'pending'} />
                <button
                  onClick={() => handleVerify(doc.id, doc.is_verified)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200
                    ${doc.is_verified ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
                    ${doc.is_verified ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Admin Dashboard Shell ─────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const navItems = [
    { label: 'Overview', to: '/admin/stats', icon: <BarChart2 className="w-4 h-4" /> },
    { label: 'Users', to: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Verify Doctors', to: '/admin/doctors', icon: <UserCheck className="w-4 h-4" /> },
  ]

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel" subtitle="System Administration">
      <Routes>
        <Route index element={<Navigate to="stats" replace />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="doctors" element={<DoctorVerificationPage />} />
      </Routes>
    </DashboardLayout>
  )
}

export default AdminDashboard

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Calendar, FilePlus, MapPin, User } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import DoctorAppointmentsPage from './DoctorAppointmentsPage'
import AddRecordPage from './AddRecordPage'
import ManageClinicsPage from './ManageClinicsPage'
import { useAuth } from '../../context/AuthContext'

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth()
  const navItems = [
    { label: 'Appointments', to: '/doctor/appointments', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Add Medical Record', to: '/doctor/add-record', icon: <FilePlus className="w-4 h-4" /> },
    { label: 'My Clinics', to: '/doctor/clinics', icon: <MapPin className="w-4 h-4" /> },
  ]

  return (
    <DashboardLayout navItems={navItems} title={`Dr. ${user?.full_name?.split(' ').slice(-1)[0]}'s Portal`} subtitle="Doctor Portal">
      <Routes>
        <Route index element={<Navigate to="appointments" replace />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="add-record" element={<AddRecordPage />} />
        <Route path="clinics" element={<ManageClinicsPage />} />
      </Routes>
    </DashboardLayout>
  )
}

export default DoctorDashboard

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Search, Calendar, FileText, Home } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import SearchDoctorsPage from './SearchDoctorsPage'
import MyAppointmentsPage from './MyAppointmentsPage'
import MyHistoryPage from './MyHistoryPage'
import { useAuth } from '../../context/AuthContext'

const PatientDashboard: React.FC = () => {
  const { user } = useAuth()
  const navItems = [
    { label: 'Find Doctors', to: '/patient/search', icon: <Search className="w-4 h-4" /> },
    { label: 'My Appointments', to: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Medical History', to: '/patient/history', icon: <FileText className="w-4 h-4" /> },
  ]

  return (
    <DashboardLayout navItems={navItems} title={`Welcome, ${user?.full_name?.split(' ')[0]}`} subtitle="Patient Portal">
      <Routes>
        <Route index element={<Navigate to="search" replace />} />
        <Route path="search" element={<SearchDoctorsPage />} />
        <Route path="appointments" element={<MyAppointmentsPage />} />
        <Route path="history" element={<MyHistoryPage />} />
      </Routes>
    </DashboardLayout>
  )
}

export default PatientDashboard

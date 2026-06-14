import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserRole } from '../types'
import LoadingScreen from '../components/ui/LoadingScreen'

interface Props {
  allowedRoles: UserRole[]
}

const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}

export default ProtectedRoute

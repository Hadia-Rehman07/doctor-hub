import { UserRole } from '../types'

export const getRoleHomePath = (role: UserRole): string => {
  switch (role) {
    case 'patient':    return '/patient'
    case 'doctor':     return '/doctor'
    case 'assistant':  return '/assistant'
    case 'admin':      return '/admin'
    case 'super_admin': return '/admin'
    default:           return '/login'
  }
}

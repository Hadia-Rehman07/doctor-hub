import React from 'react'
import { Loader2 } from 'lucide-react'

// ── Loading Screen ────────────────────────────────────────────────────────────
export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
        <span className="text-white text-xl">🏥</span>
      </div>
      <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
      <p className="text-sm text-slate-500">Loading Doctor Hub…</p>
    </div>
  </div>
)

export default LoadingScreen

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <Loader2 className={`animate-spin text-teal-600 ${className}`} />
)

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-amber-100 text-amber-700',
  payment_uploaded: 'bg-blue-100 text-blue-700',
  payment_verified: 'bg-purple-100 text-purple-700',
  confirmed:        'bg-teal-100 text-teal-700',
  cancelled:        'bg-red-100 text-red-700',
  completed:        'bg-slate-100 text-slate-600',
  verified:         'bg-teal-100 text-teal-700',
  rejected:         'bg-red-100 text-red-700',
  allopathic:       'bg-blue-100 text-blue-700',
  homeopathic:      'bg-green-100 text-green-700',
  herbal:           'bg-emerald-100 text-emerald-700',
}

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`badge ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {status.replace(/_/g, ' ')}
  </span>
)

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastProps { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }
export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  const colors = { success: 'bg-teal-600', error: 'bg-red-500', info: 'bg-slate-700' }
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 ${colors[type]} text-white
                     text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: string; title: string; description?: string }> = ({
  icon = '📭', title, description
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">{icon}</span>
    <h3 className="text-base font-semibold text-slate-700">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
  </div>
)

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal: React.FC<{
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}> = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Stats Card ────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string; value: number | string; icon: string; color?: string
}> = ({ label, value, icon, color = 'bg-teal-50 text-teal-600' }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  </div>
)

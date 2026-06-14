import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react'
import { paymentApi } from '../../api'
import { Payment } from '../../types'
import { Spinner, EmptyState, Modal, Toast } from '../../components/ui'
import DashboardLayout from '../../components/layout/DashboardLayout'

const AssistantDashboard: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Payment | null>(null)
  const [rejectModal, setRejectModal] = useState<Payment | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const fetch = async () => {
    setLoading(true)
    try { const res = await paymentApi.pending(); setPayments(res.data.payments) }
    catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleVerify = async (id: string, action: 'approve' | 'reject', note?: string) => {
    setProcessing(id)
    try {
      await paymentApi.verify(id, action, note)
      setToast({ msg: action === 'approve' ? 'Payment approved. Appointment confirmed!' : 'Payment rejected.', type: action === 'approve' ? 'success' : 'error' })
      setPreview(null); setRejectModal(null); setRejectNote('')
      await fetch()
    } catch (err: any) {
      setToast({ msg: err.response?.data?.message ?? 'Action failed.', type: 'error' })
    } finally { setProcessing(null) }
  }

  const navItems = [{ label: 'Payment Verification', to: '/assistant', icon: <CheckCircle className="w-4 h-4" /> }]

  return (
    <DashboardLayout navItems={navItems} title="Payment Verification Workspace" subtitle="Assistant Portal">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {payments.length} pending
          </div>
          <p className="text-slate-500 text-sm">Review and verify uploaded payment screenshots.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
        ) : payments.length === 0 ? (
          <EmptyState icon="✅" title="All payments verified" description="No payment screenshots are awaiting review right now." />
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const appt = p.appointments
              return (
                <div key={p.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Screenshot thumbnail */}
                    {p.screenshot_url && (
                      <div
                        className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shrink-0"
                        onClick={() => setPreview(p)}>
                        <img src={p.screenshot_url} alt="Payment screenshot" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-1">
                        <p className="font-semibold text-slate-800 text-sm">
                          {appt?.patients?.users?.full_name ?? 'Patient'}
                        </p>
                        <span className="text-slate-400 text-xs">→</span>
                        <p className="text-slate-600 text-sm">
                          Dr. {appt?.doctors?.users?.full_name ?? '—'}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {appt?.doctors?.specialization} ·{' '}
                        {appt?.scheduled_at ? new Date(appt.scheduled_at).toLocaleString() : ''}
                      </p>
                      {appt?.reason && <p className="text-xs text-slate-400 italic">"{appt.reason}"</p>}
                      <p className="text-teal-700 font-bold text-sm mt-1">PKR {p.amount.toLocaleString()}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <button className="btn-secondary text-xs py-1.5" onClick={() => setPreview(p)}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        className="btn-primary text-xs py-1.5 bg-teal-600"
                        disabled={processing === p.id}
                        onClick={() => handleVerify(p.id, 'approve')}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {processing === p.id ? '…' : 'Approve'}
                      </button>
                      <button
                        className="btn-danger text-xs py-1.5"
                        disabled={processing === p.id}
                        onClick={() => { setRejectModal(p); setRejectNote('') }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Screenshot preview modal */}
        <Modal open={!!preview} onClose={() => setPreview(null)} title="Payment Screenshot">
          {preview && (
            <div className="space-y-4">
              {preview.screenshot_url ? (
                <img src={preview.screenshot_url} alt="Payment proof" className="w-full rounded-xl border border-slate-200" />
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No screenshot available</p>
              )}
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
                <p><span className="text-slate-500">Patient:</span> <span className="font-medium">{preview.appointments?.patients?.users?.full_name}</span></p>
                <p><span className="text-slate-500">Doctor:</span> <span className="font-medium">Dr. {preview.appointments?.doctors?.users?.full_name}</span></p>
                <p><span className="text-slate-500">Amount:</span> <span className="font-bold text-teal-700">PKR {preview.amount.toLocaleString()}</span></p>
              </div>
              <div className="flex gap-3">
                <button className="btn-primary flex-1 justify-center" onClick={() => handleVerify(preview.id, 'approve')}
                  disabled={processing === preview.id}>
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button className="btn-danger flex-1 justify-center" onClick={() => { setRejectModal(preview); setPreview(null) }}>
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Reject reason modal */}
        <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Payment">
          {rejectModal && (
            <div className="space-y-4">
              <p className="text-slate-600 text-sm">Please provide a reason for rejecting this payment. The patient's appointment will be cancelled.</p>
              <div>
                <label className="label">Rejection reason</label>
                <textarea className="input min-h-[100px] resize-none"
                  placeholder="e.g. Screenshot is unclear, wrong amount, duplicate submission…"
                  value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1 justify-center" onClick={() => setRejectModal(null)}>Cancel</button>
                <button className="btn-danger flex-1 justify-center"
                  disabled={!rejectNote.trim() || processing === rejectModal.id}
                  onClick={() => handleVerify(rejectModal.id, 'reject', rejectNote)}>
                  {processing === rejectModal.id ? 'Processing…' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </DashboardLayout>
  )
}

export default AssistantDashboard

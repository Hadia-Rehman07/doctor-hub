import React, { useState } from 'react'
import { Plus, Pill, Lock } from 'lucide-react'
import { historyApi } from '../../api'
import { Medicine } from '../../types'
import { Toast } from '../../components/ui'

const BLANK_MED: Medicine = { name: '', dosage: '', frequency: '', duration: '', instructions: '' }

const AddRecordPage: React.FC = () => {
  const [step, setStep] = useState<'history' | 'prescription'>('history')
  const [createdHistoryId, setCreatedHistoryId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [histForm, setHistForm] = useState({ patient_id: '', appt_id: '', diagnosis: '', notes: '' })
  const [medicines, setMedicines] = useState<Medicine[]>([{ ...BLANK_MED }])
  const [rxInstructions, setRxInstructions] = useState('')

  const setMed = (i: number, field: keyof Medicine, val: string) =>
    setMedicines((m) => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med))

  const addMed = () => setMedicines((m) => [...m, { ...BLANK_MED }])
  const removeMed = (i: number) => setMedicines((m) => m.filter((_, idx) => idx !== i))

  const submitHistory = async () => {
    setSubmitting(true)
    try {
      const res = await historyApi.addRecord({
        patient_id: histForm.patient_id,
        appt_id: histForm.appt_id || undefined,
        diagnosis: histForm.diagnosis,
        notes: histForm.notes,
      })
      setCreatedHistoryId(res.data.record.id)
      setToast({ msg: 'Medical record saved permanently.', type: 'success' })
      setStep('prescription')
    } catch (err: any) {
      setToast({ msg: err.response?.data?.message ?? 'Failed to save record.', type: 'error' })
    } finally { setSubmitting(false) }
  }

  const submitPrescription = async () => {
    if (!createdHistoryId) return
    setSubmitting(true)
    try {
      await historyApi.addPrescription({
        history_id: createdHistoryId,
        medicines: medicines.filter((m) => m.name),
        instructions: rxInstructions,
      })
      setToast({ msg: 'Prescription saved permanently.', type: 'success' })
      setHistForm({ patient_id: '', appt_id: '', diagnosis: '', notes: '' })
      setMedicines([{ ...BLANK_MED }])
      setRxInstructions('')
      setCreatedHistoryId(null)
      setStep('history')
    } catch (err: any) {
      setToast({ msg: err.response?.data?.message ?? 'Failed to save prescription.', type: 'error' })
    } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Add Medical Record</h2>
        <p className="text-slate-500 text-sm mt-1">Records and prescriptions are permanent and cannot be edited or deleted.</p>
      </div>

      {/* Step tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {(['history', 'prescription'] as const).map((s) => (
          <button key={s}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${step === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            onClick={() => s === 'prescription' && !createdHistoryId ? undefined : setStep(s)}>
            {s === 'history' ? '1. History' : '2. Prescription'}
          </button>
        ))}
      </div>

      {/* History form */}
      {step === 'history' && (
        <div className="card space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-xs text-amber-700">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            This record will be permanently stored and cannot be edited or deleted after submission.
          </div>
          <div>
            <label className="label">Patient ID <span className="text-red-500">*</span></label>
            <input className="input" placeholder="Patient UUID from system"
              value={histForm.patient_id} onChange={(e) => setHistForm({ ...histForm, patient_id: e.target.value })} />
            <p className="text-xs text-slate-400 mt-1">Find patient IDs in the Appointments section.</p>
          </div>
          <div>
            <label className="label">Appointment ID (optional)</label>
            <input className="input" placeholder="Link to a specific appointment"
              value={histForm.appt_id} onChange={(e) => setHistForm({ ...histForm, appt_id: e.target.value })} />
          </div>
          <div>
            <label className="label">Diagnosis <span className="text-red-500">*</span></label>
            <input className="input" placeholder="Primary diagnosis"
              value={histForm.diagnosis} onChange={(e) => setHistForm({ ...histForm, diagnosis: e.target.value })} />
          </div>
          <div>
            <label className="label">Clinical notes</label>
            <textarea className="input min-h-[100px] resize-none" placeholder="Observations, test results, recommendations…"
              value={histForm.notes} onChange={(e) => setHistForm({ ...histForm, notes: e.target.value })} />
          </div>
          <button className="btn-primary" disabled={submitting || !histForm.patient_id || !histForm.diagnosis}
            onClick={submitHistory}>
            {submitting ? 'Saving…' : 'Save Record & Continue'}
          </button>
        </div>
      )}

      {/* Prescription form */}
      {step === 'prescription' && createdHistoryId && (
        <div className="card space-y-5">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-700">
            ✅ History record saved. Now add the prescription for this consultation.
          </div>

          <div className="space-y-3">
            {medicines.map((med, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Pill className="w-4 h-4 text-teal-500" /> Medicine {i + 1}
                  </div>
                  {medicines.length > 1 && (
                    <button className="text-xs text-red-500 hover:text-red-600" onClick={() => removeMed(i)}>Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Medicine name</label>
                    <input className="input" placeholder="Paracetamol" value={med.name}
                      onChange={(e) => setMed(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Dosage</label>
                    <input className="input" placeholder="500mg" value={med.dosage}
                      onChange={(e) => setMed(i, 'dosage', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Frequency</label>
                    <input className="input" placeholder="3x daily" value={med.frequency}
                      onChange={(e) => setMed(i, 'frequency', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Duration</label>
                    <input className="input" placeholder="5 days" value={med.duration}
                      onChange={(e) => setMed(i, 'duration', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Special instructions</label>
                    <input className="input" placeholder="Take after meals" value={med.instructions ?? ''}
                      onChange={(e) => setMed(i, 'instructions', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-secondary text-sm" onClick={addMed}>
            <Plus className="w-4 h-4" /> Add another medicine
          </button>

          <div>
            <label className="label">General instructions</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Rest, dietary advice, follow-up date…"
              value={rxInstructions} onChange={(e) => setRxInstructions(e.target.value)} />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-xs text-amber-700">
            <Lock className="w-3.5 h-3.5 shrink-0" /> This prescription will be immutable once saved. No edits or deletions possible.
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setStep('history')}>Back</button>
            <button className="btn-primary" disabled={submitting} onClick={submitPrescription}>
              {submitting ? 'Saving…' : 'Save Prescription'}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default AddRecordPage

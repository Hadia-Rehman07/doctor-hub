import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, FileText, Pill } from 'lucide-react'
import { historyApi } from '../../api'
import { MedicalHistory } from '../../types'
import { Spinner, EmptyState } from '../../components/ui'

const MyHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<MedicalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    historyApi.myHistory()
      .then((res) => setHistory(res.data.history))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Medical History</h2>
        <p className="text-slate-500 text-sm mt-1">Your records are read-only and permanently preserved.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : history.length === 0 ? (
        <EmptyState icon="📋" title="No medical records yet" description="Records will appear here after your doctor adds them." />
      ) : (
        <div className="space-y-3">
          {history.map((record) => (
            <div key={record.id} className="card">
              <button
                className="w-full flex items-center justify-between gap-4 text-left"
                onClick={() => setExpanded(expanded === record.id ? null : record.id)}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{record.diagnosis}</p>
                    <p className="text-slate-500 text-xs">
                      Dr. {record.doctors?.users?.full_name} · {new Date(record.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {expanded === record.id
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {expanded === record.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  {record.notes && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Doctor's Notes</p>
                      <p className="text-slate-700 text-sm">{record.notes}</p>
                    </div>
                  )}

                  {record.prescriptions && record.prescriptions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Prescriptions</p>
                      {record.prescriptions.map((rx) => (
                        <div key={rx.id} className="bg-slate-50 rounded-xl p-4 space-y-2">
                          {rx.medicines.map((med, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Pill className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-slate-800">{med.name}</span>
                                <span className="text-slate-500 text-xs ml-2">{med.dosage} · {med.frequency} · {med.duration}</span>
                                {med.instructions && <p className="text-slate-500 text-xs">{med.instructions}</p>}
                              </div>
                            </div>
                          ))}
                          {rx.instructions && (
                            <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-2">
                              {rx.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                    🔒 This record is permanently preserved and cannot be modified by anyone.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyHistoryPage

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Star, MapPin, Stethoscope } from "lucide-react";
import { doctorApi, appointmentApi } from "../../api";
import { Doctor, TreatmentType } from "../../types";
import {
  StatusBadge,
  Spinner,
  EmptyState,
  Modal,
  Toast,
} from "../../components/ui";

const TREATMENT_TYPES: { value: TreatmentType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "allopathic", label: "Allopathic" },
  { value: "homeopathic", label: "Homeopathic" },
  { value: "herbal", label: "Herbal" },
];

const SearchDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    treatment_type: "",
    disease: "",
    specialization: "",
  });
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState({
    scheduled_at: "",
    reason: "",
    clinic_id: "",
  });
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      // Khali inputs ko api mein janay se rokna (Sirf valid text bhejenge)
      if (filters.treatment_type && filters.treatment_type.trim() !== "") {
        params.treatment_type = filters.treatment_type;
      }
      if (filters.disease && filters.disease.trim() !== "") {
        params.disease = filters.disease;
      }
      if (filters.specialization && filters.specialization.trim() !== "") {
        params.specialization = filters.specialization;
      }

      console.log("Sending search API params:", params);

      const res = await doctorApi.list(params);

      console.log("API Response Data:", res.data);
      setDoctors(res.data.doctors || []);
    } catch (err: any) {
      // Ab agar koi error aayega toh Console (F12) mein poori details dikhengi
      console.error(
        "Doctor fetch error details:",
        err.response?.data || err.message,
      );
      setToast({
        msg: "Failed to fetch doctors. Check browser console.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleBook = async () => {
    if (!selectedDoctor || !bookingData.scheduled_at) return;
    setBooking(true);
    try {
      const payload: any = {
        doctor_id: selectedDoctor.id,
        scheduled_at: bookingData.scheduled_at,
        reason: bookingData.reason,
      };
      if (bookingData.clinic_id) payload.clinic_id = bookingData.clinic_id;
      await appointmentApi.book(payload);
      setToast({
        msg: "Appointment booked! Upload your payment screenshot next.",
        type: "success",
      });
      setSelectedDoctor(null);
    } catch (err: any) {
      setToast({
        msg: err.response?.data?.message ?? "Booking failed.",
        type: "error",
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Find a Doctor</h2>
        <p className="text-slate-500 text-sm mt-1">
          Search by specialization, disease, or treatment type.
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Treatment type</label>
            <select
              className="input"
              value={filters.treatment_type}
              onChange={(e) =>
                setFilters({ ...filters, treatment_type: e.target.value })
              }
            >
              {TREATMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Disease / condition</label>
            <input
              className="input"
              placeholder="e.g. diabetes, fever…"
              value={filters.disease}
              onChange={(e) =>
                setFilters({ ...filters, disease: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Specialization</label>
            <input
              className="input"
              placeholder="e.g. Cardiologist…"
              value={filters.specialization}
              onChange={(e) =>
                setFilters({ ...filters, specialization: e.target.value })
              }
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="btn-primary" onClick={fetchDoctors}>
            <Search className="w-4 h-4" /> Search
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              setFilters({
                treatment_type: "",
                disease: "",
                specialization: "",
              })
            }
          >
            <Filter className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-8 h-8" />
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No doctors found"
          description="Try adjusting your search filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">
                    {doc.users?.full_name}
                  </p>
                  <p className="text-slate-500 text-xs">{doc.specialization}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <StatusBadge status={doc.treatment_type} />
                {doc.diseases_treated?.slice(0, 3).map((d) => (
                  <span key={d} className="badge bg-slate-100 text-slate-600">
                    {d}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{doc.experience_years} yrs exp.</span>
                </div>
                <span className="text-teal-700 font-semibold text-sm">
                  PKR {doc.consultation_fee.toLocaleString()}
                </span>
              </div>

              {doc.clinics?.[0] && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                  <MapPin className="w-3 h-3" />
                  {doc.clinics[0].city} — {doc.clinics[0].name}
                </div>
              )}

              <button
                className="btn-primary w-full justify-center text-xs py-2"
                onClick={() => {
                  setSelectedDoctor(doc);
                  setBookingData({
                    scheduled_at: "",
                    reason: "",
                    clinic_id: "",
                  });
                }}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        open={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Book Appointment"
      >
        {selectedDoctor && (
          <div className="space-y-4">
            <div className="bg-teal-50 rounded-xl p-4">
              <p className="font-semibold text-teal-800">
                {selectedDoctor.users?.full_name}
              </p>
              <p className="text-teal-600 text-sm">
                {selectedDoctor.specialization}
              </p>
              <p className="text-teal-700 font-bold mt-1">
                Fee: PKR {selectedDoctor.consultation_fee.toLocaleString()}
              </p>
            </div>

            {selectedDoctor.clinics && selectedDoctor.clinics.length > 0 && (
              <div>
                <label className="label">Select clinic (optional)</label>
                <select
                  className="input"
                  value={bookingData.clinic_id}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      clinic_id: e.target.value,
                    })
                  }
                >
                  <option value="">No preference</option>
                  {selectedDoctor.clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Appointment date & time</label>
              <input
                className="input"
                type="datetime-local"
                value={bookingData.scheduled_at}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) =>
                  setBookingData({
                    ...bookingData,
                    scheduled_at: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">Reason / symptoms</label>
              <input
                className="input"
                placeholder="Describe your symptoms…"
                value={bookingData.reason}
                onChange={(e) =>
                  setBookingData({ ...bookingData, reason: e.target.value })
                }
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              💡 After booking, you'll need to upload a payment screenshot to
              confirm your appointment.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="btn-secondary flex-1 justify-center"
                onClick={() => setSelectedDoctor(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1 justify-center"
                onClick={handleBook}
                disabled={booking || !bookingData.scheduled_at}
              >
                {booking ? "Booking…" : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SearchDoctorsPage;

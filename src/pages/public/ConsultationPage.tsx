import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  Video,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

export const ConsultationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tomorrow's date default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedSlot, setSelectedSlot] = useState('10:00 - 10:30 AM');
  const [slots, setSlots] = useState<Array<{ slot: string; isAvailable: boolean }>>([]);
  const [purpose, setPurpose] = useState('Document Verification & Visa Advisory');
  const [notes, setNotes] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate) return;
      setIsLoadingSlots(true);
      try {
        const res = await api.get<{ success: boolean; slots: Array<{ slot: string; isAvailable: boolean }> }>(
          `/appointments/slots?date=${selectedDate}`
        );
        if (res.success && res.slots) {
          setSlots(res.slots);
          const firstAvail = res.slots.find((s) => s.isAvailable);
          if (firstAvail) setSelectedSlot(firstAvail.slot);
        }
      } catch (err: any) {
        console.warn('Fetch slots warning:', err?.message || err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      navigate('/login?redirect=/consultation');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/appointments', {
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        purpose,
        notes,
      });

      if (res.success && res.data) {
        setConfirmedAppointment(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <Video className="w-4 h-4 text-blue-600" />
            <span>1-on-1 Confidential Video Advisory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Schedule a Consular Consultation
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Meet with an accredited immigration specialist to audit your travel itinerary, verify biometric passport scans, and review financial solvency records.
          </p>
        </div>

        {confirmedAppointment ? (
          /* Confirmation State */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs text-center max-w-lg mx-auto space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Consultation Confirmed</h2>
              <p className="text-xs text-slate-600">
                A calendar invite has been queued for your account. You can join your specialist directly via the Google Meet link below.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-800">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-bold text-slate-800">{confirmedAppointment.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purpose:</span>
                <span className="font-bold text-slate-800">{confirmedAppointment.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Meeting Room:</span>
                <span className="font-bold text-blue-600 truncate">{confirmedAppointment.meetingLink}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                to="/customer/appointments"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                View in Appointments Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setConfirmedAppointment(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                Book Another Slot
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!user && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 text-blue-900 rounded-2xl text-xs mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Sign in or register to record this appointment in your private dashboard.</span>
                </div>
                <Link
                  to="/login?redirect=/consultation"
                  className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg shrink-0 hover:bg-blue-700 transition"
                >
                  Sign In
                </Link>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Consultation Date
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  />
                </div>

                {/* Purpose Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Advisory Subject
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  >
                    <option value="Document Verification & Visa Advisory">Document Forensic Audit & Checklist Check</option>
                    <option value="Dubai / UAE e-Visa Expedited Intake">Dubai / UAE e-Visa Expedited Intake</option>
                    <option value="India e-Tourist / e-Business Consultation">India e-Tourist / e-Business Consultation</option>
                    <option value="Schengen France Tourism Dossier Prep">Schengen France Tourism Dossier Prep</option>
                    <option value="US B1/B2 DS-160 Review Coaching">US B1/B2 DS-160 Review Coaching</option>
                    <option value="Prior Visa Refusal Assessment">Prior Visa Refusal Assessment</option>
                  </select>
                </div>
              </div>

              {/* Time Slots Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Available Time Slots (30 Mins)
                </label>
                {isLoadingSlots ? (
                  <LoadingSpinner message="Checking specialist calendar availability..." size="sm" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {slots.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlot(s.slot)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                          selectedSlot === s.slot
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : s.isAvailable
                            ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                            : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        }`}
                      >
                        {s.slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Specific Questions / Context for Case Officer (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share details such as destination dates, family members, or specific document questions..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Confirmed via Google Meet. Instant calendar notification.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSlot}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2 shadow-xs"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>{isSubmitting ? 'Reserving Slot...' : 'Confirm Appointment'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

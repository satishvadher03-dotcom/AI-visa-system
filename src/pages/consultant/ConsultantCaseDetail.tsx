import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Send,
  Lock,
  MessageSquare,
  AlertCircle,
  Save,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaApplication, PrivateDocument, ApplicationStatus, DocumentStatus } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsultantCaseDetail: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<VisaApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change State
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusComment, setStatusComment] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Note State
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Rejection modal state for document
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCaseDetail = async () => {
    if (!id || !user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: VisaApplication }>(`/applications/${id}`);
      if (res.success && res.data) {
        setApplication(res.data);
        setSelectedStatus(res.data.status);
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn('Fetch case detail warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id, user]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedStatus) return;

    setIsUpdatingStatus(true);
    setMessage(null);

    try {
      const res = await api.patch(`/consultant/applications/${id}/status`, {
        status: selectedStatus,
        comment: statusComment || `Status updated to ${selectedStatus} by case consultant.`,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Application status updated to ${selectedStatus}.` });
        setStatusComment('');
        fetchCaseDetail();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;

    setIsAddingNote(true);
    setMessage(null);

    try {
      const res = await api.post(`/consultant/applications/${id}/notes`, {
        note: newNote.trim(),
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Internal case note added.' });
        setNewNote('');
        fetchCaseDetail();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add note.' });
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    setIsVerifyingDoc(true);
    setMessage(null);

    try {
      const res = await api.patch(`/consultant/documents/${docId}/verify`, {
        status,
        rejectionReason: reason,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Document marked as ${status}.` });
        setRejectingDocId(null);
        setRejectionReason('');
        fetchCaseDetail();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to verify document.' });
    } finally {
      setIsVerifyingDoc(false);
    }
  };

  const handleDownload = (docId: string) => {
    window.location.href = `/api/v1/applications/documents/${docId}/download`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading case review console..." fullScreen />;
  }

  if (!application) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Case Dossier Unavailable</h3>
        <p className="text-xs text-slate-500">
          You may not be assigned to this case or it does not exist.
        </p>
        <Link
          to="/consultant/applications"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-block"
        >
          Return to Assigned Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/consultant/applications')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Cases</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Case Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {application.applicationNumber}
              </span>
              <StatusBadge status={application.status} />
              <span className="text-xs text-slate-400">
                Submitted: {new Date(application.submittedAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {application.visaProgram?.countryName} — {application.visaProgram?.visaType}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Applicant: {application.applicantName || `${application.user?.firstName} ${application.user?.lastName}`} • Email: {application.user?.email}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right shrink-0">
            <span className="text-xs text-slate-400 block font-bold uppercase">Official Consular Fee</span>
            <span className="text-xl font-bold text-slate-900">${application.visaProgram?.officialFeeUSD} USD</span>
          </div>
        </div>

        {/* Applicant Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Passport Number</span>
            <span className="font-mono font-bold text-slate-900">{application.applicantPassport}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Contact</span>
            <span className="font-bold text-slate-900">{application.user?.phone || 'Not provided'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Travel Date</span>
            <span className="font-bold text-slate-900">
              {application.travelDate ? new Date(application.travelDate).toLocaleDateString() : 'Unspecified'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Passport Expiry</span>
            <span className="font-bold text-slate-900">
              {application.passportExpiryDate ? new Date(application.passportExpiryDate).toLocaleDateString() : 'Unspecified'}
            </span>
          </div>
        </div>

        {application.notes && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600">
            <strong className="text-slate-900 block mb-0.5">Applicant Submission Notes:</strong>
            {application.notes}
          </div>
        )}
      </div>

      {/* Status Management Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Update Application Filing Status</h2>
        </div>

        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-semibold"
              >
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING (Missing items)</option>
                <option value="RESUBMITTED">RESUBMITTED</option>
                <option value="PROCESSING">PROCESSING (Govt Portal Filing)</option>
                <option value="APPROVED">APPROVED (Visa Granted)</option>
                <option value="REJECTED">REJECTED (Consular Refusal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Audit Log Reason / Customer Notification Comment
              </label>
              <input
                type="text"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="e.g. Passport scan verified; proceeding with ICP filing..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingStatus}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdatingStatus ? 'Updating...' : 'Commit Status Change'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Document Forensic Verification Console */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Document Audit & Verification</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {application.documents?.length || 0} attached files
          </span>
        </div>

        {!application.documents || application.documents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No documents uploaded by applicant yet.</p>
        ) : (
          <div className="space-y-3">
            {application.documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{doc.originalFilename}</span>
                    <StatusBadge status={doc.verificationStatus} size="sm" />
                  </div>
                  <div className="text-slate-400 text-[11px] flex gap-3">
                    <span>Requirement: {doc.requirement?.name || 'General Evidence'}</span>
                    <span>Size: {Math.round(doc.fileSizeBytes / 1024)} KB</span>
                    <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  {doc.rejectionReason && (
                    <p className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-100">
                      Reason: {doc.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownload(doc.id)}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1 font-semibold shadow-2xs"
                    title="Download securely"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    disabled={isVerifyingDoc}
                    onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition font-semibold"
                    title="Mark document compliant"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    <span>Verify</span>
                  </button>

                  <button
                    type="button"
                    disabled={isVerifyingDoc}
                    onClick={() => setRejectingDocId(doc.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition font-semibold"
                    title="Reject document with feedback"
                  >
                    <XCircle className="w-3.5 h-3.5 inline mr-1" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internal Case Notes (Confidential - Staff Only) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Internal Case Notes (Staff Only)</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Confidential
          </span>
        </div>

        {/* Existing notes */}
        <div className="space-y-3">
          {(application.internalNotes || []).length === 0 ? (
            <p className="text-xs text-slate-400 italic">No internal case notes recorded yet.</p>
          ) : (
            application.internalNotes?.map((note) => (
              <div key={note.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>
                    <strong>{note.author?.firstName} {note.author?.lastName}</strong> ({note.author?.role})
                  </span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{note.note}</p>
              </div>
            ))
          )}
        </div>

        {/* Add note form */}
        <form onSubmit={handleAddInternalNote} className="space-y-3 pt-2 border-t border-slate-100">
          <textarea
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Record internal verification notes, consular portal transaction IDs, or background remarks..."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAddingNote || !newNote.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save Internal Note</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rejection Prompt Modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reject Document</h3>
              <button
                type="button"
                onClick={() => setRejectingDocId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Provide specific feedback so the applicant can re-upload a compliant file (e.g. low resolution, blurred ICAO lines, dark background).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Resolution below 300 DPI, bottom Machine Readable Zone cropped..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingDocId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifyingDoc || !rejectionReason.trim()}
                onClick={() => handleVerifyDocument(rejectingDocId, 'REJECTED', rejectionReason.trim())}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
              >
                Confirm Document Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

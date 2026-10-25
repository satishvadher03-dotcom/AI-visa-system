import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Download,
  Trash2,
  AlertTriangle,
  User,
  ShieldCheck,
  Calendar,
  X,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaApplication, PrivateDocument, DocumentRequirement } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const CustomerApplicationDetail: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<VisaApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchApplication = async () => {
    if (!id || !user) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: VisaApplication }>(`/applications/${id}`);
      if (res.success && res.data) {
        setApplication(res.data);
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn('Fetch application detail warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id, user]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !id) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (selectedReqId) {
      formData.append('requirementId', selectedReqId);
    }

    try {
      const res = await api.post<{ success: boolean; message: string; data: PrivateDocument }>(
        `/applications/${id}/documents`,
        formData
      );

      if (res.success) {
        setUploadSuccess('Document successfully uploaded to your private vault.');
        setSelectedFile(null);
        setSelectedReqId('');
        setIsUploadOpen(false);
        fetchApplication();
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDocument = (docId: string, filename: string) => {
    // Open secure download endpoint
    window.location.href = `/api/v1/applications/documents/${docId}/download`;
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document from your vault?')) return;
    try {
      const res = await api.delete(`/applications/documents/${docId}`);
      if (res.success) {
        fetchApplication();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving visa application dossier..." fullScreen />;
  }

  if (!application) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Application Not Found</h3>
        <p className="text-xs text-slate-500">
          This dossier may not exist or you do not have permission to inspect it.
        </p>
        <Link
          to="/customer/applications"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-block"
        >
          Return to My Applications
        </Link>
      </div>
    );
  }

  const requirements = application.visaProgram?.documentRequirements || [];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/customer/applications')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </button>
      </div>

      {/* Main Dossier Summary Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {application.applicationNumber}
              </span>
              <StatusBadge status={application.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {application.visaProgram?.countryName} — {application.visaProgram?.visaType}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Submitted on: {new Date(application.submittedAt).toLocaleDateString()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs self-start"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Applicant & Case Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Applicant Name</span>
            <span className="text-xs font-bold text-slate-900">{application.applicantName || 'Self'}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Passport Number</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{application.applicantPassport}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Travel Date</span>
            <span className="text-xs font-bold text-slate-900">
              {application.travelDate ? new Date(application.travelDate).toLocaleDateString() : 'Unspecified'}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Specialist</span>
            <span className="text-xs font-bold text-slate-900">
              {application.assignedConsultant
                ? `${application.assignedConsultant.firstName} ${application.assignedConsultant.lastName}`
                : 'Intake Queue'}
            </span>
          </div>
        </div>

        {application.notes && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600">
            <strong className="text-slate-900 block mb-1">Applicant Notes:</strong>
            {application.notes}
          </div>
        )}
      </div>

      {/* Private Documents Vault Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Vaulted Case Documents</h2>
          </div>
          <span className="text-xs text-slate-400">
            {application.documents?.length || 0} files vaulted
          </span>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Requirements Checklist Progress */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Program Document Checklist
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requirements.map((req) => {
              const uploadedDoc = application.documents?.find((d) => d.requirementId === req.id);
              return (
                <div
                  key={req.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    uploadedDoc
                      ? uploadedDoc.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : uploadedDoc.verificationStatus === 'REJECTED'
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-blue-50/40 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{req.name}</span>
                        {req.isMandatory && (
                          <span className="text-[10px] text-rose-600 font-bold">*Required</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{req.description}</p>
                    </div>

                    {uploadedDoc ? (
                      <StatusBadge status={uploadedDoc.verificationStatus} size="sm" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReqId(req.id);
                          setIsUploadOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 transition shrink-0"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Uploaded Files Table */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Uploaded Private Files
          </span>

          {!application.documents || application.documents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No files uploaded for this dossier yet.</p>
          ) : (
            <div className="space-y-2">
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900">{doc.originalFilename}</span>
                      <StatusBadge status={doc.verificationStatus} size="sm" />
                    </div>
                    <div className="text-slate-400 text-[11px] flex gap-3">
                      <span>Requirement: {doc.requirement?.name || 'General Document'}</span>
                      <span>Size: {Math.round(doc.fileSizeBytes / 1024)} KB</span>
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    {doc.verificationStatus === 'REJECTED' && doc.rejectionReason && (
                      <div className="mt-1 text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100 text-[11px]">
                        <strong>Consultant Feedback:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(doc.id, doc.originalFilename)}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1 font-semibold text-xs shadow-2xs"
                      title="Download securely"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    {doc.verificationStatus === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Status History Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Application Status Progression History</h2>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {(application.statusHistory || []).map((history, hIdx) => (
            <div key={history.id} className="relative">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {history.toStatus.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(history.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{history.comment || 'Status transitioned.'}</p>
                {history.changedBy && (
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Updated by {history.changedBy.firstName} {history.changedBy.lastName} ({history.changedBy.role})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Private Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload to Private Vault</h3>
                <p className="text-xs text-slate-500">
                  Secure local storage with encrypted server-side file naming.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Associate with Requirement
                </label>
                <select
                  value={selectedReqId}
                  onChange={(e) => setSelectedReqId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                >
                  <option value="">General Supporting Document</option>
                  {requirements.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.name} {req.isMandatory ? '(*Mandatory)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select File (PDF, JPG, PNG - Max 10MB)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-blue-600 inline mr-1 -mt-0.5" />
                Files are stored outside public directories and checked for valid signatures before submission.
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploading ? 'Securing File...' : 'Upload Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

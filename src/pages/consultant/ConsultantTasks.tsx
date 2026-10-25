import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, FileText, ArrowRight, Download, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaApplication } from '../../types/index.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const ConsultantTasks: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<VisaApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadCases() {
      try {
        const res = await api.get<{ success: boolean; data: VisaApplication[] }>('/consultant/assigned-cases');
        if (isMounted && res.success && res.data) {
          setCases(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Consultant tasks warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadCases();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Collect all pending documents across assigned cases
  const pendingTasks: Array<{
    docId: string;
    filename: string;
    appId: string;
    appNumber: string;
    applicant: string;
    country: string;
    uploadedAt: string;
  }> = [];

  cases.forEach((c) => {
    (c.documents || []).forEach((doc) => {
      if (doc.verificationStatus === 'PENDING') {
        pendingTasks.push({
          docId: doc.id,
          filename: doc.originalFilename,
          appId: c.id,
          appNumber: c.applicationNumber,
          applicant: c.applicantName || `${c.user?.firstName} ${c.user?.lastName}`,
          country: c.visaProgram?.countryName || '',
          uploadedAt: doc.uploadedAt,
        });
      }
    });
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Document Verification Tasks</h1>
        <p className="text-xs text-slate-600 mt-1">
          Pending biometric files and statutory declarations requiring specialist resolution review.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Assembling pending verification checklist..." />
      ) : pendingTasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">All Tasks Completed!</h3>
          <p className="text-xs text-slate-500">
            There are no pending documents in your assigned queues requiring verification.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">{pendingTasks.length} Pending Document Audits</span>
            <span className="text-slate-500">SLA: Review within 12 hours of upload</span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingTasks.map((task) => (
              <div
                key={task.docId}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900">{task.filename}</span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-bold">
                      {task.appNumber}
                    </span>
                  </div>
                  <div className="text-slate-500 flex gap-4">
                    <span>Applicant: <strong>{task.applicant}</strong></span>
                    <span>Destination: {task.country}</span>
                    <span>Uploaded: {new Date(task.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link
                  to={`/consultant/applications/${task.appId}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shrink-0 flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Audit in Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

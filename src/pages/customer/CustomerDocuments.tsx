import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Download, FileText, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaApplication, PrivateDocument } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const CustomerDocuments: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadData() {
      try {
        const res = await api.get<{ success: boolean; data: VisaApplication[] }>('/applications/me');
        if (isMounted && res.success && res.data) {
          setApplications(res.data);
        }
      } catch (err: any) {
        if (err?.status !== 401) {
          console.warn('Customer documents warning:', err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const allDocuments: Array<PrivateDocument & { appNumber: string; countryName: string }> = [];
  applications.forEach((app) => {
    (app.documents || []).forEach((doc) => {
      allDocuments.push({
        ...doc,
        appNumber: app.applicationNumber,
        countryName: app.visaProgram?.countryName || 'Visa Application',
      });
    });
  });

  const handleDownload = (docId: string) => {
    window.location.href = `/api/v1/applications/documents/${docId}/download`;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Private Document Vault</h1>
          <p className="text-xs text-slate-600 mt-1">
            Centrally inspect, verify, and download all uploaded passport bio scans, photos, and financial evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Encrypted Local Storage (Non-Public)</span>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Scanning customer document vault..." />
      ) : allDocuments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Document Vault is Empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              Documents will appear here when you attach passport scans or photos to an active visa application.
            </p>
          </div>
          <Link
            to="/customer/applications"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-block"
          >
            Go to Applications
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Document Name</th>
                  <th className="py-3.5 px-4">Associated Dossier</th>
                  <th className="py-3.5 px-4">File Size</th>
                  <th className="py-3.5 px-4">Uploaded Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate max-w-xs">{doc.originalFilename}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
                        {doc.appNumber}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">{doc.countryName}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {Math.round(doc.fileSizeBytes / 1024)} KB
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={doc.verificationStatus} size="sm" />
                      {doc.rejectionReason && (
                        <span className="block text-[10px] text-rose-600 mt-1 max-w-xs leading-tight">
                          {doc.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

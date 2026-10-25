import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaProgram } from '../../types/index.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

export const VisaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<VisaProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProgramDetail() {
      if (!id) return;
      try {
        const res = await api.get<{ success: boolean; data: VisaProgram }>(`/visa-programs/${id}`);
        if (res.success && res.data) {
          setProgram(res.data);
        }
      } catch (err: any) {
        console.warn('Fetch visa program warning:', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProgramDetail();
  }, [id]);

  if (isLoading) {
    return <LoadingSpinner message="Retrieving consular specifications..." fullScreen />;
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-2xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Program Not Found</h2>
          <p className="text-xs text-slate-600 mb-6">
            The requested visa program may have been updated or archived.
          </p>
          <Link
            to="/destinations"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Browse All Destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Destinations</span>
          </button>
        </div>

        {/* Program Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {program.flowType === 'WORLD_TO_INDIA' ? 'Travel to India' : 'Outbound Visa Facilitation'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {program.category}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {program.countryName} — {program.visaType}
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">
                {program.description}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right shrink-0">
              <span className="text-xs text-slate-500 block font-medium">Statutory Govt Fee</span>
              <span className="text-2xl font-bold text-slate-900">${program.officialFeeUSD} USD</span>
              <span className="text-[11px] text-slate-500 block mt-1">
                + ${program.serviceFeeUSD} AuraVisa Facilitation
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Validity</span>
              <span className="text-xs font-bold text-slate-900">{program.validity}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Entry Type</span>
              <span className="text-xs font-bold text-slate-900">{program.entryType}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Processing</span>
              <span className="text-xs font-bold text-slate-900">~{program.processingTimeDays} business days</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Eligibility</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{program.eligibleNationalities}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={`/customer/applications?programId=${program.id}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-xs"
            >
              <span>Start Application Dossier</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/eligibility`}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold transition"
            >
              Check My Eligibility
            </Link>
            <Link
              to={`/consultation`}
              className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-sm font-semibold transition"
            >
              Book Specialist Call
            </Link>
          </div>
        </div>

        {/* Document Requirements Checklist */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Required Document Checklist</h2>
          </div>
          <p className="text-xs text-slate-600">
            Our certified case managers conduct forensic resolution audits on every uploaded document before submission to prevent consular rejections.
          </p>

          <div className="space-y-3">
            {program.documentRequirements.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{req.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.isMandatory
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {req.isMandatory ? 'Mandatory' : 'Optional / Contextual'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>
                </div>
                <div className="text-[11px] text-slate-500 sm:text-right shrink-0">
                  <span>Formats: PDF, JPG, PNG</span>
                  <span className="block text-slate-400">Max size: {Math.round(req.maxSizeBytes / 1024 / 1024)}MB</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Official Sources & Transparency Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Verified Sovereign Government Sources</h2>
          </div>
          <p className="text-xs text-slate-600">
            AuraVisa cross-references all consular policies with primary sovereign portals. We do not invent rules or guarantee approvals.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">{program.officialSourceName}</span>
                <span className="text-[11px] text-slate-500 block">Verified on: {program.lastVerifiedAt.split('T')[0]}</span>
              </div>
              <a
                href={program.officialSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                title="Open official portal"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {program.officialSources.map((source) => (
              <div
                key={source.id}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{source.name}</span>
                  <span className="text-[11px] text-slate-500 block">Portal: {source.portalName}</span>
                </div>
                <a
                  href={source.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

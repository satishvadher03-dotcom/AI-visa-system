import React, { useState, useEffect } from 'react';
import { Globe, PlusCircle, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, X, FileText } from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaProgram } from '../../types/index.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

export const AdminVisaPrograms: React.FC = () => {
  const [programs, setPrograms] = useState<VisaProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // New Program Form State
  const [formData, setFormData] = useState({
    countryCode: 'JP',
    countryName: 'Japan',
    flowType: 'INDIA_TO_WORLD' as 'INDIA_TO_WORLD' | 'WORLD_TO_INDIA',
    visaType: 'eVisa (Tourism - 90 Days)',
    category: 'Tourism',
    entryType: 'Single Entry',
    validity: '3 Months to Enter; 90 Days Stay',
    processingTimeDays: 5,
    officialFeeUSD: 22.0,
    serviceFeeUSD: 49.0,
    description: 'Official Ministry of Foreign Affairs of Japan eVisa for short-term tourism stays.',
    eligibleNationalities: 'Eligible passport holders including India and USA',
    officialSourceUrl: 'https://www.evisa.mofa.go.jp',
    officialSourceName: 'Ministry of Foreign Affairs of Japan (MOFA)',
    isActive: true,
  });

  // New Requirement Form State
  const [reqName, setReqName] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqMandatory, setReqMandatory] = useState(true);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: VisaProgram[] }>('/visa-programs?includeInactive=true');
      if (res.success && res.data) {
        setPrograms(res.data);
      }
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn('Fetch programs warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post('/visa-programs', formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Visa program registered successfully.' });
        setIsModalOpen(false);
        fetchPrograms();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create program.' });
    }
  };

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) return;
    setMessage(null);
    try {
      const res = await api.post(`/visa-programs/${selectedProgramId}/requirements`, {
        name: reqName,
        description: reqDesc,
        isMandatory: reqMandatory,
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'Document requirement added to program.' });
        setIsRequirementModalOpen(false);
        setReqName('');
        setReqDesc('');
        fetchPrograms();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add requirement.' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Visa Programs & Consular Rules</h1>
          <p className="text-xs text-slate-600 mt-1">
            Maintain sovereign visa definitions, statutory government fees, and mandatory biometric checklists.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Visa Program</span>
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

      {isLoading ? (
        <LoadingSpinner message="Retrieving visa program registry..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs space-y-4 hover:border-blue-200 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {p.countryCode} • {p.flowType}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{p.countryName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.visaType}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Govt Fee</span>
                    <span className="text-sm font-bold text-slate-900">${p.officialFeeUSD}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                  <span className="truncate pr-1">Portal: {p.officialSourceName}</span>
                  <a
                    href={p.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-800">Checklist ({p.documentRequirements.length}): </span>
                  <span className="text-slate-500">
                    {p.documentRequirements.map((r) => r.name).slice(0, 2).join(', ')}
                    {p.documentRequirements.length > 2 ? '...' : ''}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProgramId(p.id);
                    setIsRequirementModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition text-center"
                >
                  + Add Requirement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Program Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Sovereign Visa Program</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Country Code</label>
                  <input
                    type="text"
                    required
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Country Name</label>
                  <input
                    type="text"
                    required
                    value={formData.countryName}
                    onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Flow Type</label>
                  <select
                    value={formData.flowType}
                    onChange={(e) => setFormData({ ...formData, flowType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="INDIA_TO_WORLD">INDIA_TO_WORLD (Outbound)</option>
                    <option value="WORLD_TO_INDIA">WORLD_TO_INDIA (Inbound)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Visa Type</label>
                  <input
                    type="text"
                    required
                    value={formData.visaType}
                    onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Govt Fee (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.officialFeeUSD}
                    onChange={(e) => setFormData({ ...formData, officialFeeUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Processing Days</label>
                  <input
                    type="number"
                    required
                    value={formData.processingTimeDays}
                    onChange={(e) => setFormData({ ...formData, processingTimeDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Official Portal URL</label>
                  <input
                    type="url"
                    required
                    value={formData.officialSourceUrl}
                    onChange={(e) => setFormData({ ...formData, officialSourceUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Official Authority Name</label>
                  <input
                    type="text"
                    required
                    value={formData.officialSourceName}
                    onChange={(e) => setFormData({ ...formData, officialSourceName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                >
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Requirement Modal */}
      {isRequirementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Document Requirement</h3>
              <button
                type="button"
                onClick={() => setIsRequirementModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRequirement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Requirement Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return Flight Ticket Confirmation"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description & Specs</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Confirmed air ticket showing entry and exit within visa validity..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqMandatory"
                  checked={reqMandatory}
                  onChange={(e) => setReqMandatory(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="reqMandatory" className="font-semibold text-slate-700 cursor-pointer">
                  Mandatory Document for this Program
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequirementModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                >
                  Save Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

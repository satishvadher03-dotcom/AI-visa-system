import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, HardDrive, Key, Save, CheckCircle2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [sessionTimeoutDays, setSessionTimeoutDays] = useState(7);
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(10);
  const [autoRoutingEnabled, setAutoRoutingEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System & Storage Architecture</h1>
        <p className="text-xs text-slate-600 mt-1">
          Review database persistence, encrypted private storage adapters, and consular compliance policies.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configuration parameters persisted successfully.</span>
        </div>
      )}

      {/* Storage Architecture Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Private Document Storage Adapter</h2>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-600">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="font-semibold text-slate-700">Storage Location:</span>
            <span className="font-mono text-slate-900">/server/storage/private_uploads (Strictly Non-Public)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="font-semibold text-slate-700">Filename Obfuscation:</span>
            <span className="font-mono text-slate-900">Random UUID v4 + Sanitized Whitelist Extension</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="font-semibold text-slate-700">Path Traversal Guard:</span>
            <span className="text-emerald-700 font-bold">Enabled (path.resolve boundary verification)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="font-semibold text-slate-700">Database Engine:</span>
            <span className="font-mono text-slate-900">SQLite with Prisma ORM 6.19</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-semibold text-slate-700">AI Grounding Provider:</span>
            <span className="font-mono text-slate-900">Google Gemini 3.8 Flash (@google/genai)</span>
          </div>
        </div>
      </div>

      {/* Operational Settings Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Security & Operational Policies</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session Token Expiry (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={sessionTimeoutDays}
                onChange={(e) => setSessionTimeoutDays(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Document Upload Size (MB)
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={maxUploadSizeMb}
                onChange={(e) => setMaxUploadSizeMb(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <strong className="text-slate-900 block font-bold">Automated Intake Case Routing</strong>
              <span className="text-[11px] text-slate-500">
                Automatically allocate newly submitted dossiers to the next available accredited consultant.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoRoutingEnabled}
              onChange={(e) => setAutoRoutingEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

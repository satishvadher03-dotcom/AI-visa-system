import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, ShieldCheck, ArrowRight, ExternalLink, Calendar, DollarSign, Clock } from 'lucide-react';
import { api } from '../../services/api.ts';
import { VisaProgram } from '../../types/index.ts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.tsx';

export const DestinationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [programs, setPrograms] = useState<VisaProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentSearch = searchParams.get('search') || '';
  const currentFlow = searchParams.get('flow') || 'ALL';
  const currentCategory = searchParams.get('category') || 'ALL';

  useEffect(() => {
    async function fetchPrograms() {
      setIsLoading(true);
      try {
        const params: any = {};
        if (currentFlow !== 'ALL') params.flow = currentFlow;
        if (currentCategory !== 'ALL') params.category = currentCategory;
        if (currentSearch) params.search = currentSearch;

        const res = await api.get<{ success: boolean; data: VisaProgram[] }>('/visa-programs', { params });
        if (res.success && res.data) {
          setPrograms(res.data);
        }
      } catch (err: any) {
        console.warn('Destinations fetch warning:', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrograms();
  }, [currentSearch, currentFlow, currentCategory]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'ALL' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Global Visa Programs & Destinations
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Browse verified electronic visa programs with statutory government fees, average consular processing timelines, and official portal citations.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={currentSearch}
                onChange={(e) => updateParam('search', e.target.value)}
                placeholder="Search country or visa type..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Flow Filter */}
            <div>
              <select
                value={currentFlow}
                onChange={(e) => updateParam('flow', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-medium"
              >
                <option value="ALL">All Travel Routes</option>
                <option value="INDIA_TO_WORLD">🇮🇳 India to World (Outbound)</option>
                <option value="WORLD_TO_INDIA">🌍 World to India (Inbound eVisa)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={currentCategory}
                onChange={(e) => updateParam('category', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 font-medium"
              >
                <option value="ALL">All Travel Categories</option>
                <option value="Tourism">Tourism & Leisure</option>
                <option value="Business">Business & Trade</option>
                <option value="Medical">Medical Treatment</option>
                <option value="Conference">Conference & Events</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <LoadingSpinner message="Loading verified destinations..." />
        ) : programs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">No destinations matched</h3>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting your search keywords or resetting travel route filters.
            </p>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition duration-200 group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {program.flowType === 'WORLD_TO_INDIA' ? 'Travel to India' : 'Outbound Visa'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition">
                        {program.countryName}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">{program.visaType}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Govt Fee</span>
                      <span className="text-base font-bold text-slate-900">${program.officialFeeUSD}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {program.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity</span>
                      <span className="font-semibold text-slate-800">{program.validity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Processing</span>
                      <span className="font-semibold text-slate-800">~{program.processingTimeDays} business days</span>
                    </div>
                  </div>

                  {/* Requirements Preview */}
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Checklist: </span>
                    <span>{program.documentRequirements.length} required documents verified</span>
                  </div>

                  {/* Official Source Link */}
                  <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 flex items-center justify-between border border-slate-100">
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Official Authority</span>
                      <span className="text-xs font-medium text-slate-800 truncate block">{program.officialSourceName}</span>
                    </div>
                    <a
                      href={program.officialSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      title="Visit official government portal"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    to={`/destinations/${program.id}`}
                    className="flex-1 py-2 text-center text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/70 rounded-lg transition"
                  >
                    View Checklist & Details
                  </Link>
                  <Link
                    to={`/customer/applications?programId=${program.id}`}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

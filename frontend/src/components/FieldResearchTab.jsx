import React, { useState, useEffect } from 'react';
import { BarChart3, FileSpreadsheet, Plus, RefreshCw, Filter, TrendingUp, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function FieldResearchTab({ lang }) {
  const [researchData, setResearchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);

  // New Survey Input State
  const [newAge, setNewAge] = useState(24);
  const [newDistrict, setNewDistrict] = useState('Lucknow');
  const [newDelay, setNewDelay] = useState('3 - 6 Months');
  const [newBarrier, setNewBarrier] = useState('Normalizing Symptoms');

  const fetchResearchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/research/insights');
      const data = await res.json();
      setResearchData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchData();
  }, []);

  const handleIngestSubmit = async (e) => {
    e.preventDefault();
    setIngestLoading(true);
    try {
      const res = await fetch(
        `/api/research/ingest?age=${newAge}&district=${encodeURIComponent(newDistrict)}&delay=${encodeURIComponent(newDelay)}&barrier=${encodeURIComponent(newBarrier)}`,
        { method: 'POST' }
      );
      await res.json();
      setIngestLoading(false);
      setShowAddModal(false);
      fetchResearchData(); // Reload live graphs!
    } catch (err) {
      console.error(err);
      setIngestLoading(false);
    }
  };

  if (loading || !researchData) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Loading Field Research Analytics...</div>;
  }

  const COLORS = ['#f59e0b', '#0d9488', '#6366f1', '#ef4444', '#ec4899', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Form / Field Survey Live Analytics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">
              {lang === 'hi' ? 'फील्ड रिसर्च एवं लाइव सर्वेक्षण अंतर्दृष्टि' : 'Field Research & Live Survey Insights'}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
              Empirical data collected from women across rural & peri-urban Uttar Pradesh (Lucknow, Sitapur, Kanpur sub-centers) driving SANJIVANI triage design.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Add New Response Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'hi' ? '+ नया सर्वेक्षण जोड़ें' : '+ Add Survey Response'}</span>
            </button>

            <button
              onClick={fetchResearchData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-2xl border border-slate-700 transition"
              title="Refresh Live Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 relative z-10">
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Live Responses Collected</span>
            <span className="text-3xl font-black text-emerald-400">{researchData.survey_summary.total_responses} Women</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Healthcare Delay &gt;3 Months</span>
            <span className="text-3xl font-black text-amber-400">63.5%</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Cycle Irregularity Prevalence</span>
            <span className="text-3xl font-black text-purple-400">53.0%</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Top Care Barrier</span>
            <span className="text-3xl font-black text-rose-400">Normalizing Symptoms</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Survey Data by District:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'Lucknow', 'Sitapur', 'Kanpur', 'Unnao'].map((dist) => (
            <button
              key={dist}
              onClick={() => setSelectedDistrict(dist)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDistrict === dist ? 'bg-emerald-700 text-white shadow' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {dist === 'ALL' ? 'All Districts' : dist}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Interactive Graphs Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Chart 1: Healthcare Seeking Delays */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {lang === 'hi' ? 'चिकित्सा परामर्श में देरी (Seeking Delays)' : 'Healthcare Seeking Delays (Field Research)'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Time elapsed before consulting a medical officer or ASHA worker</p>
          </div>

          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={researchData.healthcare_seeking_delays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="delay" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                  {researchData.healthcare_seeking_delays.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium mt-3">
            💡 <strong>Key Finding:</strong> Over 63% of women delay care by 3–6+ months because symptoms like period irregularity are normalized.
          </div>
        </div>

        {/* Chart 2: Symptom Prevalence Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {lang === 'hi' ? 'एंडोक्राइन लक्षणों की व्यापकता (%)' : 'Endocrine Symptom Prevalence (%)'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Self-reported symptom frequency among target women</p>
          </div>

          <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={researchData.symptom_prevalence} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="symptom" type="category" stroke="#64748b" fontSize={10} width={130} tickLine={false} />
                <Tooltip formatter={(val) => [`${val}%`, 'Prevalence']} />
                <Bar dataKey="percentage" fill="#0d9488" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium mt-3">
            💡 <strong>Key Finding:</strong> Irregular menstrual cycles (53%) and excess facial hair (38%) are the top 2 early indicators in rural India.
          </div>
        </div>

        {/* Chart 3: Primary Healthcare Seeking Barriers (Donut Chart) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {lang === 'hi' ? 'स्वास्थ्य सेवा पाने में मुख्य बाधाएं' : 'Primary Barriers to Healthcare Seeking'}
            </h3>
            <p className="text-xs text-slate-500 mb-2">Main obstacles preventing timely PHC consultations</p>
          </div>

          <div className="w-full flex items-center justify-center" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={researchData.care_barriers}
                  dataKey="percentage"
                  nameKey="barrier"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {researchData.care_barriers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {researchData.care_barriers.map((b, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-700 truncate">{b.barrier}: {b.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Survey Growth & Live Ingestion Timeline */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'hi' ? 'सर्वेक्षण डेटा संग्रह समय-सीमा' : 'Live Survey Ingestion Timeline'}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Cumulative survey responses over last 5 months</p>
          </div>

          <div className="w-full" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={researchData.timeline_growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="responses" stroke="#10b981" fill="#d1fae5" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium mt-3">
            📈 <strong>Live Data Stream:</strong> Real-time integration enables new survey form submissions to immediately update all graphs!
          </div>
        </div>

      </div>

      {/* MODAL: ADD LIVE SURVEY RESPONSE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-emerald-100 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Add Live Field Survey Response</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIngestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={newAge}
                  onChange={(e) => setNewAge(parseInt(e.target.value) || 24)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District / Sub-Center</label>
                <select
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  <option value="Lucknow">Lucknow</option>
                  <option value="Sitapur">Sitapur</option>
                  <option value="Kanpur">Kanpur</option>
                  <option value="Unnao">Unnao</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Healthcare Seeking Delay</label>
                <select
                  value={newDelay}
                  onChange={(e) => setNewDelay(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  <option value="<1 Month">&lt;1 Month</option>
                  <option value="1 - 3 Months">1 - 3 Months</option>
                  <option value="3 - 6 Months">3 - 6 Months</option>
                  <option value=">6 Months">&gt;6 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Barrier</label>
                <select
                  value={newBarrier}
                  onChange={(e) => setNewBarrier(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                >
                  <option value="Normalizing Symptoms">Normalizing Symptoms</option>
                  <option value="Financial & Travel">Financial & Travel</option>
                  <option value="Social Stigma">Social Stigma</option>
                  <option value="Lack of PHC Referral">Lack of PHC Referral</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingestLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow"
                >
                  {ingestLoading ? 'Ingesting...' : 'Ingest & Re-render Graphs'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, CheckCircle2, AlertTriangle, Clock, Calendar, Search, ShieldAlert, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function AshaDashboard({ onLookupPatient, lang }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-500 font-semibold">
        Loading ASHA Dashboard metrics...
      </div>
    );
  }

  const kpis = stats.kpis;
  const cases = stats.recent_cases || [];

  const filteredCases = filterLevel === 'ALL'
    ? cases
    : cases.filter(c => c.triage_level === filterLevel);

  // Pie chart data for Triage Level Distribution
  const pieData = [
    { name: 'Level 1 Routine', value: kpis.level_1_routine, color: '#10b981' },
    { name: 'Level 2 Assessment', value: kpis.level_2_assessment, color: '#f59e0b' },
    { name: 'Level 3 Escalation', value: kpis.level_3_escalation, color: '#ef4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            {lang === 'hi' ? 'आशा संचालन एवं ट्राइएज डैशबोर्ड' : 'ASHA Operational & Triage Dashboard'}
          </h1>
          <p className="text-slate-600 text-xs md:text-sm">
            {lang === 'hi' ? 'रामपुर प्राथमिक स्वास्थ्य केंद्र - दैनिक स्वास्थ्य मामले एवं फॉलो-अप' : 'Rampur Sub-Center — Field Assessment Metrics & Referral Follow-up Management'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-bold">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'hi' ? 'लाइव सिंक डेटा' : 'Real-time System Sync'}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Assessed */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{lang === 'hi' ? 'कुल मूल्यांकन' : 'Total Assessed'}</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{kpis.total_assessed}</div>
          <p className="text-[10px] text-slate-500 mt-1">Women screened in village</p>
        </div>

        {/* Level 1 Routine */}
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{lang === 'hi' ? 'स्तर 1 (सामान्य)' : 'Level 1 Routine'}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-950">{kpis.level_1_routine}</div>
          <p className="text-[10px] text-emerald-700 mt-1">Routine monitoring</p>
        </div>

        {/* Level 2 Assessment */}
        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{lang === 'hi' ? 'स्तर 2 (जांच सलाह)' : 'Level 2 Assessment'}</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-950">{kpis.level_2_assessment}</div>
          <p className="text-[10px] text-amber-700 mt-1">Further PHC evaluation</p>
        </div>

        {/* Level 3 Escalation */}
        <div className="bg-red-50 p-5 rounded-3xl border border-red-200">
          <div className="flex items-center justify-between text-red-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{lang === 'hi' ? 'स्तर 3 (अति आवश्यक)' : 'Level 3 Escalation'}</span>
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-black text-red-950">{kpis.level_3_escalation}</div>
          <p className="text-[10px] text-red-700 mt-1">Critical safety / high risk</p>
        </div>

      </div>

      {/* Urgent Action Alert Section */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              {lang === 'hi' ? 'आज के आवश्यक फॉलो-अप एवं रेफरल रिमाइंडर' : 'Urgent Follow-ups & Referral Tasks Due Today'}
            </h3>
            <p className="text-xs text-slate-600">
              {kpis.followups_due} follow-up visits pending for level 2 & 3 cases in Rampur sub-center.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-xl text-xs">
            {kpis.pending_referrals} Pending Referrals
          </span>
          <span className="bg-emerald-700 text-white font-bold px-3 py-1 rounded-xl text-xs">
            {kpis.completed_referrals} Completed
          </span>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Pie Chart: Triage Level Distribution */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              {lang === 'hi' ? 'ट्राइएज स्तर वितरण' : 'Triage Level Distribution'}
            </h3>
            <p className="text-xs text-slate-500">Breakdown of assessed cases</p>
          </div>

          <div className="h-48 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><span className="w-2 h-2 rounded-full inline-block bg-emerald-500 mr-1"></span> L1: {kpis.level_1_routine}</div>
            <div><span className="w-2 h-2 rounded-full inline-block bg-amber-500 mr-1"></span> L2: {kpis.level_2_assessment}</div>
            <div><span className="w-2 h-2 rounded-full inline-block bg-red-500 mr-1"></span> L3: {kpis.level_3_escalation}</div>
          </div>
        </div>

        {/* Case History Table */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'hi' ? 'हाल के मामले एवं स्थिति' : 'Recent Patient Assessments'}
              </h3>
              <p className="text-xs text-slate-500">Live feed of frontline assessments</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['ALL', 'LEVEL 1', 'LEVEL 2', 'LEVEL 3'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterLevel === lvl ? 'bg-white text-slate-900 shadow font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                <tr>
                  <th className="p-3">Patient ID</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Triage Level</th>
                  <th className="p-3">Red Flag</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => (
                  <tr
                    key={c.assessment_id}
                    onClick={() => onLookupPatient(c.patient_code)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{c.patient_code}</td>
                    <td className="p-3">{c.age} yrs</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        c.triage_level === 'LEVEL 1' ? 'bg-emerald-100 text-emerald-800' :
                        c.triage_level === 'LEVEL 2' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {c.triage_level}
                      </span>
                    </td>
                    <td className="p-3">
                      {c.red_flag_triggered ? (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Triggered
                        </span>
                      ) : (
                        <span className="text-slate-400">Clear</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg transition text-[11px]"
                      >
                        {lang === 'hi' ? 'समीक्षा करें' : 'VIEW'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

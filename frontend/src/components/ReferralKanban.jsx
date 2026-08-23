import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, Clock, Calendar, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export default function ReferralKanban({ lang }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referrals');
      const data = await res.json();
      setReferrals(data.referrals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleUpdateStatus = async (refId, newStatus) => {
    try {
      await fetch(`/api/referrals/update?referral_id=${refId}&status=${newStatus}`, { method: 'POST' });
      fetchReferrals();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Loading Referral Kanban...</div>;
  }

  const columns = [
    { id: 'Pending', label: lang === 'hi' ? 'लंबित (Pending)' : 'Pending Referral', color: 'bg-amber-50 border-amber-200' },
    { id: 'Referred', label: lang === 'hi' ? 'रेफर किया गया (Referred)' : 'Referred to PHC', color: 'bg-blue-50 border-blue-200' },
    { id: 'Follow-up Due', label: lang === 'hi' ? 'फॉलो-अप देय (Follow-Up Due)' : 'Follow-Up Due', color: 'bg-purple-50 border-purple-200' },
    { id: 'Completed', label: lang === 'hi' ? 'पूर्ण (Completed)' : 'Completed', color: 'bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            {lang === 'hi' ? 'रेफरल एवं फॉलो-अप कानबान (Referral Kanban)' : 'Referral & Follow-up Workflow Tracker'}
          </h1>
          <p className="text-slate-600 text-xs md:text-sm">
            {lang === 'hi'
              ? 'मरीज़ों के रेफरल से लेकर प्राथमिक स्वास्थ्य केंद्र में जांच एवं परिणाम तक की स्थिति ट्रैक करें।'
              : 'Track patient lifecycle from initial assessment triage to PHC consultation and follow-up outcome.'}
          </p>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colItems = referrals.filter(r => r.status === col.id);
          return (
            <div key={col.id} className={`rounded-3xl p-4 border ${col.color} flex flex-col justify-between min-h-[500px]`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm">{col.label}</h3>
                  <span className="bg-white px-2.5 py-0.5 rounded-full font-black text-xs shadow-sm text-slate-700">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colItems.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">{item.patient_code}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          item.triage_level === 'LEVEL 3' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.triage_level}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-800">{item.patient_name} ({item.age} yrs)</div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">{item.facility_name}</span>
                      </p>

                      {/* Status Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                        {item.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Referred')}
                            className="text-blue-700 hover:underline flex items-center gap-1"
                          >
                            <span>Mark Referred</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {item.status === 'Referred' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Follow-up Due')}
                            className="text-purple-700 hover:underline flex items-center gap-1"
                          >
                            <span>Schedule Followup</span> <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        {item.status === 'Follow-up Due' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Completed')}
                            className="text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <span>Complete Case</span> <CheckCircle2 className="w-3 h-3" />
                          </button>
                        )}
                        {item.status === 'Completed' && (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-mono pt-4">
                SANJIVANI Workflow Tracker
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

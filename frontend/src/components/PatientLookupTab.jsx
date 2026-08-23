import React, { useState } from 'react';
import { Search, UserCheck, FileText, ArrowRight, ShieldCheck, User } from 'lucide-react';
import PatientAssessmentReview from './PatientAssessmentReview';

export default function PatientLookupTab({ lang }) {
  const [patientIdInput, setPatientIdInput] = useState('');
  const [searchedPatientCode, setSearchedPatientCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const samplePatients = [
    { code: 'PAT-1089', name: 'Priya Sharma', age: 23, triage: 'LEVEL 2', date: '2026-08-21' },
    { code: 'PAT-1090', name: 'Kavita Devi', age: 28, triage: 'LEVEL 3', date: '2026-08-21' },
    { code: 'PAT-1091', name: 'Anita Kumari', age: 19, triage: 'LEVEL 1', date: '2026-08-21' },
    { code: 'PAT-1092', name: 'Rekha Singh', age: 31, triage: 'LEVEL 2', date: '2026-08-21' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!patientIdInput.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया एक वैध पेशेंट आईडी दर्ज करें' : 'Please enter a valid Patient ID');
      return;
    }
    setErrorMsg(null);
    setSearchedPatientCode(patientIdInput.trim().toUpperCase());
  };

  const handleSelectSample = (code) => {
    setPatientIdInput(code);
    setSearchedPatientCode(code);
    setErrorMsg(null);
  };

  // If a patient code is selected/searched, render the structured review
  if (searchedPatientCode) {
    return (
      <PatientAssessmentReview
        patientCode={searchedPatientCode}
        onBack={() => setSearchedPatientCode(null)}
        lang={lang}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-emerald-900 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-700 text-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2">
            <UserCheck className="w-4 h-4 text-emerald-300" />
            <span>ASHA Dedicated Patient Portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            {lang === 'hi' ? 'मरीज़ स्वास्थ्य समीक्षा (Patient Lookup)' : 'Patient Assessment Lookup'}
          </h1>
          <p className="text-emerald-200 text-xs md:text-sm mt-1 max-w-xl">
            {lang === 'hi'
              ? 'मरीज़ की दर्ज आईडी खोजें, उनके द्वारा भरे गए स्वास्थ्य फॉर्म की समीक्षा करें, और वर्चुअल सहायता प्रदान करें।'
              : 'Enter patient ID to access and review submitted health indicators without asking patient to repeat the form.'}
          </p>
        </div>
      </div>

      {/* SEARCH CARD */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border-2 border-emerald-500/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'hi' ? 'पेशेंट आईडी दर्ज करें' : 'Enter Authorized Patient ID'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'hi'
                ? 'मरीज़ द्वारा भरे गए फॉर्म की पूरी समीक्षा के लिए पेशेंट आईडी (जैसे PAT-1089) दर्ज करें'
                : 'Lookup patient health assessment using Patient ID code (e.g., PAT-1089)'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder={lang === 'hi' ? 'पेशेंट आईडी (उदा. PAT-1089)' : 'Enter Patient ID (e.g. PAT-1089)'}
              value={patientIdInput}
              onChange={(e) => {
                setPatientIdInput(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full p-4 rounded-2xl border-2 border-slate-300 font-mono text-lg font-bold text-slate-900 focus:border-emerald-600 focus:outline-none uppercase bg-slate-50"
            />
          </div>

          <button
            type="submit"
            className="px-7 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition flex items-center gap-2 text-base"
          >
            <Search className="w-5 h-5" />
            <span>{lang === 'hi' ? 'मरीज़ देखें (VIEW PATIENT)' : 'VIEW PATIENT'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* QUICK SELECTION PATIENT LIST */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>{lang === 'hi' ? 'हाल के रजिस्टर्ड मरीज़ (Quick Patient Selection):' : 'Recently Registered Patients (Quick Lookup):'}</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-3">
          {samplePatients.map((p) => (
            <div
              key={p.code}
              onClick={() => handleSelectSample(p.code)}
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">{p.code}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    p.triage === 'LEVEL 1' ? 'bg-emerald-100 text-emerald-800' :
                    p.triage === 'LEVEL 2' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.triage}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-1">{p.name} ({p.age} yrs)</div>
              </div>

              <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                <span>View</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

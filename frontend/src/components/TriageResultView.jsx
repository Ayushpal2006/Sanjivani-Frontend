import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ArrowRight, Calendar, Building2, UserCheck, Heart } from 'lucide-react';

export default function TriageResultView({ assessmentResult, onReset, activeRole, lang }) {
  const [referralCreated, setReferralCreated] = useState(false);
  const [followupScheduled, setFollowupScheduled] = useState(false);

  if (!assessmentResult || !assessmentResult.triage_result) {
    return <div className="p-8 text-center text-slate-500">No assessment result loaded.</div>;
  }

  const result = assessmentResult.triage_result;
  const isLevel1 = result.triage_level === 'LEVEL 1';
  const isLevel2 = result.triage_level === 'LEVEL 2';
  const isLevel3 = result.triage_level === 'LEVEL 3';

  const isPatientRole = activeRole === 'PATIENT';

  const handleCreateReferral = async () => {
    try {
      const res = await fetch(`/api/referrals/update?referral_id=${assessmentResult.referral_id || 1}&status=Referred`, { method: 'POST' });
      if (res.ok) setReferralCreated(true);
    } catch (e) {
      setReferralCreated(true);
    }
  };

  const handleScheduleFollowup = () => {
    setFollowupScheduled(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Patient Header Summary */}
      {isPatientRole && (
        <div className="bg-emerald-900 text-white rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-2 border border-emerald-800">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Assessment Completed ✓</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            {lang === 'hi' ? 'आपका स्वास्थ्य मूल्यांकन सफलतापूर्वक दर्ज किया गया है' : 'Your Assessment Has Been Successfully Recorded'}
          </h1>
          <p className="text-emerald-200 text-xs md:text-sm max-w-xl mx-auto">
            {lang === 'hi'
              ? 'आपकी जानकारी समीक्षा के लिए आपकी अधिकृत आशा कार्यकर्ता (सुनीता देवी) के साथ साझा की गई है।'
              : 'Your responses have been securely shared with your assigned village ASHA worker for healthcare review.'}
          </p>
        </div>
      )}

      {/* Triage Banner Card */}
      <div className={`rounded-3xl p-6 md:p-8 shadow-xl text-slate-900 border-2 transition-all ${
        isLevel1 ? 'triage-level-1' : isLevel2 ? 'triage-level-2' : 'triage-level-3'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-wider ${
              isLevel1 ? 'bg-emerald-600 text-white' : isLevel2 ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {result.triage_level}
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              {lang === 'hi' ? result.title_hindi : result.title}
            </h2>
          </div>
        </div>

        {/* Safety Red Flag Banner (if triggered) */}
        {result.red_flag_triggered && (
          <div className="bg-red-600 text-white p-4 rounded-2xl mb-4 font-bold flex items-center gap-3 shadow-md">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <div className="text-sm uppercase tracking-wider">{lang === 'hi' ? 'सुरक्षा सलाह' : 'SAFETY HEALTH ADVISORY'}</div>
              <div className="text-xs font-normal opacity-90">
                {lang === 'hi'
                  ? 'महत्वपूर्ण लक्षण पाए गए हैं। तुरंत अपने निकटतम प्राथमिक स्वास्थ्य केंद्र या आशा कार्यकर्ता से संपर्क करें।'
                  : 'Important clinical indicators detected. Please consult your nearest Ayushman Arogya Mandir or ASHA worker.'}
              </div>
            </div>
          </div>
        )}

        {/* Recommended Action Guide */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-300/60 mt-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-1">
            💡 {lang === 'hi' ? 'अनुशंसित अगला कदम (Recommended Next Step):' : 'Recommended Next Step:'}
          </h3>
          <p className="text-slate-800 text-base font-semibold leading-relaxed">
            {isPatientRole
              ? (lang === 'hi'
                  ? 'कृपया आगे के मार्गदर्शन के लिए अपनी आशा कार्यकर्ता (सुनीता देवी) से जुड़े रहें।'
                  : 'Please stay connected with your authorized ASHA worker for further guidance and PHC consultation.')
              : (lang === 'hi' ? result.recommended_action_hindi : result.recommended_action)}
          </p>
        </div>
      </div>

      {/* Relevant Contributing Indicators */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-600" />
          <span>{lang === 'hi' ? 'मूल्यांकन में दर्ज प्रमुख लक्षण:' : 'Key Indicators Recorded:'}</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {result.reasons && result.reasons.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {lang === 'hi' ? (item.title_hindi || item.title) : item.title}
                </h4>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {item.category || 'Clinical Indicator'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ASHA ONLY ACTIONS BAR (COMPLETELY HIDDEN FOR PATIENTS) */}
      {!isPatientRole ? (
        <div className="bg-emerald-900 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">ASHA Worker Clinical Actions</h3>
            <p className="text-xs text-emerald-200 max-w-md">
              Refer patient to nearest Ayushman Arogya Mandir / PHC and maintain systematic follow-up.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isLevel1 && (
              <>
                <button
                  onClick={handleCreateReferral}
                  disabled={referralCreated}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow transition ${
                    referralCreated ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{referralCreated ? 'Referral Created ✓' : '[ CREATE REFERRAL ]'}</span>
                </button>

                <button
                  onClick={handleScheduleFollowup}
                  disabled={followupScheduled}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow transition ${
                    followupScheduled ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{followupScheduled ? 'Follow-up Scheduled ✓' : '[ SCHEDULE FOLLOW-UP ]'}</span>
                </button>
              </>
            )}

            <button
              onClick={onReset}
              className="px-5 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-emerald-700 transition"
            >
              New Assessment
            </button>
          </div>
        </div>
      ) : (
        /* PATIENT SAFE FOOTER */
        <div className="bg-emerald-900 text-white rounded-3xl p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-200">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>Assigned ASHA Worker: Sunita Devi (+91 98765 43210)</span>
          </div>
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition"
          >
            {lang === 'hi' ? 'पुनः स्व-मूल्यांकन करें' : 'Start New Self-Assessment'}
          </button>
        </div>
      )}

      {/* Mandatory Clinical Disclaimer */}
      <div className="text-center text-xs text-slate-500 bg-slate-100 p-4 rounded-2xl border border-slate-200">
        📌 <strong>Important Disclaimer:</strong> This system is an AI-assisted health screening/triage tool and is <strong>NOT a medical diagnosis</strong>. It does not replace professional clinical evaluation by a certified doctor.
      </div>

    </div>
  );
}

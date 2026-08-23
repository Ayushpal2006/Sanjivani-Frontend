import React from 'react';
import { UserCheck, HeartHandshake, ShieldCheck, Stethoscope, MapPin, ArrowRight } from 'lucide-react';

export default function RoleLoginModal({ onSelectRole, lang }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-8 border border-emerald-100">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SANJIVANI Healthcare System</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
            {lang === 'hi' ? 'संजीवनी पोर्टल में आपका स्वागत है' : 'Welcome to SANJIVANI'}
          </h1>
          <p className="text-slate-600 text-base max-w-lg mx-auto">
            {lang === 'hi'
              ? 'प्रत्येक आशा से, एक नई आशा। कृपया लॉगिन करने के लिए अपनी भूमिका का चयन करें।'
              : '"From Every ASHA, A New Asha." Please select your access portal to continue.'}
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Card 1: ASHA Worker Portal */}
          <div
            onClick={() => onSelectRole('ASHA')}
            className="group cursor-pointer bg-emerald-50/60 hover:bg-emerald-100/80 border-2 border-emerald-200 hover:border-emerald-500 rounded-2xl p-6 transition-all duration-200 transform hover:-translate-y-1 shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-md">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-900">
                {lang === 'hi' ? 'आशा कार्यकर्ता पोर्टल' : 'ASHA Worker Portal'}
              </h2>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                {lang === 'hi'
                  ? 'डिजिटल स्वास्थ्य मूल्यांकन, रेड-फ्लैग सुरक्षा जांच, 3-स्तरीय ट्राइएज, रेफरल प्रबंधन एवं फॉलो-अप ट्रैक करें।'
                  : 'Conduct structured assessments, view AI triage recommendations, trigger safety red-flags, and manage patient referrals & follow-ups.'}
              </p>
            </div>
            
            <div className="pt-4 border-t border-emerald-200/60 flex items-center justify-between text-emerald-700 font-bold text-sm">
              <span>{lang === 'hi' ? 'आशा पोर्टल में प्रवेश करें' : 'Enter ASHA Portal'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Patient / Woman Portal */}
          <div
            onClick={() => onSelectRole('PATIENT')}
            className="group cursor-pointer bg-teal-50/60 hover:bg-teal-100/80 border-2 border-teal-200 hover:border-teal-500 rounded-2xl p-6 transition-all duration-200 transform hover:-translate-y-1 shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-md">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-900">
                {lang === 'hi' ? 'मरीज़ / महिला पोर्टल' : 'Patient / Woman Portal'}
              </h2>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                {lang === 'hi'
                  ? 'स्व-मूल्यांकन फॉर्म भरें, अपनी डिजिटल रिपोर्ट देखें, और निकटतम आयुष्मान आरोग्य मंदिर एवं आशा कार्यकर्ता को खोजें।'
                  : 'Complete simple self-assessment, view personal triage summary, and locate nearby Ayushman Arogya Mandir health centers.'}
              </p>
            </div>
            
            <div className="pt-4 border-t border-teal-200/60 flex items-center justify-between text-teal-700 font-bold text-sm">
              <span>{lang === 'hi' ? 'मरीज़ पोर्टल में प्रवेश करें' : 'Enter Patient Portal'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </div>
          </div>

        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-xs text-slate-500 bg-slate-100 p-3 rounded-xl">
          🔒 {lang === 'hi'
            ? 'संजीवनी एक निर्णय-सहायता और ट्राइएज प्रणाली है। यह प्रत्यक्ष चिकित्सीय निदान का विकल्प नहीं है।'
            : 'SANJIVANI is an AI-assisted decision-support & triage system. It does not replace clinical diagnosis by a certified medical officer.'}
        </div>

      </div>
    </div>
  );
}

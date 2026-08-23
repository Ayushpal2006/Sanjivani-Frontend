import React, { useState } from 'react';
import Navbar from './components/Navbar';
import RoleLoginModal from './components/RoleLoginModal';
import AssessmentForm from './components/AssessmentForm';
import TriageResultView from './components/TriageResultView';
import AshaDashboard from './components/AshaDashboard';
import PatientLookupTab from './components/PatientLookupTab';
import PatientAssessmentReview from './components/PatientAssessmentReview';
import ReferralKanban from './components/ReferralKanban';
import CenterMapLocator from './components/CenterMapLocator';
import FieldResearchTab from './components/FieldResearchTab';

export default function App() {
  // State
  const [activeRole, setActiveRole] = useState(null); // 'ASHA' or 'PATIENT'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'lookup', 'review', 'assessment', 'referrals', 'map', 'research', 'result'
  const [lang, setLang] = useState('en'); // 'en' or 'hi'
  const [selectedPatientCode, setSelectedPatientCode] = useState(null);
  const [currentAssessmentResult, setCurrentAssessmentResult] = useState(null);

  const handleSelectRole = (role) => {
    setActiveRole(role);
    if (role === 'ASHA') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('assessment');
    }
  };

  const handleLookupPatient = (patientCode) => {
    setSelectedPatientCode(patientCode);
    setActiveTab('review');
  };

  const handleAssessmentComplete = (data) => {
    setCurrentAssessmentResult(data);
    setActiveTab('result');
  };

  const handleResetAssessment = () => {
    setCurrentAssessmentResult(null);
    setActiveTab('assessment');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Role Selection Modal if not selected */}
      {!activeRole && (
        <RoleLoginModal onSelectRole={handleSelectRole} lang={lang} />
      )}

      {/* Main Header Navigation */}
      {activeRole && (
        <Navbar
          activeRole={activeRole}
          setActiveRole={setActiveRole}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          setLang={setLang}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-12">
        {activeRole && (
          <>
            {activeTab === 'dashboard' && activeRole === 'ASHA' && (
              <AshaDashboard
                onLookupPatient={handleLookupPatient}
                lang={lang}
              />
            )}

            {activeTab === 'lookup' && activeRole === 'ASHA' && (
              <PatientLookupTab
                lang={lang}
              />
            )}

            {activeTab === 'review' && activeRole === 'ASHA' && (
              <PatientAssessmentReview
                patientCode={selectedPatientCode || 'PAT-1089'}
                onBack={() => setActiveTab('lookup')}
                lang={lang}
              />
            )}

            {activeTab === 'assessment' && (
              <AssessmentForm
                onAssessmentComplete={handleAssessmentComplete}
                activeRole={activeRole}
                lang={lang}
              />
            )}

            {activeTab === 'result' && (
              <TriageResultView
                assessmentResult={currentAssessmentResult}
                onReset={handleResetAssessment}
                activeRole={activeRole}
                lang={lang}
              />
            )}

            {activeTab === 'referrals' && activeRole === 'ASHA' && (
              <ReferralKanban lang={lang} />
            )}

            {activeTab === 'map' && (
              <CenterMapLocator lang={lang} />
            )}

            {activeTab === 'research' && activeRole === 'ASHA' && (
              <FieldResearchTab lang={lang} />
            )}
          </>
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 px-6 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            <strong className="text-white">SANJIVANI</strong> — "From Every ASHA, A New Asha." | AI-Assisted Women's Health Triage Platform
          </div>
          <div>
            Built for Hackathon Prototype | Ayushman Arogya Mandir / PHC Decision Support
          </div>
        </div>
      </footer>

    </div>
  );
}

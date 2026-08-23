import React, { useState } from 'react';
import { PhoneCall, MessageSquare, Video, ShieldCheck, X, CheckCircle2, UserCheck } from 'lucide-react';

export default function VirtualSupportModal({ patient, assessment, onClose, lang }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'system', text: `Authenticated virtual support session initialized for Patient ${patient.patient_code}.` },
    { sender: 'asha', text: `Namaste ${patient.name}, I have reviewed your submitted health assessment (${assessment.triage_level}). I am here to guide you.` }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { sender: 'asha', text: inputText }]);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 border border-emerald-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">Virtual Patient Support Connector</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">AUTHENTICATED</span>
              </div>
              <p className="text-xs text-slate-500">Patient: {patient.name} ({patient.patient_code}) | Triage: {assessment.triage_level}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Modes */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <button
            onClick={() => setSessionActive(true)}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              sessionActive ? 'bg-emerald-700 text-white border-emerald-800 shadow' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Encrypted Text Chat</span>
          </button>

          <button
            onClick={() => alert(`Initiating voice call to patient's registered phone (+91 98765 43210)...`)}
            className="p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 transition"
          >
            <PhoneCall className="w-4 h-4 text-amber-600" />
            <span>Initiate Voice Call</span>
          </button>
        </div>

        {/* Virtual Chat Stream */}
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto space-y-3 min-h-[220px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'asha' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${
                m.sender === 'system'
                  ? 'bg-slate-200 text-slate-700 text-center w-full font-mono text-[10px]'
                  : m.sender === 'asha'
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Send Message Form */}
        <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type guidance message or PHC consultation notes..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 p-3 rounded-2xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow transition"
          >
            Send
          </button>
        </form>

        {/* Footer */}
        <div className="mt-3 text-[10px] text-slate-400 text-center">
          🔒 Session logged for ASHA healthcare support compliance.
        </div>

      </div>
    </div>
  );
}

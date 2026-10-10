import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  FileText, 
  Search, 
  Printer, 
  Calendar, 
  User, 
  Clock, 
  Eye, 
  Stethoscope 
} from 'lucide-react';

export const PrescriptionsListView: React.FC = () => {
  const { 
    prescriptions, 
    patients, 
    openPrescriptionPrint, 
    setActiveTab, 
    startConsultation 
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrescriptions = prescriptions.filter(rx => {
    const q = searchQuery.toLowerCase();
    const patient = patients.find(p => p.id === rx.patientId);
    const remedyNames = rx.remedies.map(r => r.name.toLowerCase()).join(' ');

    return (
      rx.patientName.toLowerCase().includes(q) ||
      (patient && patient.patientId.toLowerCase().includes(q)) ||
      remedyNames.includes(q) ||
      rx.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Prescription Records (Rx)</h2>
              <span className="text-xs font-mono font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                {prescriptions.length} issued
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Archive of all digital homoeopathic prescriptions with reprint and audit capabilities.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient, Remedy (e.g. Arnica), or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Prescriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrescriptions.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No prescriptions found matching "{searchQuery}".
          </div>
        ) : (
          filteredPrescriptions.map(rx => {
            const patient = patients.find(p => p.id === rx.patientId);

            return (
              <div
                key={rx.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-400 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {patient?.patientId || 'HC-Walkin'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(rx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {rx.patientName}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Age: {rx.patientAge || patient?.age}y · {rx.patientGender || patient?.gender}
                  </p>

                  {/* Prescribed Remedies Summary */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Prescribed Remedies ({rx.remedies.length}):
                    </span>
                    {rx.remedies.map(r => (
                      <div key={r.id} className="text-xs text-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-stone-900">{r.name} {r.potency}</span>
                        <span className="text-[11px] text-slate-500">{r.dosage} ({r.frequency})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print & View Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openPrescriptionPrint(rx)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Letterhead</span>
                  </button>

                  {patient && (
                    <button
                      onClick={() => startConsultation(patient)}
                      title="New consultation for this patient"
                      className="p-2 text-slate-500 hover:text-stone-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <Stethoscope className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

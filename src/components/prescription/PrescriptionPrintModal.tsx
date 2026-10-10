import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Printer, 
  X, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Download 
} from 'lucide-react';

export const PrescriptionPrintModal: React.FC = () => {
  const { 
    activePrescriptionToPrint, 
    closePrescriptionPrint, 
    settings, 
    patients, 
    consultations 
  } = useClinic();

  if (!activePrescriptionToPrint) return null;

  const patient = patients.find(p => p.id === activePrescriptionToPrint.patientId);
  const consultation = consultations.find(c => c.id === activePrescriptionToPrint.consultationId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      
      {/* Top Floating Control Bar (Hidden during Print) */}
      <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>

        <button
          onClick={closePrescriptionPrint}
          className="p-2 text-slate-700 bg-white hover:bg-slate-100 rounded-xl shadow-lg transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Sheet (Matches A4 standard prescription format) - Aesthetic Styling */}
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-3xl w-full p-8 sm:p-12 my-8 print:m-0 print:p-6 print:border-none print:shadow-none print:w-full">
        
        {/* Official Clinic Letterhead */}
        <div className="border-b-2 border-indigo-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            
            {/* Left: Clinic Identity */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center justify-center font-bold text-lg font-mono">
                  {settings.clinicName ? settings.clinicName.substring(0, 2).toUpperCase() : 'HC'}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                    {settings.clinicName}
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 tracking-wide">
                    {settings.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-stone-500 space-y-0.5">
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>{settings.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>{settings.phone}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span>{settings.email}</span>
                  </span>
                </p>
                {settings.opdTimings && (
                  <p className="text-[10px] text-stone-400 font-medium">
                    OPD: {settings.opdTimings}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Doctor Credentials */}
            <div className="sm:text-right">
              <h2 className="text-base font-bold text-stone-900">
                {settings.doctorName}
              </h2>
              <p className="text-xs text-stone-700 font-medium">
                {settings.qualification}
              </p>
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                Council Reg No: <span className="font-semibold text-stone-800">{settings.registrationNumber}</span>
              </p>
              <p className="text-[11px] text-stone-500">
                Chief Homoeopathic Physician
              </p>
            </div>

          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="my-5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Patient Name</span>
              <span className="font-bold text-stone-900">{activePrescriptionToPrint.patientName}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Patient ID / Age</span>
              <span className="font-mono font-bold text-stone-800">
                {patient?.patientId || 'HC-Walkin'} · {activePrescriptionToPrint.patientAge || patient?.age}y / {activePrescriptionToPrint.patientGender || patient?.gender}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Consultation Date</span>
              <span className="font-mono text-stone-800">
                {new Date(activePrescriptionToPrint.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Vitals Summary</span>
              <span className="font-mono text-stone-700">
                {consultation?.vitals?.bp ? `BP: ${consultation.vitals.bp}` : 'Vitals Checked'}
                {consultation?.vitals?.weight ? ` · ${consultation.vitals.weight}kg` : ''}
              </span>
            </div>
          </div>

          {consultation?.diagnosis && (
            <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider">Clinical Diagnosis:</span>
              <span className="text-xs font-semibold text-stone-800">{consultation.diagnosis}</span>
            </div>
          )}
        </div>

        {/* Prescription Header Symbol (Rx) */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-3xl font-bold text-stone-900">℞</span>
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Homoeopathic Medicinal & Skincare Prescription</span>
          </div>
          <span className="text-[11px] font-mono text-stone-400">Rx Ref: {activePrescriptionToPrint.id}</span>
        </div>

        {/* Remedies Table */}
        <div className="border border-stone-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3">Remedy / Product & Potency</th>
                <th className="py-2.5 px-3">Form</th>
                <th className="py-2.5 px-3">Dosage & Frequency</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Special Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {activePrescriptionToPrint.remedies.map((rem, idx) => (
                <tr key={rem.id} className="hover:bg-stone-50/50">
                  <td className="py-3 px-3 font-mono font-bold text-stone-400">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-stone-900 text-sm block">{rem.name}</span>
                    <span className="font-mono text-xs font-semibold text-stone-700">{rem.potency}</span>
                  </td>
                  <td className="py-3 px-3 capitalize text-stone-600 font-medium">
                    {rem.form.replace('-', ' ')}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-stone-800 block">{rem.dosage}</span>
                    <span className="text-[11px] text-stone-600">{rem.frequency}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-stone-700">
                    {rem.durationDays} Days
                  </td>
                  <td className="py-3 px-3 text-stone-600 italic text-[11px]">
                    {rem.instructions || 'Dissolve on clean dry tongue'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Homoeopathic Dietary Precautions & Advice */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 mb-6">
          <p className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
            Important Instructions & Dietary Precautions:
          </p>
          <p className="text-stone-600 leading-relaxed text-[11px]">
            {activePrescriptionToPrint.generalAdvice || 
              settings.defaultPrescriptionAdvice ||
              'Avoid raw onions, garlic, camphor, menthol, and strong coffee within 30 minutes before and after taking medicines. Keep phials away from direct sunlight, pungent spices, and electronic magnetic devices.'}
          </p>
        </div>

        {/* Footer: Follow-up Date & Doctor Signature */}
        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-end justify-between gap-6">
          <div>
            {consultation?.nextVisitDate && (
              <p className="text-xs font-semibold text-stone-800">
                Next Review / Follow-up:{' '}
                <span className="font-mono text-stone-900 font-bold">
                  {new Date(consultation.nextVisitDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </p>
            )}
            <p className="text-[10px] text-stone-400 mt-1">
              Generated by {settings.clinicName} on {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>

          <div className="text-center sm:text-right">
            <div className="inline-block border-b border-stone-400 pb-1 mb-1 px-8">
              <span className="font-serif italic text-base text-stone-900 font-bold block">
                {settings.doctorName}
              </span>
            </div>
            <p className="text-[11px] font-bold text-stone-800">
              {activePrescriptionToPrint.doctorSignature}
            </p>
            <p className="text-[10px] text-stone-500 font-mono">
              Reg No: {settings.registrationNumber}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

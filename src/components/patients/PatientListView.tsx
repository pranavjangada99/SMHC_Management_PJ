import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient } from '../../types/clinic';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  Stethoscope, 
  FileText, 
  History, 
  Eye, 
  Edit3,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface PatientListViewProps {
  onOpenNewPatientModal: () => void;
  onOpenBookAppointmentModal: (patientId?: string) => void;
}

export const PatientListView: React.FC<PatientListViewProps> = ({ 
  onOpenNewPatientModal, 
  onOpenBookAppointmentModal 
}) => {
  const { 
    patients, 
    consultations, 
    prescriptions, 
    invoices, 
    startConsultation, 
    openPrescriptionPrint,
    updatePatient 
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Search filter
  const filteredPatients = patients.filter(patient => {
    const q = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(q) ||
      patient.patientId.toLowerCase().includes(q) ||
      patient.phone.includes(q) ||
      (patient.constitutionalType && patient.constitutionalType.toLowerCase().includes(q)) ||
      (patient.allergies && patient.allergies.toLowerCase().includes(q))
    );
  });

  // Patient history for details modal
  const patientConsultations = selectedPatientForDetails 
    ? consultations.filter(c => c.patientId === selectedPatientForDetails.id)
    : [];

  const patientInvoices = selectedPatientForDetails
    ? invoices.filter(i => i.patientId === selectedPatientForDetails.id)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">Patient Directory</h2>
              <span className="text-xs font-mono font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                {patients.length} registered
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Comprehensive patient EMR records with homoeopathic constitutional histories.
            </p>
          </div>

          <button
            onClick={onOpenNewPatientModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200/90 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-700" />
            <span>Register New Patient</span>
          </button>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Patient Name, Patient ID, Phone, or Constitutional Remedy..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Patient Table / Data Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Homoeopathic Constitutional Affinity</th>
                <th className="py-3 px-4">Visits</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No patient records found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Patient ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {patient.patientId}
                    </td>

                    {/* Patient Name & Age/Gender */}
                    <td className="py-3.5 px-4">
                      <div>
                        <button
                          onClick={() => setSelectedPatientForDetails(patient)}
                          className="font-bold text-stone-900 hover:text-stone-700 hover:underline cursor-pointer text-left text-xs block"
                        >
                          {patient.name}
                        </button>
                        <span className="text-[11px] text-stone-500 capitalize">
                          {patient.age} yrs · {patient.gender} {patient.bloodGroup ? `· ${patient.bloodGroup}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4 text-stone-600">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{patient.phone}</span>
                      </div>
                      {patient.email && (
                        <div className="text-[11px] text-stone-400 truncate max-w-[150px]">
                          {patient.email}
                        </div>
                      )}
                    </td>

                    {/* Constitutional Affinity */}
                    <td className="py-3.5 px-4">
                      {patient.constitutionalType ? (
                        <span className="text-[11px] font-medium text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md inline-block max-w-[200px] truncate" title={patient.constitutionalType}>
                          {patient.constitutionalType}
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">Not evaluated</span>
                      )}
                    </td>

                    {/* Total Visits */}
                    <td className="py-3.5 px-4 font-mono text-stone-700 font-semibold">
                      {patient.totalVisits || 0}
                    </td>

                    {/* Last Visit */}
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                      {patient.lastVisitDate ? patient.lastVisitDate : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPatientForDetails(patient)}
                          title="View Complete Clinical History"
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenBookAppointmentModal(patient.id)}
                          title="Book OPD Appointment Token"
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => startConsultation(patient)}
                          title="Start Homoeopathic Consultation"
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer"
                        >
                          Consult
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detailed Profile & Full Visit History Modal */}
      {selectedPatientForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold flex items-center justify-center font-mono shadow-xs">
                  {selectedPatientForDetails.patientId.split('-').pop()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedPatientForDetails.name}</h3>
                    <span className="text-xs font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {selectedPatientForDetails.patientId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPatientForDetails.gender} · {selectedPatientForDetails.age} years · Blood Group: {selectedPatientForDetails.bloodGroup || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    startConsultation(selectedPatientForDetails);
                    setSelectedPatientForDetails(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-lg shadow-2xs cursor-pointer"
                >
                  Start New Consultation
                </button>

                <button
                  onClick={() => setSelectedPatientForDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  aria-label="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Profile Tabs & Clinical History Timeline */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Patient Core Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Constitutional Affinity</h4>
                  <p className="text-xs text-teal-900 font-medium bg-teal-50/80 p-2.5 rounded-lg border border-teal-200/60">
                    {selectedPatientForDetails.constitutionalType || 'None assigned yet.'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">
                    <span className="font-semibold text-slate-700">Allergies:</span> {selectedPatientForDetails.allergies || 'None reported'}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Contact & Residence</h4>
                  <p className="text-xs text-slate-700 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{selectedPatientForDetails.phone}</span>
                  </p>
                  {selectedPatientForDetails.email && (
                    <p className="text-xs text-slate-700 flex items-center gap-2 mt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedPatientForDetails.email}</span>
                    </p>
                  )}
                  {selectedPatientForDetails.address && (
                    <p className="text-xs text-slate-500 flex items-start gap-2 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedPatientForDetails.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Repeat Visit Consultations Timeline */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-stone-600" />
                  <span>Clinical Consultation History ({patientConsultations.length} records)</span>
                </h4>

                {patientConsultations.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No consultation records found for this patient yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientConsultations.map((con, idx) => {
                      const rx = prescriptions.find(r => r.consultationId === con.id);
                      return (
                        <div key={con.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center font-mono">
                                #{patientConsultations.length - idx}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {new Date(con.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-xs text-slate-400">· Dr. {con.doctorName}</span>
                            </div>

                            {rx && (
                              <button
                                onClick={() => openPrescriptionPrint(rx)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Print Rx</span>
                              </button>
                            )}
                          </div>

                          {/* Vitals */}
                          {con.vitals && (
                            <div className="flex flex-wrap gap-3 text-xs bg-slate-50 p-2 rounded-lg font-mono">
                              {con.vitals.bp && <span>BP: <strong>{con.vitals.bp}</strong></span>}
                              {con.vitals.pulse && <span>Pulse: <strong>{con.vitals.pulse} bpm</strong></span>}
                              {con.vitals.weight && <span>Weight: <strong>{con.vitals.weight} kg</strong></span>}
                              {con.vitals.spo2 && <span>SpO2: <strong>{con.vitals.spo2}%</strong></span>}
                            </div>
                          )}

                          {/* Diagnosis & Complaints */}
                          <div>
                            <p className="text-xs text-slate-800">
                              <span className="font-semibold text-stone-900">Diagnosis:</span> {con.diagnosis}
                            </p>
                            {con.chiefComplaints && con.chiefComplaints.length > 0 && (
                              <p className="text-xs text-slate-600 mt-1">
                                <span className="font-semibold">Complaints:</span> {con.chiefComplaints.map(c => `${c.complaint} (${c.duration})`).join('; ')}
                              </p>
                            )}
                          </div>

                          {/* Modalities & Mind Generals */}
                          {con.modalities && (
                            <div className="text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
                              <span className="font-semibold text-amber-900">Modalities:</span> Aggravation: {con.modalities.aggravation || 'None'}; Amelioration: {con.modalities.amelioration || 'None'}
                            </div>
                          )}

                          {/* Prescribed Remedies */}
                          {rx && rx.remedies.length > 0 && (
                            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                              <span className="text-[11px] font-bold text-stone-900 block mb-1">Prescription:</span>
                              <div className="space-y-1">
                                {rx.remedies.map(r => (
                                  <div key={r.id} className="text-xs text-stone-900 flex items-center justify-between">
                                    <span className="font-semibold">{r.name} {r.potency} ({r.form})</span>
                                    <span className="text-[11px] text-stone-600">{r.dosage} · {r.frequency} · {r.durationDays} days</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Billing History */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Billing & Receipt History</h4>
                {patientInvoices.length === 0 ? (
                  <p className="text-xs text-slate-400">No past billing transactions.</p>
                ) : (
                  <div className="space-y-2">
                    {patientInvoices.map(inv => (
                      <div key={inv.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                          <span className="text-slate-500 ml-2">· {inv.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">₹{inv.grandTotalINR}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

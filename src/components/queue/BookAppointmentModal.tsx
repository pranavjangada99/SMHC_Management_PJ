import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { AppointmentType } from '../../types/clinic';
import { 
  Clock, 
  X, 
  Calendar, 
  User, 
  Phone, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedPatientId?: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({ 
  isOpen, 
  onClose, 
  preSelectedPatientId 
}) => {
  const { 
    patients, 
    appointments, 
    scheduleAppointment, 
    settings 
  } = useClinic();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    preSelectedPatientId || (patients[0]?.id || 'walkin')
  );
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:30 AM');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('new');
  const [chiefComplaint, setChiefComplaint] = useState('');

  if (!isOpen) return null;

  // Calculate next token number for selected date
  const dayAppointments = appointments.filter(a => a.date === appointmentDate);
  const nextTokenNumber = dayAppointments.length + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let patId = selectedPatientId;
    let patName = '';
    let patPhone = '';

    if (selectedPatientId === 'walkin') {
      if (!walkinName.trim()) return;
      patId = `walkin-${Date.now()}`;
      patName = walkinName.trim();
      patPhone = walkinPhone.trim() || 'Not provided';
    } else {
      const existing = patients.find(p => p.id === selectedPatientId);
      if (!existing) return;
      patName = existing.name;
      patPhone = existing.phone;
    }

    scheduleAppointment({
      patientId: patId,
      patientName: patName,
      patientPhone: patPhone,
      date: appointmentDate,
      timeSlot,
      status: 'waiting',
      type: appointmentType,
      chiefComplaint: chiefComplaint.trim() || undefined,
    });

    // Reset and close
    setChiefComplaint('');
    setWalkinName('');
    setWalkinPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-850">Issue OPD Queue Token</h3>
              <p className="text-xs text-slate-500">{settings.doctorName}'s Homoeopathic Consultation Desk</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token Preview Banner */}
        <div className="mb-4 p-3.5 bg-stone-100/80 border border-stone-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Assigned OPD Token:</span>
            <span className="text-2xl font-bold font-mono text-stone-900">#{nextTokenNumber}</span>
          </div>
          <div className="text-right text-xs text-stone-700">
            <span>Date: <strong>{appointmentDate}</strong></span>
            <span className="block text-[11px] text-stone-500 font-medium">Doctor: {settings.doctorName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            >
              <option value="walkin">+ Quick Walk-in Patient (No File Yet)</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId}) · {p.phone}
                </option>
              ))}
            </select>
          </div>

          {selectedPatientId === 'walkin' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Walk-in Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Joshi"
                  value={walkinName}
                  onChange={e => setWalkinName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98..."
                  value={walkinPhone}
                  onChange={e => setWalkinPhone(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={e => setAppointmentDate(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
              <select
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
              >
                {['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', 'Immediate OPD'].map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Type</label>
              <select
                value={appointmentType}
                onChange={e => setAppointmentType(e.target.value as AppointmentType)}
                className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 capitalize"
              >
                <option value="new">New Consultation</option>
                <option value="follow-up">Follow-up Review</option>
                <option value="emergency">Emergency Acute</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint (Reported at Reception)</label>
            <textarea
              rows={2}
              placeholder="e.g. Chronic digestive complaints, headache, skin itch..."
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl shadow-2xs cursor-pointer"
            >
              Confirm & Issue Token #{nextTokenNumber}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

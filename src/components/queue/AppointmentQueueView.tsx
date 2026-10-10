import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { AppointmentStatus, AppointmentType } from '../../types/clinic';
import { 
  Clock, 
  Plus, 
  Search, 
  User, 
  Stethoscope, 
  CheckCircle, 
  XCircle, 
  Calendar,
  AlertCircle,
  Phone,
  FileText
} from 'lucide-react';

interface AppointmentQueueViewProps {
  onOpenBookAppointmentModal: () => void;
}

export const AppointmentQueueView: React.FC<AppointmentQueueViewProps> = ({ 
  onOpenBookAppointmentModal 
}) => {
  const { 
    appointments, 
    patients, 
    settings,
    updateAppointmentStatus, 
    startConsultation 
  } = useClinic();

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter appointments
  const dateAppointments = appointments.filter(a => a.date === selectedDate);
  const filteredAppointments = dateAppointments.filter(apt => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSearch = apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          apt.patientPhone.includes(searchQuery) ||
                          String(apt.tokenNumber).includes(searchQuery);
    return matchesStatus && matchesSearch;
  }).sort((a, b) => a.tokenNumber - b.tokenNumber);

  const waitingCount = dateAppointments.filter(a => a.status === 'waiting').length;
  const inConsultCount = dateAppointments.filter(a => a.status === 'in-consultation').length;
  const completedCount = dateAppointments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Date Navigation - Aesthetic Light Palette */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Daily OPD Patient Queue</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Live token queue management for {settings.doctorName}'s consultation desk.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-stone-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs font-medium text-stone-800 bg-transparent focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={onOpenBookAppointmentModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-950 bg-indigo-100/90 hover:bg-indigo-200/90 border border-indigo-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-700" />
              <span>Issue New Token</span>
            </button>
          </div>
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Tokens ({dateAppointments.length})
            </button>
            <button
              onClick={() => setStatusFilter('waiting')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'waiting' ? 'bg-white text-amber-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Waiting ({waitingCount})
            </button>
            <button
              onClick={() => setStatusFilter('in-consultation')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'in-consultation' ? 'bg-white text-indigo-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              In Room ({inConsultCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search token or patient..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Queue Tokens Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-stone-200/80 p-12 text-center">
            <Clock className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-stone-700">No Queue Tokens Found</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              There are no patient tokens registered for {selectedDate} matching this filter.
            </p>
            <button
              onClick={onOpenBookAppointmentModal}
              className="mt-4 px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Issue Token for {selectedDate} →
            </button>
          </div>
        ) : (
          filteredAppointments.map(apt => {
            const patient = patients.find(p => p.id === apt.patientId);

            return (
              <div
                key={apt.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs relative flex flex-col justify-between ${
                  apt.status === 'in-consultation'
                    ? 'border-indigo-400 ring-2 ring-indigo-500/10'
                    : apt.status === 'waiting'
                    ? 'border-amber-200/80'
                    : 'border-stone-200/80'
                }`}
              >
                <div>
                  {/* Token & Status Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono font-bold text-sm flex items-center justify-center shadow-2xs">
                        #{apt.tokenNumber}
                      </span>
                      <div>
                        <span className="text-[11px] font-mono text-stone-400 block">{apt.timeSlot}</span>
                        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">{apt.type}</span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      apt.status === 'in-consultation' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/60' :
                      apt.status === 'waiting' ? 'bg-amber-50 text-amber-800 border border-amber-200/60' :
                      apt.status === 'completed' ? 'bg-stone-100 text-stone-700' :
                      'bg-rose-50 text-rose-800 border border-rose-200/60'
                    }`}>
                      {apt.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Patient Name & Details */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      {apt.patientName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-mono text-[11px]">{patient?.patientId || 'Walk-in'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {apt.patientPhone}
                      </span>
                    </div>

                    {patient?.constitutionalType && (
                      <p className="text-[11px] text-stone-700 bg-stone-50 px-2 py-1 rounded-md mt-2 border border-stone-100">
                        Constitutional: <span className="font-medium text-stone-800">{patient.constitutionalType}</span>
                      </p>
                    )}

                    {apt.chiefComplaint && (
                      <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 mt-2.5">
                        <span className="font-semibold text-stone-700 block text-[11px]">Chief Complaint:</span>
                        {apt.chiefComplaint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Advancement / Action Buttons */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {apt.status === 'waiting' && (
                    <>
                      <button
                        onClick={() => {
                          if (patient) startConsultation(patient, apt);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-bold text-indigo-950 bg-indigo-100/90 hover:bg-indigo-200/90 border border-indigo-200/90 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Call to Room</span>
                      </button>

                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                        title="Cancel Token"
                        className="p-2 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {apt.status === 'in-consultation' && (
                    <>
                      <button
                        onClick={() => {
                          if (patient) startConsultation(patient, apt);
                        }}
                        className="flex-1 py-2 px-3 text-xs font-bold text-purple-950 bg-purple-100/90 hover:bg-purple-200/90 border border-purple-200/90 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-purple-700" />
                        <span>Resume EMR</span>
                      </button>

                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                        title="Mark Consultation Complete"
                        className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </button>
                    </>
                  )}

                  {apt.status === 'completed' && (
                    <div className="w-full flex items-center justify-between text-xs text-stone-500 py-1">
                      <span className="flex items-center gap-1 text-stone-700 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Consultation Done
                      </span>
                      {patient && (
                        <button
                          onClick={() => startConsultation(patient, apt)}
                          className="text-[11px] text-stone-800 hover:underline cursor-pointer font-semibold"
                        >
                          View EMR Record
                        </button>
                      )}
                    </div>
                  )}

                  {apt.status === 'cancelled' && (
                    <div className="w-full flex items-center justify-between text-xs text-rose-500 py-1">
                      <span>Token Cancelled</span>
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'waiting')}
                        className="text-[11px] text-stone-600 hover:underline cursor-pointer font-semibold"
                      >
                        Reactivate
                      </button>
                    </div>
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

import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Users, 
  Clock, 
  Calendar,
  TrendingUp, 
  Package, 
  Stethoscope, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  FileText, 
  CheckCircle, 
  CreditCard,
  IndianRupee,
  Activity,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewPatientModal: () => void;
  onOpenBookAppointmentModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenNewPatientModal, 
  onOpenBookAppointmentModal 
}) => {
  const { 
    patients, 
    appointments, 
    consultations, 
    prescriptions, 
    inventory, 
    invoices, 
    settings, 
    setActiveTab, 
    startConsultation, 
    openPrescriptionPrint,
    adjustInventory,
    role
  } = useClinic();

  const today = new Date().toISOString().split('T')[0];

  // Daily statistics
  const todayAppointments = appointments.filter(a => a.date === today);
  const waitingAppointments = todayAppointments.filter(a => a.status === 'waiting');
  const inConsultAppointments = todayAppointments.filter(a => a.status === 'in-consultation');
  const completedAppointments = todayAppointments.filter(a => a.status === 'completed');

  // Revenue statistics (INR)
  const todayInvoices = invoices.filter(i => i.date === today);
  const todayRevenueINR = todayInvoices.reduce((sum, i) => sum + i.paidINR, 0);
  const totalRevenueINR = invoices.reduce((sum, i) => sum + i.paidINR, 0);
  const pendingReceivablesINR = invoices
    .filter(i => i.paymentStatus !== 'paid')
    .reduce((sum, i) => sum + (i.grandTotalINR - i.paidINR), 0);

  // Inventory statistics
  const lowStockItems = inventory.filter(i => i.currentStock <= i.minReorderLevel);
  const cosmeticCount = inventory.filter(i => i.category === 'cosmetic' || i.category === 'skincare').length;

  // Quick next patient in waiting queue
  const nextWaitingPatient = waitingAppointments.sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

  const handleStartNextConsultation = () => {
    if (nextWaitingPatient) {
      const patient = patients.find(p => p.id === nextWaitingPatient.patientId);
      if (patient) {
        startConsultation(patient, nextWaitingPatient);
      }
    }
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Quick Actions Strip - Aesthetic Light Design */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Welcome, {settings.doctorName || 'Doctor'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {settings.clinicName} · {todayAppointments.length} appointments scheduled today.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenBookAppointmentModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100/90 hover:bg-indigo-200/90 border border-indigo-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-indigo-700" />
              <span>Appointment</span>
            </button>

            <button
              onClick={onOpenNewPatientModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Register Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards - Soft Aesthetic Palette */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Waiting Queue Metric */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Waiting Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
              {waitingAppointments.length}
            </span>
            <span className="text-xs text-stone-400">waiting</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {inConsultAppointments.length > 0 ? (
              <span className="text-indigo-700 font-medium">{inConsultAppointments.length} in consultation room</span>
            ) : (
              <span>Consultation desk free</span>
            )}
          </div>
        </div>

        {/* Today's Collection Metric */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Today's Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center font-bold font-mono">
              {currency}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs text-stone-400">{currency}</span>
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
              {todayRevenueINR.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            <span>{todayInvoices.length} transactions recorded today</span>
          </div>
        </div>

        {/* Registered Patients Metric */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Active Patients</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
              {patients.length}
            </span>
            <span className="text-xs text-stone-400">profiles</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            <span>Synchronized cloud history</span>
          </div>
        </div>

        {/* Dispensary & Cosmetics Metric */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Stock & Cosmetics</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              lowStockItems.length > 0 ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-stone-100 text-stone-700 border-stone-200/60'
            }`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
              {inventory.length}
            </span>
            <span className="text-xs text-stone-400">items</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
            <span>{cosmeticCount} cosmetic lines</span>
            {lowStockItems.length > 0 && (
              <span className="text-rose-600 font-semibold">{lowStockItems.length} low</span>
            )}
          </div>
        </div>

      </div>

      {/* Main Grid: Waiting Queue Spotlight + Low Stock / Recent Rx */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Doctor Queue Priority & Today's Patients */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Next Patient Call Spotlight Banner - Pastel Lavender Card */}
          {nextWaitingPatient ? (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50/60 rounded-2xl p-5 border border-indigo-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span>NEXT PATIENT IN QUEUE · TOKEN #{nextWaitingPatient.tokenNumber}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">
                    {nextWaitingPatient.patientName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Phone: {nextWaitingPatient.patientPhone} · Slot: {nextWaitingPatient.timeSlot}
                  </p>
                  {nextWaitingPatient.chiefComplaint && (
                    <p className="text-xs text-slate-700 mt-2 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                      Chief Complaint: {nextWaitingPatient.chiefComplaint}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleStartNextConsultation}
                  className="px-4 py-2.5 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-indigo-700" />
                  <span>Call to Consultation Room</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 text-center shadow-xs">
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-stone-600" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800">Waiting Room Clear</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                All scheduled patients have completed consultation or been attended to.
              </p>
            </div>
          )}

          {/* Today's Full Queue Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Today's Appointment Tokens</h3>
                <p className="text-xs text-stone-500">Live OPD status tracker for {settings.doctorName || 'Doctor'}</p>
              </div>
              <button
                onClick={() => setActiveTab('queue')}
                className="text-xs font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Queue Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  No appointments booked for today yet. Use the "Appointment" button above.
                </div>
              ) : (
                todayAppointments.slice(0, 5).map(apt => {
                  const patient = patients.find(p => p.id === apt.patientId);
                  return (
                    <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-stone-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center font-mono font-bold text-xs text-stone-700 shrink-0">
                          #{apt.tokenNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{apt.patientName}</span>
                            <span className="text-[11px] font-mono text-stone-400">{patient?.patientId}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 line-clamp-1">
                            {apt.chiefComplaint || 'Routine homoeopathic checkup'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                          apt.status === 'in-consultation' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/60' :
                          apt.status === 'waiting' ? 'bg-amber-50 text-amber-800 border border-amber-200/60' :
                          apt.status === 'completed' ? 'bg-stone-100 text-stone-700' : 'bg-stone-50 text-stone-400'
                        }`}>
                          {apt.status.replace('-', ' ')}
                        </span>

                        {apt.status === 'waiting' && (
                          <button
                            onClick={() => {
                              if (patient) startConsultation(patient, apt);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                          >
                            Consult
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Consultations Section */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Recent Clinical Consultations</h3>
                <p className="text-xs text-stone-500">Latest homoeopathic case records and prescriptions</p>
              </div>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className="text-xs font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <span>All Prescriptions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {consultations.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  No consultations recorded yet. Start consultation from the queue.
                </div>
              ) : (
                consultations.slice(0, 4).map(con => {
                  const patient = patients.find(p => p.id === con.patientId);
                  const rx = prescriptions.find(r => r.consultationId === con.id);
                  return (
                    <div key={con.id} className="p-4 hover:bg-stone-50/70 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{patient?.name}</span>
                            <span className="text-[11px] font-mono text-stone-400">{patient?.patientId}</span>
                            <span className="text-[11px] text-stone-400">· {new Date(con.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-medium text-stone-800 mt-1">
                            Dx: {con.diagnosis}
                          </p>
                          {rx && (
                            <p className="text-[11px] text-stone-600 mt-1 font-mono">
                              Rx: {rx.remedies.map(r => `${r.name} ${r.potency}`).join(', ')}
                            </p>
                          )}
                        </div>

                        {rx && (
                          <button
                            onClick={() => openPrescriptionPrint(rx)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-stone-500" />
                            <span>Print Rx</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Dispensary Low Stock & Clinic Shortcuts */}
        <div className="space-y-6">
          
          {/* Dispensary Low Stock Alert Card */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-900">Dispensary Reorder Alerts</h3>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-medium text-stone-700 hover:text-stone-900 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="p-4 space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400">
                  <CheckCircle className="w-5 h-5 text-stone-600 mx-auto mb-1" />
                  All remedies and cosmetic products have healthy stock levels.
                </div>
              ) : (
                lowStockItems.map(item => (
                  <div key={item.id} className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{item.name} {item.potency}</p>
                      <p className="text-[11px] text-amber-800">
                        Stock: <span className="font-mono font-bold">{item.currentStock}</span> {item.unit} (Min: {item.minReorderLevel})
                      </p>
                    </div>

                    <button
                      onClick={() => adjustInventory(item.id, 5)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg shadow-2xs cursor-pointer"
                      title="Quick restock +5 units"
                    >
                      +5 Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Practice Defaults Summary */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-1">Practice Information</h3>
            <p className="text-xs text-stone-500 mb-3">
              Reg: <span className="font-mono font-medium text-stone-700">{settings.registrationNumber}</span> · {settings.qualification}
            </p>
            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span>Standard Consultation Fee:</span>
                <span className="font-mono font-bold text-stone-900">{currency}{settings.consultationFeeINR}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span>Follow-up Review Fee:</span>
                <span className="font-mono font-bold text-stone-900">{currency}{settings.followupFeeINR}</span>
              </div>
              {role === 'receptionist' ? (
                <>
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span>Today's Collections:</span>
                    <span className="font-mono font-bold text-stone-900">{currency}{todayRevenueINR.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-stone-500">
                    <span>Lifetime Financials:</span>
                    <span className="text-[11px] font-medium text-stone-500 italic">Doctor & Admin Only</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span>Total Lifetime Revenue:</span>
                    <span className="font-mono font-bold text-stone-900">{currency}{totalRevenueINR.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Pending Receivables:</span>
                    <span className="font-mono font-bold text-amber-800">{currency}{pendingReceivablesINR.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100">
              <button
                onClick={() => setActiveTab('billing')}
                className="w-full py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer text-center"
              >
                {role === 'receptionist' ? "Open Today's Billing Counter →" : "Open Billing & Revenue Intelligence →"}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

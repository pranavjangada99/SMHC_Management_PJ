import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Patient, 
  ChiefComplaintItem, 
  ThermalReaction, 
  MiasmType, 
  PrescribedRemedy 
} from '../../types/clinic';
import { 
  Stethoscope, 
  User, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';

const COMMON_HOMOEOPATHIC_REMEDIES = [
  'Arnica Montana',
  'Nux Vomica',
  'Lycopodium Clavatum',
  'Pulsatilla Nigricans',
  'Belladonna',
  'Rhus Toxicodendron',
  'Bryonia Alba',
  'Arsenicum Album',
  'Thuja Occidentalis',
  'Calcarea Carbonica',
  'Sulphur',
  'Silicea',
  'Hepar Sulphuris',
  'Phosphorus',
  'Ignatia Amara',
  'Natrum Muriaticum',
  'Sepia Succus',
  'Gelsemium Sempervirens',
  'Aconitum Napellus',
  'Carbo Vegetabilis',
  'Five Phos 6X',
  'Crataegus Oxyacantha Q',
  'Berberis Vulgaris Q'
];

export const ConsultationWorkspace: React.FC = () => {
  const { 
    patients, 
    selectedPatientForConsultation, 
    selectedAppointmentForConsultation, 
    clearConsultationTarget, 
    saveConsultationAndPrescription, 
    openPrescriptionPrint, 
    settings,
    inventory 
  } = useClinic();

  // Active Patient
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    selectedPatientForConsultation?.id || (patients[0]?.id || '')
  );

  const activePatient = patients.find(p => p.id === selectedPatientId) || selectedPatientForConsultation || patients[0];

  // Vitals
  const [bp, setBp] = useState('120/80');
  const [pulse, setPulse] = useState<number>(72);
  const [temperature, setTemperature] = useState<number>(98.4);
  const [spo2, setSpo2] = useState<number>(99);
  const [weight, setWeight] = useState<number>(68);

  // Chief Complaints List
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaintItem[]>([
    {
      complaint: selectedAppointmentForConsultation?.chiefComplaint || 'Chronic digestive discomfort and acid reflux',
      duration: '4 weeks',
      sensation: 'Burning behind sternum, worse evening',
      severity: 'moderate'
    }
  ]);

  // Modalities (Homoeopathic keynotes)
  const [aggravation, setAggravation] = useState('Late night meals, fatty spicy food, mental stress');
  const [amelioration, setAmelioration] = useState('Warm water, rest, morning walk');

  // Mind and Constitutional Generals
  const [thermalReaction, setThermalReaction] = useState<ThermalReaction>('chilly');
  const [temperament, setTemperament] = useState('Irritable, fastidious, driven, anxious about health');
  const [thirst, setThirst] = useState('Thirsty for warm sips');
  const [appetite, setAppetite] = useState('Good appetite, craving for sweets and warm tea');
  const [sleep, setSleep] = useState('Wakes early around 3 AM, unrefreshing sleep');

  // Clinical Examination & Diagnosis
  const [miasm, setMiasm] = useState<MiasmType>('psora');
  const [physicalObservations, setPhysicalObservations] = useState('Tongue lightly coated white. Abdominal palpation shows mild epigastric tenderness. Heart sounds S1 S2 normal.');
  const [diagnosis, setDiagnosis] = useState('Dyspepsia / Acid Peptic Disorder with Constitutional Stress');
  const [followUpAdvice, setFollowUpAdvice] = useState('Avoid stimulants after 7 PM. Maintain 3-hour gap between dinner and sleep. Take remedies on clean tongue.');
  const [nextVisitDate, setNextVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Prescribed Remedies
  const [remedies, setRemedies] = useState<PrescribedRemedy[]>([
    {
      id: 'rem-init-1',
      name: 'Nux Vomica',
      potency: '200C',
      form: 'pills',
      dosage: '4 pills (Globules #30)',
      frequency: 'At bedtime only (HS)',
      durationDays: 14,
      instructions: 'Dissolve on clean dry tongue at night. Do not touch with hands.'
    }
  ]);

  // General Homoeopathic Advice from dynamic clinic settings
  const [generalAdvice, setGeneralAdvice] = useState(
    settings.defaultPrescriptionAdvice || 
    'Avoid raw onions, garlic, camphor, menthol, and strong coffee within 30 minutes before and after taking medicines. Keep phials away from direct sunlight, pungent spices, and electronic magnetic devices.'
  );

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Sync when selectedPatientForConsultation changes
  useEffect(() => {
    if (selectedPatientForConsultation) {
      setSelectedPatientId(selectedPatientForConsultation.id);
      if (selectedAppointmentForConsultation?.chiefComplaint) {
        setChiefComplaints([
          {
            complaint: selectedAppointmentForConsultation.chiefComplaint,
            duration: 'Recent onset',
            severity: 'moderate',
          }
        ]);
      }
    }
  }, [selectedPatientForConsultation, selectedAppointmentForConsultation]);

  // Chief complaint helpers
  const handleAddComplaint = () => {
    setChiefComplaints(prev => [
      ...prev,
      { complaint: '', duration: '', sensation: '', severity: 'moderate' }
    ]);
  };

  const handleUpdateComplaint = (index: number, field: keyof ChiefComplaintItem, value: any) => {
    setChiefComplaints(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveComplaint = (index: number) => {
    setChiefComplaints(prev => prev.filter((_, i) => i !== index));
  };

  // Remedy builders
  const handleAddRemedy = () => {
    setRemedies(prev => [
      ...prev,
      {
        id: `rem-${Date.now()}`,
        name: 'Arnica Montana',
        potency: '200C',
        form: 'pills',
        dosage: '4 pills',
        frequency: 'Morning & Night (BD)',
        durationDays: 14,
        instructions: 'Dissolve on clean tongue'
      }
    ]);
  };

  const handleUpdateRemedy = (index: number, field: keyof PrescribedRemedy, value: any) => {
    setRemedies(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveRemedy = (index: number) => {
    setRemedies(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSaveConsultation = (andPrint: boolean = false) => {
    if (!activePatient) return;

    const consultationData = {
      patientId: activePatient.id,
      appointmentId: selectedAppointmentForConsultation?.id,
      date: new Date().toISOString(),
      doctorName: settings.doctorName,
      vitals: {
        bp,
        pulse: Number(pulse),
        temperature: Number(temperature),
        spo2: Number(spo2),
        weight: Number(weight),
      },
      chiefComplaints: chiefComplaints.filter(c => c.complaint.trim() !== ''),
      modalities: {
        aggravation,
        amelioration,
      },
      mindGenerals: {
        thermalReaction,
        temperament,
        thirst,
        appetite,
        sleep,
      },
      physicalObservations,
      miasm,
      diagnosis,
      followUpAdvice,
      nextVisitDate,
    };

    const prescriptionData = remedies.length > 0 ? {
      consultationId: '', // populated in context
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      date: new Date().toISOString().split('T')[0],
      remedies,
      generalAdvice,
      doctorSignature: `${settings.doctorName}, ${settings.qualification}`,
      doctorRegistrationNumber: settings.registrationNumber,
    } : undefined;

    const result = saveConsultationAndPrescription(consultationData, prescriptionData);

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);

    if (andPrint && result.prescription) {
      openPrescriptionPrint(result.prescription);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Patient Selector & Clinical Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-stone-200">
                <Stethoscope className="w-3.5 h-3.5 text-stone-700" />
                <span>Doctor Consultation & Case Record</span>
              </span>
              {selectedAppointmentForConsultation && (
                <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Token #{selectedAppointmentForConsultation.tokenNumber} Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Homoeopathic Clinical Consultation
            </h2>
            <p className="text-xs text-slate-500">
              Examining Doctor: <span className="font-semibold text-slate-700">{settings.doctorName}</span> · {settings.qualification}
            </p>
          </div>

          {/* Patient Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="w-72">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Select Patient Record:
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientId}) · {p.age}y
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Patient Identity Strip */}
        {activePatient && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono font-bold flex items-center justify-center text-sm shadow-2xs">
                {activePatient.patientId.slice(-4)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{activePatient.name}</span>
                  <span className="text-xs font-mono text-stone-800 bg-stone-100 px-1.5 py-0.2 rounded font-semibold border border-stone-200">
                    {activePatient.patientId}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="capitalize">{activePatient.gender}</span>
                  <span>·</span>
                  <span>{activePatient.age} years</span>
                  <span>·</span>
                  <span>Phone: {activePatient.phone}</span>
                  <span>·</span>
                  <span>Visits: {activePatient.totalVisits || 0}</span>
                </div>
              </div>
            </div>

            {activePatient.constitutionalType && (
              <div className="text-xs bg-stone-100 text-stone-900 border border-stone-200 px-3 py-1.5 rounded-lg max-w-xs">
                <span className="font-semibold block text-[11px] text-stone-700">Constitutional Affinity:</span>
                {activePatient.constitutionalType}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Consultation and digital prescription saved successfully! Stock inventory and reception invoice updated.</span>
        </div>
      )}

      {/* Main 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Vitals, Chief Complaints, Modalities, Mind/Constitutional Generals */}
        <div className="space-y-6">
          
          {/* Section 1: Clinical Vitals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Patient Vitals Examination</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={bp}
                  onChange={e => setBp(e.target.value)}
                  placeholder="120/80"
                  className="w-full text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={e => setPulse(Number(e.target.value))}
                  placeholder="72"
                  className="w-full text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  placeholder="98.4"
                  className="w-full text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={e => setSpo2(Number(e.target.value))}
                  placeholder="99"
                  className="w-full text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  placeholder="70"
                  className="w-full text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Chief Complaints & Symptoms */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Chief Complaints & Sensations</span>
              </h3>
              <button
                type="button"
                onClick={handleAddComplaint}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Complaint</span>
              </button>
            </div>

            <div className="space-y-3">
              {chiefComplaints.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Chief Complaint Description (e.g. Acid eructations, knee stiffness)"
                      value={item.complaint}
                      onChange={e => handleUpdateComplaint(idx, 'complaint', e.target.value)}
                      className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <select
                      value={item.severity}
                      onChange={e => handleUpdateComplaint(idx, 'severity', e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                    {chiefComplaints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveComplaint(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 3 weeks, 6 months)"
                      value={item.duration}
                      onChange={e => handleUpdateComplaint(idx, 'duration', e.target.value)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Sensation (e.g. Burning, Stitching, Throbbing)"
                      value={item.sensation || ''}
                      onChange={e => handleUpdateComplaint(idx, 'sensation', e.target.value)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Modalities & Keynotes (Aggravations & Ameliorations) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Thermometer className="w-4 h-4 text-amber-500" />
              <span>Homoeopathic Modalities (Keynotes)</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                  Aggravations (&lt;) — What worsens symptoms:
                </label>
                <input
                  type="text"
                  value={aggravation}
                  onChange={e => setAggravation(e.target.value)}
                  placeholder="e.g. Cold air, Late night, Motion, Damp weather, After eating"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-teal-800 mb-1">
                  Ameliorations (&gt;) — What relieves symptoms:
                </label>
                <input
                  type="text"
                  value={amelioration}
                  onChange={e => setAmelioration(e.target.value)}
                  placeholder="e.g. Warm drinks, Rest, Open air, Pressure, Hot application"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Mind, Thermal Reaction & Constitutional Generals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Mind & Constitutional Generals</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Thermal Reaction</label>
                  <select
                    value={thermalReaction}
                    onChange={e => setThermalReaction(e.target.value as ThermalReaction)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <option value="chilly">Chilly Patient (Sensitive to cold)</option>
                    <option value="hot">Hot Patient (Cannot tolerate heat)</option>
                    <option value="ambithermal">Ambithermal (Neutral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Miasmatic Assessment</label>
                  <select
                    value={miasm}
                    onChange={e => setMiasm(e.target.value as MiasmType)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 capitalize"
                  >
                    <option value="psora">Psora</option>
                    <option value="sycosis">Sycosis</option>
                    <option value="syphilis">Syphilis</option>
                    <option value="tubercular">Tubercular</option>
                    <option value="mixed">Mixed Miasm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Mind & Mental State</label>
                <input
                  type="text"
                  value={temperament}
                  onChange={e => setTemperament(e.target.value)}
                  placeholder="e.g. Mild, Weeping easily, Irritable, Fastidious, Anxious"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Thirst</label>
                  <input
                    type="text"
                    value={thirst}
                    onChange={e => setThirst(e.target.value)}
                    placeholder="Thirsty / Thirstless"
                    className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Appetite / Cravings</label>
                  <input
                    type="text"
                    value={appetite}
                    onChange={e => setAppetite(e.target.value)}
                    placeholder="Craves sweets, warm food"
                    className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Sleep Quality</label>
                  <input
                    type="text"
                    value={sleep}
                    onChange={e => setSleep(e.target.value)}
                    placeholder="Wakes 3 AM, unrefreshing"
                    className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Clinical Diagnosis, Prescription Builder, and Submit Buttons */}
        <div className="space-y-6">
          
          {/* Section 5: Diagnosis & Clinical Examination */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-stone-700" />
              <span>Clinical Observations & Diagnosis</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinical Diagnosis:</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. GERD with constitutional dysthymia / Allergic Rhinitis"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Physical Examination Notes:</label>
                <textarea
                  rows={2}
                  value={physicalObservations}
                  onChange={e => setPhysicalObservations(e.target.value)}
                  placeholder="Tongue, pulse characteristics, systemic findings..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Digital Prescription Builder (Rx) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold text-stone-900">℞</span>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Prescribe Homoeopathic Remedies & Skincare
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddRemedy}
                className="text-xs text-stone-700 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Prescribed Remedies List */}
            <div className="space-y-3">
              {remedies.map((remedy, idx) => (
                <div key={remedy.id} className="p-3.5 bg-stone-50/80 border border-stone-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 font-mono">Item #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRemedy(idx)}
                      className="text-stone-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Remedy Name with autocomplete list */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-medium text-stone-500 mb-0.5">Remedy / Cosmetic Product Name</label>
                      <input
                        type="text"
                        list="remedies-list"
                        value={remedy.name}
                        onChange={e => handleUpdateRemedy(idx, 'name', e.target.value)}
                        placeholder="Remedy or cosmetic product (e.g. Arnica, Berberis Cream)"
                        className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                      />
                      <datalist id="remedies-list">
                        {[
                          ...Array.from(new Set([
                            ...COMMON_HOMOEOPATHIC_REMEDIES,
                            ...(settings.customRemedies || []),
                            ...inventory.map(i => i.name)
                          ]))
                        ].map(r => (
                          <option key={r} value={r} />
                        ))}
                      </datalist>
                    </div>

                    {/* Potency */}
                    <div>
                      <label className="block text-[10px] font-medium text-stone-500 mb-0.5">Potency / Grade</label>
                      <select
                        value={remedy.potency}
                        onChange={e => handleUpdateRemedy(idx, 'potency', e.target.value)}
                        className="w-full text-xs font-mono font-bold px-2 py-1.5 rounded-lg border border-stone-200 bg-white"
                      >
                        <option value="30C">30C</option>
                        <option value="200C">200C</option>
                        <option value="1M">1M</option>
                        <option value="10M">10M</option>
                        <option value="Q">Q (Mother Tincture)</option>
                        <option value="6X">6X (Biochemic)</option>
                        <option value="12X">12X</option>
                        <option value="LM 0/1">LM 0/1</option>
                        <option value="Topical Application">Topical Application</option>
                        <option value="Herbal Formulation">Herbal Formulation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-stone-500 mb-0.5">Form</label>
                      <select
                        value={remedy.form}
                        onChange={e => handleUpdateRemedy(idx, 'form', e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-white capitalize"
                      >
                        <option value="pills">Pills (Globules)</option>
                        <option value="dilution">Dilution (Drops)</option>
                        <option value="biochemic">Biochemic Tabs</option>
                        <option value="mother-tincture">Mother Tincture</option>
                        <option value="trituration">Trituration / Cream</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-stone-500 mb-0.5">Dosage</label>
                      <input
                        type="text"
                        value={remedy.dosage}
                        onChange={e => handleUpdateRemedy(idx, 'dosage', e.target.value)}
                        placeholder="4 pills / 10 drops / Pea-size"
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-stone-500 mb-0.5">Frequency</label>
                      <select
                        value={remedy.frequency}
                        onChange={e => handleUpdateRemedy(idx, 'frequency', e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-white"
                      >
                        {(settings.customDosageFrequencies || [
                          'Morning & Night (BD)',
                          'Thrice Daily (TDS)',
                          'Once Daily (OD)',
                          'At Bedtime (HS)',
                          'Weekly Single Dose',
                          'As Needed (SOS)',
                          'Every 2 Hours (Acute State)'
                        ]).map(freq => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-stone-500 mb-0.5">Days</label>
                      <input
                        type="number"
                        value={remedy.durationDays}
                        onChange={e => handleUpdateRemedy(idx, 'durationDays', Number(e.target.value))}
                        className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-stone-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. Apply gently on face, dissolve on clean tongue)"
                      value={remedy.instructions || ''}
                      onChange={e => handleUpdateRemedy(idx, 'instructions', e.target.value)}
                      className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-stone-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* General Advice and Follow-up Date */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Dietary Rules, Precautions & Product Advice:
                </label>
                <textarea
                  rows={2}
                  value={generalAdvice}
                  onChange={e => setGeneralAdvice(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">Follow-up Advice:</label>
                  <input
                    type="text"
                    value={followUpAdvice}
                    onChange={e => setFollowUpAdvice(e.target.value)}
                    placeholder="e.g. Review after 14 days course"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">Recommended Next Visit:</label>
                  <input
                    type="date"
                    value={nextVisitDate}
                    onChange={e => setNextVisitDate(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Submission Buttons */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleSaveConsultation(false)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Save Case & Send to Billing</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveConsultation(true)}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-700" />
              <span>Save & Print Official Prescription</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

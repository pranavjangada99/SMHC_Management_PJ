import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Users, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_CONSTITUTIONAL_REMEDIES = [
  'Nux Vomica (Sedentary, high-stress, fastidious, irritable, dyspeptic)',
  'Pulsatilla (Mild, gentle, weeping easily, thirstless, prefers open air)',
  'Lycopodium (Right-sided symptoms, bloating, craving warm food/sweets)',
  'Sulphur (Warm patient, skin eruptions, midnight ravenous hunger, intellectual)',
  'Calcarea Carbonica (Chilly, head sweat, slow metabolism, obstinate, fears)',
  'Silicea (Chilly, deficient stamina, prone to suppurations, unyielding grit)',
  'Natrum Muriaticum (Reserved, grief, headache from sun, craves salt)',
  'Phosphorus (Tall, artistic, craves cold drinks, hemorrhagic tendency)',
  'Arsenicum Album (Restless, midnight anxiety, chilly, burning pains better heat)',
  'Rhus Toxicodendron (Restless, stiffness better continuous motion)',
  'Bryonia Alba (Irritable, dry mucus membranes, worse slightest motion)',
  'Sepia Succus (Indifference to loved ones, bearing down sensations, chilly)'
];

export const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose }) => {
  const { addPatient, scheduleAppointment } = useClinic();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [constitutionalType, setConstitutionalType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [autoIssueTokenToday, setAutoIssueTokenToday] = useState(true);
  const [chiefComplaint, setChiefComplaint] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newPatient = addPatient({
      name: name.trim(),
      gender,
      age: Number(age) || 30,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      bloodGroup: bloodGroup || undefined,
      constitutionalType: constitutionalType || undefined,
      allergies: allergies || undefined,
      medicalHistory: medicalHistory || undefined,
    });

    if (autoIssueTokenToday) {
      scheduleAppointment({
        patientId: newPatient.id,
        patientName: newPatient.name,
        patientPhone: newPatient.phone,
        date: new Date().toISOString().split('T')[0],
        timeSlot: 'Immediate OPD',
        status: 'waiting',
        type: 'new',
        chiefComplaint: chiefComplaint.trim() || 'Initial registration consultation',
      });
    }

    // Reset and close
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setConstitutionalType('');
    setAllergies('');
    setMedicalHistory('');
    setChiefComplaint('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 my-6 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-850">Register New Patient</h3>
              <p className="text-xs text-slate-500">Auto-generates unique ID and homoeopathic profile</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Demographic Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Patel"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 capitalize"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="125"
                  placeholder="e.g. 34"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full text-xs font-mono px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91 98..."
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
            <input
              type="text"
              placeholder="Flat/House, Locality, City"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          {/* Homoeopathic Constitutional Affinity */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-stone-700" />
              <span>Homoeopathic Constitutional Affinity (Optional):</span>
            </label>
            <input
              type="text"
              list="constitutional-suggestions"
              placeholder="e.g. Nux Vomica, Pulsatilla, Lycopodium, Calcarea Carb..."
              value={constitutionalType}
              onChange={e => setConstitutionalType(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-stone-200 bg-white"
            />
            <datalist id="constitutional-suggestions">
              {COMMON_CONSTITUTIONAL_REMEDIES.map(rem => (
                <option key={rem} value={rem} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies</label>
              <input
                type="text"
                placeholder="e.g. Dust, Pollen, Penicillin, Foods..."
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Background / History</label>
              <input
                type="text"
                placeholder="e.g. Hypertension, Diabetes, Thyroid..."
                value={medicalHistory}
                onChange={e => setMedicalHistory(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          {/* Auto Issue OPD Token Checkbox */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoIssueTokenToday}
                onChange={e => setAutoIssueTokenToday(e.target.checked)}
                className="rounded text-stone-900 focus:ring-stone-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-800">
                Issue OPD Waiting Room Token for Today immediately
              </span>
            </label>

            {autoIssueTokenToday && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Primary complaint for today's OPD token..."
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>

          {/* Submit Actions */}
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
              Register Patient
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

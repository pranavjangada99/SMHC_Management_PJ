import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ConsultationTypeConfig } from '../../types/clinic';
import { 
  Building2, 
  Stethoscope, 
  CreditCard, 
  FileText, 
  KeyRound, 
  QrCode, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Tag, 
  RefreshCw,
  Palette
} from 'lucide-react';

export const PracticeSettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    updateStaffPins, 
    addCustomCategory, 
    removeCustomCategory, 
    addCustomRemedy, 
    removeCustomRemedy, 
    addCustomDosageFrequency, 
    removeCustomDosageFrequency, 
    addConsultationType, 
    removeConsultationType, 
    updateConsultationType,
    triggerCloudSync 
  } = useClinic();

  // Active sub-tab
  const [activeSection, setActiveSection] = useState<'profile' | 'pricing' | 'clinical' | 'categories' | 'staff' | 'upi' | 'theme'>('profile');

  // Clinic profile form
  const [clinicName, setClinicName] = useState(settings.clinicName || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [doctorName, setDoctorName] = useState(settings.doctorName || '');
  const [qualification, setQualification] = useState(settings.qualification || '');
  const [registrationNumber, setRegistrationNumber] = useState(settings.registrationNumber || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [address, setAddress] = useState(settings.address || '');
  const [opdTimings, setOpdTimings] = useState(settings.opdTimings || 'Mon-Sat: 10:00 AM - 1:30 PM & 5:30 PM - 9:00 PM | Sun: Closed');

  // Pricing & Currency
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [consultationFeeINR, setConsultationFeeINR] = useState(settings.consultationFeeINR || 500);
  const [followupFeeINR, setFollowupFeeINR] = useState(settings.followupFeeINR || 300);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || '');
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || 'INV-2026-');

  // New Consultation Type inputs
  const [newConsultTypeName, setNewConsultTypeName] = useState('');
  const [newConsultTypeFee, setNewConsultTypeFee] = useState<number>(400);

  // New Category input
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Clinical & Rx Defaults
  const [defaultPrescriptionAdvice, setDefaultPrescriptionAdvice] = useState(
    settings.defaultPrescriptionAdvice || 
    'Avoid raw onions, garlic, camphor, menthol, and strong coffee within 30 minutes before and after taking medicines. Keep phials away from direct sunlight, pungent spices, and electronic magnetic devices.'
  );
  const [newDosageFreqInput, setNewDosageFreqInput] = useState('');
  const [newRemedyInput, setNewRemedyInput] = useState('');

  // Staff PINs
  const [adminPin, setAdminPin] = useState(settings.staffPins?.admin || '1111');
  const [doctorPin, setDoctorPin] = useState(settings.staffPins?.doctor || '2222');
  const [receptionistPin, setReceptionistPin] = useState(settings.staffPins?.receptionist || '3333');

  // UPI settings
  const [upiId, setUpiId] = useState(settings.upiId || 'homoeocare@icici');
  const [upiPayeeName, setUpiPayeeName] = useState(settings.upiPayeeName || settings.clinicName || 'HomoeoCare Health Centre');

  // Theme
  const [themeMode, setThemeMode] = useState(settings.themeMode || 'aesthetic-slate');

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const showSaveSuccess = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clinicName: clinicName.trim(),
      tagline: tagline.trim(),
      doctorName: doctorName.trim(),
      qualification: qualification.trim(),
      registrationNumber: registrationNumber.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      opdTimings: opdTimings.trim(),
    });
    showSaveSuccess('Clinic Profile updated successfully!');
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      currencySymbol: currencySymbol.trim(),
      consultationFeeINR: Number(consultationFeeINR),
      followupFeeINR: Number(followupFeeINR),
      gstNumber: gstNumber.trim(),
      invoicePrefix: invoicePrefix.trim(),
    });
    showSaveSuccess('Pricing & Currency settings updated!');
  };

  const handleAddConsultType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsultTypeName.trim()) return;
    addConsultationType({
      id: `ct-${Date.now()}`,
      name: newConsultTypeName.trim(),
      feeINR: Number(newConsultTypeFee) || 0,
    });
    setNewConsultTypeName('');
    setNewConsultTypeFee(400);
    showSaveSuccess('New consultation type added!');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    addCustomCategory(newCategoryInput.trim());
    setNewCategoryInput('');
    showSaveSuccess('Category added!');
  };

  const handleSaveClinicalAdvice = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      defaultPrescriptionAdvice: defaultPrescriptionAdvice.trim(),
    });
    showSaveSuccess('Prescription advice template updated!');
  };

  const handleAddDosageFreq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDosageFreqInput.trim()) return;
    addCustomDosageFrequency(newDosageFreqInput.trim());
    setNewDosageFreqInput('');
    showSaveSuccess('Dosage frequency added!');
  };

  const handleAddRemedy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemedyInput.trim()) return;
    addCustomRemedy(newRemedyInput.trim());
    setNewRemedyInput('');
    showSaveSuccess('Remedy added to dispensary library!');
  };

  const handleSavePins = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.length !== 4 || doctorPin.length !== 4 || receptionistPin.length !== 4) {
      alert('All PINs must be exactly 4 digits');
      return;
    }
    updateStaffPins({
      admin: adminPin,
      doctor: doctorPin,
      receptionist: receptionistPin,
    });
    showSaveSuccess('Staff PIN security codes updated!');
  };

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      upiId: upiId.trim(),
      upiPayeeName: upiPayeeName.trim(),
    });
    showSaveSuccess('UPI Payment receiver updated!');
  };

  const handleSelectTheme = (mode: 'aesthetic-slate' | 'warm-stone' | 'soft-mineral' | 'rose-wellness') => {
    setThemeMode(mode);
    updateSettings({ themeMode: mode });
    showSaveSuccess(`Aesthetic style updated to ${mode}!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md">
                100% Dynamic Configuration
              </span>
              <span className="text-xs text-stone-400 font-mono">
                No hardcoded values
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-1">
              Practice Settings & Customization
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Customize clinic credentials, consultation fees, cosmetic categories, prescription advice, and security PINs.
            </p>
          </div>

          {savedNotice && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-medium shadow-2xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-1.5 border-b border-stone-100 pb-3">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200/90 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Clinic & Doctor Profile</span>
          </button>

          <button
            onClick={() => setActiveSection('pricing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeSection === 'pricing'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200/90 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Fees & Consultations</span>
          </button>

          <button
            onClick={() => setActiveSection('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeSection === 'categories'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200/90 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Cosmetic & Product Categories</span>
          </button>

          <button
            onClick={() => setActiveSection('clinical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeSection === 'clinical'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200/90 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prescription Defaults</span>
          </button>

          <button
            onClick={() => setActiveSection('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeSection === 'staff'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200/90 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Staff PIN Codes</span>
          </button>

          <button
            onClick={() => setActiveSection('upi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeSection === 'upi'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200/90 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>UPI & Payments</span>
          </button>

          <button
            onClick={() => setActiveSection('theme')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              activeSection === 'theme'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200/90 font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Aesthetic Styling</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CLINIC PROFILE */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-stone-900">Clinic & Doctor Identity</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              These details appear on your printed prescriptions, official invoice receipts, and top app header.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. HomoeoCare Health Centre"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. Classical Homoeopathy & Aesthetic Skin Care"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. Dr. Pranav J."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Doctor Qualifications</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. B.H.M.S, M.D. (Hom.)"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Medical Council Reg. No.</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. HOM-MAH-84920"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Clinic Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. +91 98201 45890"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Clinic Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. contact@clinic.in"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">OPD Hours / Timings</label>
                <input
                  type="text"
                  value={opdTimings}
                  onChange={e => setOpdTimings(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. Mon-Sat: 10:00 AM - 1:30 PM & 5:30 PM - 9:00 PM"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Physical Clinic Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                placeholder="Full clinic address with pincode..."
                required
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-indigo-700" />
                <span>Save Clinic Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 2: FEES & CONSULTATION TYPES */}
      {activeSection === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1">General Pricing & Defaults</h3>
            <p className="text-xs text-stone-500 mb-4">
              Base consultation and follow-up rates used when creating appointments or invoices.
            </p>

            <form onSubmit={handleSavePricing} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="₹"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Default Initial OPD Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    value={consultationFeeINR}
                    onChange={e => setConsultationFeeINR(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Default Follow-up Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    value={followupFeeINR}
                    onChange={e => setFollowupFeeINR(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={e => setInvoicePrefix(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="INV-2026-"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">GST / Tax Registration (Optional)</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. 27AABCH1234F1Z8"
                />
              </div>

              <div className="sm:col-span-2 flex items-end justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Update Pricing Defaults</span>
                </button>
              </div>
            </form>
          </div>

          {/* Dynamic Consultation Types List */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1">Custom Consultation Service Types</h3>
            <p className="text-xs text-stone-500 mb-4">
              Add specialized consultation offerings such as Chronic Case Taking, Cosmetic Skin Consultation, or Acute Visits.
            </p>

            {/* Add Type Form */}
            <form onSubmit={handleAddConsultType} className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <input
                type="text"
                value={newConsultTypeName}
                onChange={e => setNewConsultTypeName(e.target.value)}
                placeholder="Consultation Name (e.g. Skin & Cosmetic Assessment)"
                className="flex-1 min-w-[200px] px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                required
              />

              <div className="relative w-32">
                <span className="absolute left-3 top-2 text-xs text-stone-400 font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  value={newConsultTypeFee}
                  onChange={e => setNewConsultTypeFee(Number(e.target.value))}
                  placeholder="Fee"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-900 bg-stone-200 hover:bg-stone-300 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Type</span>
              </button>
            </form>

            {/* List */}
            <div className="divide-y divide-stone-100">
              {(settings.consultationTypes || []).map(t => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-stone-800">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-md">
                      {currencySymbol}{t.feeINR}
                    </span>
                    <button
                      onClick={() => removeConsultationType(t.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CATEGORIES MANAGER (Medicines & Cosmetics) */}
      {activeSection === 'categories' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-stone-900">Custom Product & Dispensary Categories</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage category tags for homoeopathic preparations, cosmetic products, skincare lotions, and clinic sundries.
            </p>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md mb-6">
            <input
              type="text"
              value={newCategoryInput}
              onChange={e => setNewCategoryInput(e.target.value)}
              placeholder="e.g. Cosmetic Creams, Hair Vitalizers, Serums..."
              className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
              required
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-700" />
              <span>Add Category</span>
            </button>
          </form>

          {/* Categories Pill Grid */}
          <div className="flex flex-wrap gap-2">
            {(settings.customCategories || []).map(cat => (
              <div 
                key={cat} 
                className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 border border-stone-200/80 rounded-xl text-xs font-medium text-stone-800 shadow-2xs"
              >
                <span>{cat}</span>
                <button
                  onClick={() => removeCustomCategory(cat)}
                  className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: CLINICAL & PRESCRIPTION DEFAULTS */}
      {activeSection === 'clinical' && (
        <div className="space-y-6">
          
          {/* Advice Template */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1">Default Prescription Advice & Diet Regimen</h3>
            <p className="text-xs text-stone-500 mb-4">
              This text is automatically loaded when writing prescriptions, and printed at the bottom of patient Rx sheets.
            </p>

            <form onSubmit={handleSaveClinicalAdvice} className="space-y-3">
              <textarea
                value={defaultPrescriptionAdvice}
                onChange={e => setDefaultPrescriptionAdvice(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden leading-relaxed"
                placeholder="Prescription precautions and dietary advice..."
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Save Default Advice</span>
                </button>
              </div>
            </form>
          </div>

          {/* Custom Dosage Frequencies */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1">Dosage Frequency Options</h3>
            <p className="text-xs text-stone-500 mb-4">
              Presets available in the prescription builder dropdown.
            </p>

            <form onSubmit={handleAddDosageFreq} className="flex gap-2 max-w-md mb-4">
              <input
                type="text"
                value={newDosageFreqInput}
                onChange={e => setNewDosageFreqInput(e.target.value)}
                placeholder="e.g. Twice a week (Sunday & Thursday)"
                className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                required
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-900 bg-stone-200 hover:bg-stone-300 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {(settings.customDosageFrequencies || []).map(freq => (
                <div 
                  key={freq} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700"
                >
                  <span>{freq}</span>
                  <button
                    onClick={() => removeCustomDosageFrequency(freq)}
                    className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Remedies Library */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 mb-1">Common Remedies Library</h3>
            <p className="text-xs text-stone-500 mb-4">
              Remedies populated in quick suggestion lists during clinical case taking.
            </p>

            <form onSubmit={handleAddRemedy} className="flex gap-2 max-w-md mb-4">
              <input
                type="text"
                value={newRemedyInput}
                onChange={e => setNewRemedyInput(e.target.value)}
                placeholder="e.g. Thuja Occidentalis"
                className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                required
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-900 bg-stone-200 hover:bg-stone-300 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Remedy</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
              {(settings.customRemedies || []).map(rem => (
                <div 
                  key={rem} 
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700"
                >
                  <span>{rem}</span>
                  <button
                    onClick={() => removeCustomRemedy(rem)}
                    className="text-stone-300 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 5: STAFF PINS & ROLES */}
      {activeSection === 'staff' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-stone-900">Role Authentication & Staff PINs</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Staff switch between Admin, Doctor, and Receptionist using these 4-digit security PINs.
            </p>
          </div>

          <form onSubmit={handleSavePins} className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <div>
                <span className="text-xs font-bold text-stone-900 block">Admin PIN</span>
                <span className="text-[11px] text-stone-500">Full practice management, backups & settings</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={adminPin}
                onChange={e => setAdminPin(e.target.value.replace(/\D/g, ''))}
                className="w-24 text-center font-mono tracking-widest text-base font-bold px-2 py-1.5 bg-white border border-stone-300 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <div>
                <span className="text-xs font-bold text-stone-900 block">Doctor PIN</span>
                <span className="text-[11px] text-stone-500">EMR clinical consultations, prescription generator</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={doctorPin}
                onChange={e => setDoctorPin(e.target.value.replace(/\D/g, ''))}
                className="w-24 text-center font-mono tracking-widest text-base font-bold px-2 py-1.5 bg-white border border-stone-300 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <div>
                <span className="text-xs font-bold text-stone-900 block">Receptionist PIN</span>
                <span className="text-[11px] text-stone-500">Patient registration, token queue, OTC sales & billing</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={receptionistPin}
                onChange={e => setReceptionistPin(e.target.value.replace(/\D/g, ''))}
                className="w-24 text-center font-mono tracking-widest text-base font-bold px-2 py-1.5 bg-white border border-stone-300 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-indigo-700" />
                <span>Save Staff PIN Codes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 6: UPI & DIGITAL PAYMENTS */}
      {activeSection === 'upi' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-stone-900">UPI QR & Payment Receiver</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Patients can scan and pay at your clinic counter using Google Pay, PhonePe, Paytm, or BHIM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleSaveUpi} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">UPI VPA ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. pranav.homoeo@okaxis"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Payee Display Name</label>
                <input
                  type="text"
                  value={upiPayeeName}
                  onChange={e => setUpiPayeeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 focus:outline-hidden"
                  placeholder="e.g. Dr. Pranav Homoeo Clinic"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Update UPI Receiver</span>
                </button>
              </div>
            </form>

            {/* Live QR Preview */}
            <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border border-stone-200/80 text-center">
              <span className="text-xs font-semibold text-stone-600 mb-3">Live Counter QR Preview</span>
              <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs border border-stone-200 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiPayeeName)}&cu=INR`)}`}
                  alt="UPI QR Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-mono text-xs font-bold text-stone-900 mt-3">{upiId}</span>
              <span className="text-[11px] text-stone-500">{upiPayeeName}</span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: AESTHETIC STYLING THEME */}
      {activeSection === 'theme' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-stone-900">Aesthetic Palette & Atmosphere</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Select an aesthetic color tone designed with soothing, light shades to elevate the clinic atmosphere.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Option 1: Aesthetic Slate & Mist */}
            <button
              onClick={() => handleSelectTheme('aesthetic-slate')}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                themeMode === 'aesthetic-slate'
                  ? 'border-indigo-400 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-400/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center text-xs font-bold">
                  S
                </div>
                {themeMode === 'aesthetic-slate' && (
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-800">Serene Slate & Mist</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Contemporary Scandinavian clinic aesthetic. Cool mist neutrals, gentle typography, and calm composure.
              </p>
            </button>

            {/* Option 2: Warm Stone & Linen */}
            <button
              onClick={() => handleSelectTheme('warm-stone')}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                themeMode === 'warm-stone'
                  ? 'border-amber-400 bg-amber-50/40 shadow-xs ring-2 ring-amber-400/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center text-xs font-bold">
                  W
                </div>
                {themeMode === 'warm-stone' && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-amber-900">Warm Stone & Cashmere</h4>
              <p className="text-[11px] text-stone-500 mt-1">
                Earthy linen warmth, organic comfort, and soothing natural remedies ambiance.
              </p>
            </button>

            {/* Option 3: Rose Quartz & Wellness */}
            <button
              onClick={() => handleSelectTheme('rose-wellness')}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                themeMode === 'rose-wellness'
                  ? 'border-purple-400 bg-purple-50/40 shadow-xs ring-2 ring-purple-400/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center text-xs font-bold">
                  R
                </div>
                {themeMode === 'rose-wellness' && (
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-purple-900">Rose Quartz & Wellness</h4>
              <p className="text-[11px] text-stone-500 mt-1">
                Gentle blush lavender accents tailored for cosmetic skincare OPD.
              </p>
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

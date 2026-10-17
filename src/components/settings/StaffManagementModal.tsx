import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { 
  ShieldCheck, 
  Stethoscope, 
  Receipt, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  Copy,
  Check
} from 'lucide-react';

export interface StaffManagementModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialRole?: UserRole;
  initialAdding?: boolean;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({ 
  isOpen: propIsOpen, 
  onClose: propOnClose,
  initialRole: propInitialRole,
  initialAdding: propInitialAdding
}) => {
  const { 
    role, 
    staffUsers, 
    createStaffUser, 
    deleteStaffUser, 
    loadStaffUsers,
    isStaffModalOpen: contextIsOpen,
    closeStaffModal: contextOnClose,
    staffModalInitialRole: contextInitialRole,
    staffModalInitialAdding: contextInitialAdding
  } = useClinic();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const handleClose = propOnClose || contextOnClose;
  const initialRole = propInitialRole || contextInitialRole || 'receptionist';
  const initialAdding = propInitialAdding !== undefined ? propInitialAdding : contextInitialAdding;

  type TabMode = 'directory' | 'add-receptionist' | 'add-doctor';
  
  const [activeTab, setActiveTab] = useState<TabMode>('directory');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: string; name: string } | null>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setConfirmDeleteUser(null);
      if (initialAdding) {
        if (initialRole === 'doctor' && role === 'admin') {
          setActiveTab('add-doctor');
          setTitle('Associate Homoeopathic Physician');
        } else {
          setActiveTab('add-receptionist');
          setTitle('Front Desk Coordinator');
        }
      } else {
        setActiveTab('directory');
      }
      setName('');
      setEmail('');
      setPhone('');
      setPin('');
      setShowPin(false);
    }
  }, [isModalOpen, initialAdding, initialRole, role]);

  const handleTabSwitch = (tab: TabMode) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    setConfirmDeleteUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setPin('');
    setShowPin(false);
    if (tab === 'add-receptionist') {
      setTitle('Front Desk Coordinator');
    } else if (tab === 'add-doctor') {
      setTitle('Associate Homoeopathic Physician');
    }
  };

  const handleGeneratePin = () => {
    const adjectives = ['Care', 'Safe', 'Health', 'Prime', 'Vital'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const roleTag = activeTab === 'add-doctor' ? 'Doc' : 'Front';
    const num = Math.floor(10 + Math.random() * 90);
    const generated = `${adj}${roleTag}#${num}`;
    setPin(generated);
    setShowPin(true);
  };

  const handleCopyPin = (staffId: string, staffPin: string) => {
    navigator.clipboard.writeText(staffPin);
    setCopiedId(staffId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePinReveal = (staffId: string) => {
    setRevealedPins(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter the full name.');
      return;
    }

    if (!pin || pin.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    const targetRole: UserRole = activeTab === 'add-doctor' ? 'doctor' : 'receptionist';

    // Role hierarchy authorization check
    if (targetRole === 'doctor' && role !== 'admin') {
      setErrorMsg('Only Clinic Admin can create Doctor accounts.');
      return;
    }

    if (role === 'doctor' && targetRole !== 'receptionist') {
      setErrorMsg('Doctors can only create Receptionist accounts.');
      return;
    }

    if (role === 'receptionist') {
      setErrorMsg('Receptionists do not have permission to manage staff.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStaffUser({
        role: targetRole,
        name: name.trim(),
        title: title.trim() || (targetRole === 'doctor' ? 'Associate Homoeopathic Physician' : 'Front Desk Coordinator'),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        pin: pin.trim(),
      });

      setSuccessMsg(`Created ${name.trim()} (${targetRole === 'doctor' ? 'Doctor' : 'Receptionist'}) with password: ${pin.trim()}`);
      setName('');
      setTitle('');
      setEmail('');
      setPhone('');
      setPin('');
      await loadStaffUsers();
      
      // Auto-switch back to directory after brief moment
      setTimeout(() => {
        setActiveTab('directory');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create staff account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteUser) return;
    const { id, name: staffName } = confirmDeleteUser;
    
    if (id === 'staff-admin') {
      setErrorMsg('Primary Clinic Administrator account cannot be deleted.');
      setConfirmDeleteUser(null);
      return;
    }

    try {
      await deleteStaffUser(id);
      setSuccessMsg(`Removed ${staffName} successfully.`);
      setConfirmDeleteUser(null);
      await loadStaffUsers();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to remove staff account.');
      setConfirmDeleteUser(null);
    }
  };

  if (!isModalOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex min-h-full items-start justify-center pt-4 sm:pt-10 pb-10"
      onClick={handleClose}
    >
      <div 
        className="relative bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full flex flex-col my-auto max-h-[calc(100vh-3.5rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 sm:px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-2xs shrink-0 ${
              activeTab === 'add-receptionist'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : activeTab === 'add-doctor'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-stone-100 border-stone-200 text-stone-700'
            }`}>
              {activeTab === 'add-receptionist' ? (
                <Receipt className="w-5 h-5" />
              ) : activeTab === 'add-doctor' ? (
                <Stethoscope className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-stone-900 truncate">
                {activeTab === 'add-receptionist'
                  ? 'Add Receptionist Account'
                  : activeTab === 'add-doctor'
                  ? 'Add Doctor Account'
                  : 'Staff Accounts & Directory'}
              </h3>
              <p className="text-xs text-stone-500 truncate">
                {activeTab === 'add-receptionist'
                  ? 'Front Desk Registration & Billing Coordinator'
                  : activeTab === 'add-doctor'
                  ? 'Clinical Practitioner & Homoeopath'
                  : `Signed in as ${role}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -mr-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-white border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleTabSwitch('directory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'directory'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Directory</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'directory' ? 'bg-stone-700 text-stone-200' : 'bg-stone-200 text-stone-700'
              }`}>
                {staffUsers.length}
              </span>
            </button>

            {(role === 'admin' || role === 'doctor') && (
              <button
                type="button"
                onClick={() => handleTabSwitch('add-receptionist')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'add-receptionist'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Receptionist</span>
              </button>
            )}

            {role === 'admin' && (
              <button
                type="button"
                onClick={() => handleTabSwitch('add-doctor')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'add-doctor'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Doctor</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Delete Confirmation Prompt */}
          {confirmDeleteUser && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Remove Staff Account?</p>
                  <p className="text-rose-700 mt-0.5">
                    Are you sure you want to remove <span className="font-semibold">{confirmDeleteUser.name}</span>? This account will no longer be able to log in.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleDeleteConfirmed}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs cursor-pointer"
                    >
                      Yes, Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUser(null)}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ADD RECEPTIONIST / DOCTOR FORM */}
          {(activeTab === 'add-receptionist' || activeTab === 'add-doctor') && (
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={activeTab === 'add-doctor' ? 'e.g. Dr. Sunil Kumar' : 'e.g. Anjali Verma'}
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-xl focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden transition-all text-stone-900"
                      required
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Role Title / Designation
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={activeTab === 'add-doctor' ? 'e.g. B.H.M.S, M.D. (Hom.)' : 'e.g. Front Desk Coordinator'}
                      className="w-full px-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-xl focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden transition-all text-stone-900"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-xl focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden transition-all text-stone-900"
                      />
                    </div>
                  </div>

                  {/* Contact Email */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="staff@homoeocareclinic.in"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-stone-50/60 border border-stone-300 rounded-xl focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden transition-all text-stone-900"
                      />
                    </div>
                  </div>

                  {/* Station Password */}
                  <div className="sm:col-span-2 bg-stone-50 rounded-2xl border border-stone-200/90 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-stone-600" />
                        <span>Station Password *</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePin}
                        className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-300 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Generate Password</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        placeholder="Enter station password"
                        className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden text-stone-900 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title={showPin ? 'Hide password' : 'Show password'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5">
                      Used by this staff member to sign in to their clinical station.
                    </p>
                  </div>
                </div>

                {/* Role Permissions Scope Notice */}
                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-blue-950 space-y-1">
                  <span className="font-bold text-blue-900 block">
                    {activeTab === 'add-doctor' ? 'Doctor Access Scope:' : 'Receptionist Access Scope:'}
                  </span>
                  {activeTab === 'add-doctor' ? (
                    <p className="text-blue-900/80">
                      Access to consultations, patient clinical records, prescriptions, repertory, and queue management.
                    </p>
                  ) : (
                    <p className="text-blue-900/80">
                      Access to patient registration, token queue, prescription lookup, and today's billing counter. Clinical notes and revenue intelligence remain restricted.
                    </p>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('directory')}
                    className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || pin.trim().length < 4 || !name.trim()}
                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-xs cursor-pointer ${
                      activeTab === 'add-doctor'
                        ? 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                        : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Save {activeTab === 'add-doctor' ? 'Doctor' : 'Receptionist'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STAFF USERS DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Registered Clinic Accounts
                  </h4>
                  <p className="text-xs text-stone-500">
                    Active team members authorized for station sign-in
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {staffUsers.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    No staff accounts configured.
                  </div>
                ) : (
                  staffUsers.map(u => {
                    const isDoc = u.role === 'doctor';
                    const isAdmin = u.role === 'admin';
                    const isRec = u.role === 'receptionist';
                    const isPinRevealed = !!revealedPins[u.id];

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                              isAdmin
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : isDoc
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}
                          >
                            {isAdmin ? (
                              <ShieldCheck className="w-5 h-5" />
                            ) : isDoc ? (
                              <Stethoscope className="w-5 h-5" />
                            ) : (
                              <Receipt className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-stone-900 truncate">
                                {u.name}
                              </h4>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  isAdmin
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : isDoc
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                    : 'bg-blue-50 text-blue-800 border-blue-200'
                                }`}
                              >
                                {u.role === 'admin' ? 'Administrator' : u.role}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-stone-500 mt-1">
                              {u.title && <span>{u.title}</span>}
                              {u.phone && (
                                <span className="flex items-center gap-1 text-stone-400">
                                  <Phone className="w-3 h-3" />
                                  {u.phone}
                                </span>
                              )}
                              {u.email && (
                                <span className="flex items-center gap-1 text-stone-400">
                                  <Mail className="w-3 h-3" />
                                  {u.email}
                                </span>
                              )}
                              {u.createdByRole && u.role !== 'admin' && (
                                <span className="text-[11px] text-stone-400 italic">
                                  Added by {u.createdByRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side controls: PIN view & Delete */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 w-full sm:w-auto justify-between sm:justify-end">
                          {/* Password viewer for authorized users */}
                          {(role === 'admin' || (role === 'doctor' && isRec)) && u.pin && u.pin !== '••••••••' ? (
                            <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1.5 rounded-xl border border-stone-200">
                              <span className="text-[11px] font-semibold text-stone-500 mr-0.5">Password:</span>
                              <span className="text-xs font-mono font-medium text-stone-900">
                                {isPinRevealed ? u.pin : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePinReveal(u.id)}
                                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer ml-1"
                                title={isPinRevealed ? 'Hide Password' : 'Show Password'}
                              >
                                {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPin(u.id, u.pin!)}
                                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1.5 rounded-xl border border-stone-200">
                              Password: ••••••••
                            </span>
                          )}

                          {/* Delete action */}
                          {((role === 'admin' && !isAdmin) || (role === 'doctor' && isRec)) && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUser({ id: u.id, name: u.name })}
                              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title={`Remove ${u.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span className="hidden sm:inline">Administrator manages Doctors & Receptionists • Doctor manages Receptionists</span>
          <span className="sm:hidden font-medium">Access Management</span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

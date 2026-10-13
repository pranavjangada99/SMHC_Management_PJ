import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole, StaffUser } from '../../types/clinic';
import { 
  ShieldCheck, 
  Stethoscope, 
  Receipt, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Phone, 
  Mail, 
  KeyRound, 
  Lock,
  UserPlus
} from 'lucide-react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({ isOpen, onClose }) => {
  const { 
    role, 
    staffUsers, 
    createStaffUser, 
    deleteStaffUser, 
    loadStaffUsers 
  } = useClinic();

  const [isAdding, setIsAdding] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole>(role === 'admin' ? 'doctor' : 'receptionist');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOpenAdd = (newRole: UserRole) => {
    // Role check: Only admin can create doctor
    if (newRole === 'doctor' && role !== 'admin') {
      setErrorMsg('Only Clinic Admin can create Doctor accounts.');
      return;
    }
    // Doctors can only add receptionists
    if (role === 'doctor' && newRole !== 'receptionist') {
      setErrorMsg('Doctors can only add Receptionist accounts.');
      return;
    }

    setTargetRole(newRole);
    setName('');
    setTitle(newRole === 'doctor' ? 'Associate Homoeopathic Physician' : 'Front Desk Coordinator');
    setEmail('');
    setPhone('');
    setPin(newRole === 'doctor' ? '2222' : '3333');
    setErrorMsg('');
    setSuccessMsg('');
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Staff member name is required.');
      return;
    }

    if (!pin || pin.length < 4) {
      setErrorMsg('A 4-digit security PIN is required.');
      return;
    }

    // Role-based hierarchy enforcement check
    if (targetRole === 'doctor' && role !== 'admin') {
      setErrorMsg('Only Clinic Admin can create new Doctor accounts.');
      return;
    }

    if (role === 'doctor' && targetRole !== 'receptionist') {
      setErrorMsg('Doctors can only add Receptionist users.');
      return;
    }

    if (role === 'receptionist') {
      setErrorMsg('Receptionists do not have permission to add staff users.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStaffUser({
        role: targetRole,
        name: name.trim(),
        title: title.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        pin: pin.trim(),
      });

      setSuccessMsg(`Successfully added ${targetRole.toUpperCase()}: ${name.trim()} (PIN: ${pin.trim()})`);
      setIsAdding(false);
      setName('');
      setTitle('');
      setEmail('');
      setPhone('');
      setPin('');
      await loadStaffUsers();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create staff user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    if (staffId === 'staff-admin') {
      alert('Primary Clinic Administrator cannot be removed.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove staff user: ${staffName}?`)) {
      try {
        await deleteStaffUser(staffId);
        setSuccessMsg(`Staff member ${staffName} removed successfully.`);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to remove staff member.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Staff Management & Role Access</h3>
              <p className="text-xs text-slate-500">
                Logged in as <span className="font-semibold text-slate-700 capitalize">{role}</span> • Cloudflare D1 User Hierarchy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Header: Add Buttons */}
          {!isAdding && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
              <div>
                <p className="text-xs font-semibold text-slate-700">Staff Accounts Directory</p>
                <p className="text-[11px] text-slate-400">
                  {role === 'admin' 
                    ? 'Admin can create Doctor and Receptionist accounts.' 
                    : 'Doctor can add Receptionist accounts.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Admin Only: Create Doctor Button */}
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleOpenAdd('doctor')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+ Add New Doctor</span>
                  </button>
                )}

                {/* Admin & Doctor: Create Receptionist Button */}
                {(role === 'admin' || role === 'doctor') && (
                  <button
                    type="button"
                    onClick={() => handleOpenAdd('receptionist')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ Add Receptionist</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ADD NEW USER FORM */}
          {isAdding && (
            <div className="bg-stone-50/80 rounded-2xl border border-stone-200 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg text-white ${targetRole === 'doctor' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                    {targetRole === 'doctor' ? <Stethoscope className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Provision New {targetRole === 'doctor' ? 'Doctor' : 'Receptionist'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {targetRole === 'doctor' 
                        ? 'Admin-Authorized Clinical Physician' 
                        : 'Front Desk & Patient Coordinator'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={targetRole === 'doctor' ? 'e.g. Dr. Sarah Khan' : 'e.g. Anjali Verma'}
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Professional Title / Qualification
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={targetRole === 'doctor' ? 'e.g. B.H.M.S, M.D. (Hom.)' : 'e.g. Front Desk Executive'}
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. doctor@homoeocareclinic.in"
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4-Digit Security PIN (Login Code) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder={targetRole === 'doctor' ? '2222' : '3333'}
                        className="w-32 px-3 py-2 text-sm font-mono tracking-widest font-bold bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:outline-hidden text-center"
                        required
                      />
                      <span className="text-[11px] text-slate-500">
                        Staff will use this PIN to log in to the workstation.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : `Create ${targetRole === 'doctor' ? 'Doctor' : 'Receptionist'} User`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STAFF USERS LIST */}
          <div className="space-y-2.5">
            {staffUsers.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                No staff users found.
              </div>
            ) : (
              staffUsers.map(u => {
                const isDoc = u.role === 'doctor';
                const isAdmin = u.role === 'admin';
                const isRec = u.role === 'receptionist';

                return (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isAdmin
                            ? 'bg-amber-100 text-amber-800'
                            : isDoc
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
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
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
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
                            {u.role}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                          {u.title && <span>{u.title}</span>}
                          {u.email && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </span>
                          )}
                          {u.phone && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Phone className="w-3 h-3" />
                              {u.phone}
                            </span>
                          )}
                          {u.createdByRole && (
                            <span className="text-[10px] text-slate-400 italic">
                              Added by {u.createdByRole}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* PIN Badge */}
                      <span className="text-xs font-mono font-bold bg-stone-100 text-stone-700 px-2 py-1 rounded-lg border border-stone-200/80">
                        PIN: {u.pin || '••••'}
                      </span>

                      {/* Delete button (Admin can delete non-admin; Doctor can delete receptionist) */}
                      {((role === 'admin' && !isAdmin) || (role === 'doctor' && isRec)) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove staff member"
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

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-slate-500">
          <span>Hierarchy Rule: Admin creates Doctors • Doctor creates Receptionists</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 font-semibold text-slate-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-100 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

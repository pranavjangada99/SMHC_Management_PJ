import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { 
  Building2, 
  ShieldCheck, 
  Stethoscope, 
  Receipt, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  UserPlus, 
  Sparkles,
  Delete,
  Fingerprint
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { 
    settings, 
    role, 
    staffProfiles, 
    staffUsers, 
    unlockWithPin 
  } = useClinic();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill or sync on role selection
  useEffect(() => {
    setPin('');
    setErrorMsg('');
    const matchingStaff = staffUsers.filter(u => u.role === selectedRole);
    if (matchingStaff.length > 0) {
      setSelectedStaffId(matchingStaff[0].id);
    } else {
      setSelectedStaffId(`staff-${selectedRole}`);
    }
  }, [selectedRole, staffUsers]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === 4) {
        attemptLogin(nextPin, selectedRole);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const attemptLogin = async (enteredPin: string, targetRole: UserRole) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const success = await unlockWithPin(enteredPin, targetRole);
      if (!success) {
        setErrorMsg('Invalid PIN. Please check your staff security code.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPin('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please verify credentials.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleToLogin: UserRole, pinToUse: string) => {
    setSelectedRole(roleToLogin);
    setPin(pinToUse);
    attemptLogin(pinToUse, roleToLogin);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleKeyPress(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter' && pin.length >= 4) {
      attemptLogin(pin, selectedRole);
    }
  };

  const currentRoleStaffList = staffUsers.filter(u => u.role === selectedRole);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-indigo-50/40 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="w-full max-w-xl">
        
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-3 border border-indigo-500/30">
            <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            {settings.clinicName || 'HomoeoCare Health Centre'}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 max-w-md mx-auto">
            Clinical Station & Practice Management System (Nayiva SMHC)
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold mt-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cloudflare D1 Relational Engine • Secure Station
          </div>
        </div>

        {/* Main Authentication Card */}
        <div 
          className={`bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200/90 overflow-hidden transition-all ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Top Banner: Select Station Role */}
          <div className="p-4 sm:p-6 bg-stone-50/80 border-b border-stone-200/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3 text-center sm:text-left">
              Step 1: Select Staff Role Station
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Admin Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'admin'
                    ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${selectedRole === 'admin' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    1111
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Administrator</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Full Clinic & Doctor Management</p>
                </div>
              </button>

              {/* Doctor Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'doctor'
                    ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-400/40 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${selectedRole === 'doctor' ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                    2222
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Doctor</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">EMR Rx & Receptionist Admin</p>
                </div>
              </button>

              {/* Receptionist Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('receptionist')}
                className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === 'receptionist'
                    ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${selectedRole === 'receptionist' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    3333
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Receptionist</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Queue, Patients & Billing</p>
                </div>
              </button>
            </div>

            {/* Custom staff selector if multiple users in this role */}
            {currentRoleStaffList.length > 1 && (
              <div className="mt-3 pt-3 border-t border-stone-200/60">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Select Specific {selectedRole === 'doctor' ? 'Doctor' : 'Staff Member'}:
                </label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-1.5 bg-white border border-stone-200 rounded-xl focus:border-indigo-400 focus:outline-hidden"
                >
                  {currentRoleStaffList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.title ? `(${u.title})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Lower Zone: 4-Digit Security PIN & Input Keypad */}
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Enter 4-Digit Security PIN for {selectedRole.toUpperCase()}</span>
              </div>

              {/* PIN Dots Display */}
              <div className="flex justify-center items-center gap-3 my-3">
                {[0, 1, 2, 3].map(idx => {
                  const isFilled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 sm:w-12 sm:h-14 rounded-2xl flex items-center justify-center text-xl font-bold font-mono transition-all border ${
                        isFilled
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-stone-50 text-stone-300 border-stone-200'
                      }`}
                    >
                      {isFilled ? '•' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 py-1.5 px-3 rounded-xl max-w-xs mx-auto animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad for fast touch or mouse entry */}
            <div className="max-w-xs mx-auto grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={isLoading}
                  className="h-11 sm:h-12 rounded-2xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-800 font-bold text-base sm:text-lg border border-stone-200/90 transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || pin.length === 0}
                className="h-11 sm:h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs border border-stone-200 transition-all flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={isLoading}
                className="h-11 sm:h-12 rounded-2xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-800 font-bold text-base sm:text-lg border border-stone-200/90 transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading || pin.length === 0}
                className="h-11 sm:h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs border border-stone-200 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Submit / Unlock Button */}
            <button
              type="button"
              onClick={() => attemptLogin(pin, selectedRole)}
              disabled={isLoading || pin.length < 4}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                pin.length >= 4 && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 active:scale-99'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock {selectedRole.toUpperCase()} Station</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Fast 1-Click Access for Testing */}
            <div className="mt-6 pt-5 border-t border-stone-200/70 text-center">
              <p className="text-[11px] font-semibold text-slate-500 mb-2.5">
                Quick 1-Click Verification Credentials:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', '1111')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin (1111)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('doctor', '2222')}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Doctor (2222)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('receptionist', '3333')}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>Receptionist (3333)</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>© 2026 {settings.clinicName || 'HomoeoCare Health Centre'} • Single-Clinic Station</p>
          <p className="text-[11px] text-slate-400/80 mt-0.5">Role-Based Access Control • Doctor & Staff Management</p>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { 
  ShieldCheck, 
  Stethoscope, 
  Receipt, 
  Lock, 
  Delete, 
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PinAuthModal: React.FC = () => {
  const { 
    isLocked, 
    role, 
    staffProfiles, 
    unlockWithPin, 
    settings 
  } = useClinic();

  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    setSelectedRole(role);
    setPin('');
    setErrorMsg('');
  }, [isLocked, role]);

  if (!isLocked) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      // Auto-submit if 4 digits entered
      if (nextPin.length === 4) {
        attemptUnlock(nextPin);
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

  const attemptUnlock = (enteredPin: string) => {
    const success = unlockWithPin(enteredPin, selectedRole);
    if (!success) {
      setErrorMsg('Incorrect PIN. Please re-enter.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleKeyPress(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter' && pin.length >= 4) {
      attemptUnlock(pin);
    }
  };

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case 'doctor':
        return <Stethoscope className="w-5 h-5 text-teal-600" />;
      case 'receptionist':
        return <Receipt className="w-5 h-5 text-blue-600" />;
      case 'admin':
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
    }
  };

  const getRoleHint = (r: UserRole) => {
    switch (r) {
      case 'doctor':
        return settings.staffPins?.doctor || '2222';
      case 'receptionist':
        return settings.staffPins?.receptionist || '3333';
      case 'admin':
        return settings.staffPins?.admin || '1111';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header Lock Icon */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 mb-3 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Staff Authentication</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your staff security PIN to unlock the clinical station.
          </p>
        </div>

        {/* Role Selector Badges */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {(['doctor', 'receptionist', 'admin'] as UserRole[]).map(r => {
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRole(r);
                  setPin('');
                  setErrorMsg('');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50/80 ring-2 ring-indigo-500/10 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
                }`}
              >
                <div className="mb-1.5">{getRoleIcon(r)}</div>
                <span className="text-xs font-semibold capitalize text-slate-800">{r}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PIN: {getRoleHint(r)}
                </span>
              </button>
            );
          })}
        </div>

        {/* PIN Indicators Display */}
        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map(index => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    isFilled
                      ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-xs'
                      : 'border-indigo-200 bg-indigo-50/50'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg ? (
            <p className="mt-3 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          ) : (
            <p className="mt-3 text-[11px] text-slate-400">
              Selected: <span className="font-semibold text-slate-700 capitalize">{selectedRole}</span> ({staffProfiles[selectedRole].name})
            </p>
          )}
        </div>

        {/* Touch/Click Keypad */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 hover:bg-stone-100 hover:border-stone-400 text-lg font-semibold text-slate-800 transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-500 transition-colors active:scale-95 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 hover:bg-stone-100 hover:border-stone-400 text-lg font-semibold text-slate-800 transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Assist */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Default Station PINs: <span className="font-mono text-slate-600">Doctor: 2222 · Reception: 3333 · Admin: 1111</span>
          </p>
          <button
            type="button"
            onClick={() => attemptUnlock(getRoleHint(selectedRole))}
            className="mt-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:underline cursor-pointer"
          >
            Instant Demo Unlock as {selectedRole.toUpperCase()} →
          </button>
        </div>

      </div>
    </div>
  );
};

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
  AlertCircle, 
  ArrowRight, 
  Delete,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { 
    settings, 
    staffProfiles, 
    staffUsers, 
    unlockWithPin 
  } = useClinic();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync staff user selection when role changes
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
    if (enteredPin.length < 4) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const success = await unlockWithPin(enteredPin, targetRole);
      if (!success) {
        setErrorMsg('Invalid access code.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPin('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
    } finally {
      setIsLoading(false);
    }
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

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return {
          title: 'Administrator',
          desc: 'Practice & System Control',
          icon: ShieldCheck,
          activeBg: 'bg-stone-900 text-white border-stone-900',
          inactiveBg: 'bg-stone-50/80 text-stone-700 border-stone-200 hover:bg-stone-100',
          iconBg: 'bg-stone-800 text-stone-200'
        };
      case 'doctor':
        return {
          title: 'Practitioner',
          desc: 'Clinical EMR & Prescriptions',
          icon: Stethoscope,
          activeBg: 'bg-teal-900 text-white border-teal-900',
          inactiveBg: 'bg-stone-50/80 text-stone-700 border-stone-200 hover:bg-stone-100',
          iconBg: 'bg-teal-800 text-teal-100'
        };
      case 'receptionist':
        return {
          title: 'Front Desk',
          desc: 'Queue & Billing Desk',
          icon: Receipt,
          activeBg: 'bg-slate-900 text-white border-slate-900',
          inactiveBg: 'bg-stone-50/80 text-stone-700 border-stone-200 hover:bg-stone-100',
          iconBg: 'bg-slate-800 text-slate-200'
        };
    }
  };

  return (
    <div 
      className="min-h-screen bg-stone-100/70 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans select-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="w-full max-w-lg">
        
        {/* Clinic Identity */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-stone-100 shadow-sm mb-3">
            <Building2 className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
            {settings.clinicName || 'Nayiva SMHC'}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Clinical Practice Station
          </p>
        </div>

        {/* Sign In Card */}
        <div 
          className={`bg-white rounded-3xl shadow-sm border border-stone-200/90 overflow-hidden transition-transform duration-200 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Role Segmented Selector */}
          <div className="p-4 sm:p-5 bg-stone-50/60 border-b border-stone-200/80">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 block mb-2.5">
              Select Station
            </label>

            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'doctor', 'receptionist'] as UserRole[]).map(r => {
                const config = getRoleBadge(r);
                const IconComponent = config.icon;
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
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
                      isSelected ? config.activeBg : config.inactiveBg
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-xl ${isSelected ? config.iconBg : 'bg-stone-200/70 text-stone-600'}`}>
                        <IconComponent className="w-4 h-4 stroke-[1.75]" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold leading-tight">{config.title}</h4>
                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'opacity-80' : 'text-stone-500'}`}>
                        {config.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Staff Selector if multiple accounts present */}
            {currentRoleStaffList.length > 1 && (
              <div className="mt-3 pt-3 border-t border-stone-200/60">
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  Practitioner Profile
                </label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-xl focus:border-stone-500 focus:outline-hidden"
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

          {/* Passcode Entry Zone */}
          <div className="p-6 sm:p-7">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                <span>Enter 4-Digit Passcode</span>
              </div>

              {/* Masked PIN Indicator */}
              <div className="flex items-center justify-center gap-3 my-3">
                {[0, 1, 2, 3].map(idx => {
                  const isFilled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold font-mono transition-all border ${
                        isFilled
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-stone-50 text-transparent border-stone-200'
                      }`}
                    >
                      {isFilled ? (showPin ? pin[idx] : '•') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Show/Hide Toggle & Status */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPin ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 py-1.5 px-3 rounded-xl max-w-xs mx-auto mt-3">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="max-w-xs mx-auto grid grid-cols-3 gap-2 sm:gap-2.5 mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={isLoading}
                  className="h-11 rounded-2xl bg-stone-50/80 hover:bg-stone-100 active:bg-stone-200 text-stone-800 font-semibold text-base border border-stone-200/80 transition-colors flex items-center justify-center cursor-pointer"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || pin.length === 0}
                className="h-11 rounded-2xl bg-stone-100/80 hover:bg-stone-200/80 text-stone-600 font-medium text-xs border border-stone-200/80 transition-colors flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={isLoading}
                className="h-11 rounded-2xl bg-stone-50/80 hover:bg-stone-100 active:bg-stone-200 text-stone-800 font-semibold text-base border border-stone-200/80 transition-colors flex items-center justify-center cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading || pin.length === 0}
                className="h-11 rounded-2xl bg-stone-100/80 hover:bg-stone-200/80 text-stone-600 font-medium text-xs border border-stone-200/80 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Delete"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Submit Action */}
            <button
              type="button"
              onClick={() => attemptLogin(pin, selectedRole)}
              disabled={isLoading || pin.length < 4}
              className={`w-full py-3 px-4 rounded-2xl font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pin.length >= 4 && !isLoading
                  ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200/60'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} {settings.clinicName || 'Nayiva SMHC'}</p>
        </div>

      </div>
    </div>
  );
};

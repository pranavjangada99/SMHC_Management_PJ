import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { 
  Building2, 
  ShieldCheck, 
  Stethoscope, 
  Receipt, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff,
  UserCheck
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { 
    settings, 
    staffUsers, 
    unlockWithPin 
  } = useClinic();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Sync staff selection when role changes
  useEffect(() => {
    setPassword('');
    setErrorMsg('');
    const matchingStaff = staffUsers.filter(u => u.role === selectedRole);
    if (matchingStaff.length > 0) {
      setSelectedStaffId(matchingStaff[0].id);
    } else {
      setSelectedStaffId(`staff-${selectedRole}`);
    }
    // Focus password input
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  }, [selectedRole, staffUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const success = await unlockWithPin(password.trim(), selectedRole);
      if (!success) {
        setErrorMsg('Invalid password.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPassword('');
        passwordInputRef.current?.focus();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword('');
      passwordInputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoleStaffList = staffUsers.filter(u => u.role === selectedRole);
  const hasAccountsForStation = selectedRole === 'admin' || currentRoleStaffList.length > 0;

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return {
          title: 'Administrator',
          desc: 'Practice & System Control',
          icon: ShieldCheck,
          activeBg: 'bg-stone-900 text-white border-stone-900 shadow-sm',
          inactiveBg: 'bg-stone-50/80 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300',
          iconBg: 'bg-stone-800 text-stone-200'
        };
      case 'doctor':
        return {
          title: 'Practitioner',
          desc: 'Clinical EMR & Prescriptions',
          icon: Stethoscope,
          activeBg: 'bg-teal-900 text-white border-teal-900 shadow-sm',
          inactiveBg: 'bg-stone-50/80 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300',
          iconBg: 'bg-teal-800 text-teal-100'
        };
      case 'receptionist':
        return {
          title: 'Front Desk',
          desc: 'Queue & Billing Desk',
          icon: Receipt,
          activeBg: 'bg-slate-900 text-white border-slate-900 shadow-sm',
          inactiveBg: 'bg-stone-50/80 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300',
          iconBg: 'bg-slate-800 text-slate-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md">
        
        {/* Clinic Identity */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-stone-100 shadow-sm mb-3">
            <Building2 className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
            {settings.clinicName || 'HomoeoCare Health Centre'}
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
          {/* Station Selector */}
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
                      setPassword('');
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

            {/* Profile Selector if multiple accounts exist */}
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

          {/* Password Entry Zone */}
          <div className="p-6 sm:p-7">
            {!hasAccountsForStation ? (
              <div className="py-6 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center">
                <UserCheck className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <h3 className="text-xs font-semibold text-stone-800">
                  No account configured
                </h3>
                <p className="text-[11px] text-stone-500 mt-1 max-w-xs mx-auto">
                  Please sign in as Administrator to create accounts for this station.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-stone-900 hover:text-stone-700 bg-white px-3 py-1.5 rounded-xl border border-stone-300 shadow-2xs cursor-pointer transition-colors"
                >
                  Switch to Administrator
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Password
                    </label>
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                      {selectedRole}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>

                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Enter station password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-stone-50/50 border border-stone-300 rounded-2xl focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-hidden text-stone-900 transition-all placeholder:text-stone-400"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 py-2 px-3 rounded-xl animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading || !password.trim()}
                  className={`w-full py-3 px-4 rounded-2xl font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    password.trim() && !isLoading
                      ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-sm active:scale-[0.99]'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200/60'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} {settings.clinicName || 'HomoeoCare Health Centre'}</p>
        </div>

      </div>
    </div>
  );
};

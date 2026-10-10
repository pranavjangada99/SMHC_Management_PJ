import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { 
  Building2, 
  Lock, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  UserCheck, 
  ChevronDown, 
  ShieldCheck,
  Stethoscope,
  Receipt,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { 
    role, 
    currentStaff, 
    switchRole, 
    lockSession, 
    settings, 
    syncStatus, 
    lastSyncTime, 
    triggerCloudSync 
  } = useClinic();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerCloudSync();
    setIsSyncing(false);
  };

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-amber-50 text-amber-900 border-amber-200/80';
      case 'doctor':
        return 'bg-indigo-50 text-indigo-900 border-indigo-200/80';
      case 'receptionist':
        return 'bg-sky-50 text-sky-900 border-sky-200/80';
    }
  };

  const getRoleIcon = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5" />;
      case 'receptionist':
        return <Receipt className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Zone: Brand and Doctor Credentials */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:outline-hidden"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-100/90 text-teal-800 border border-teal-200/80 flex items-center justify-center font-bold text-base shadow-xs shrink-0 tracking-tight">
                <span>HC</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                    {settings.clinicName}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{settings.doctorName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{settings.qualification}</span>
                  <span aria-hidden="true" className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline font-mono text-[11px] text-slate-400">Reg: {settings.registrationNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Zone: Sync Status, Staff Badge & PIN Lock */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            
            {/* Sync Status Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title={`Last synchronized at ${lastSyncTime}. Click to sync now.`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {syncStatus === 'synced' ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              ) : syncStatus === 'offline' ? (
                <CloudOff className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <RefreshCw className={`w-3.5 h-3.5 text-stone-700 ${isSyncing ? 'animate-spin' : ''}`} />
              )}
              <span className="font-mono text-[11px] text-slate-500">
                {syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'offline' ? 'Offline Cache' : 'Local Storage'}
              </span>
            </button>

            {/* Staff Role Badge & Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${getRoleBadgeStyle(role)}`}
              >
                {getRoleIcon(role)}
                <span className="capitalize">{role}</span>
                <span className="hidden md:inline text-[11px] opacity-75 font-normal">({currentStaff.name})</span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </button>

              {roleMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setRoleMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Staff Station</p>
                      <p className="text-xs text-slate-600 mt-0.5">Quick switch counter credentials</p>
                    </div>

                    <button
                      onClick={() => { switchRole('doctor'); setRoleMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${role === 'doctor' ? 'font-semibold text-indigo-800 bg-indigo-50/60' : 'text-slate-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-indigo-600" />
                        <div>
                          <p className="font-medium">Doctor Station</p>
                          <p className="text-[11px] text-slate-400">{settings.doctorName}</p>
                        </div>
                      </div>
                      {role === 'doctor' && <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded">Active</span>}
                    </button>

                    <button
                      onClick={() => { switchRole('receptionist'); setRoleMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${role === 'receptionist' ? 'font-semibold text-blue-700 bg-blue-50/50' : 'text-slate-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium">Receptionist Desk</p>
                          <p className="text-[11px] text-slate-400">Tokens, Queue & Billing</p>
                        </div>
                      </div>
                      {role === 'receptionist' && <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Active</span>}
                    </button>

                    <button
                      onClick={() => { switchRole('admin'); setRoleMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${role === 'admin' ? 'font-semibold text-amber-700 bg-amber-50/50' : 'text-slate-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="font-medium">Administrator</p>
                          <p className="text-[11px] text-slate-400">Settings, Backups, Inventory</p>
                        </div>
                      </div>
                      {role === 'admin' && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Active</span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Quick Lock Button */}
            <button
              onClick={lockSession}
              title="Lock station with staff PIN"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Lock Station</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

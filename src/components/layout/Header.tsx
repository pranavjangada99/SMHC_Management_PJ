import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { 
  Building2, 
  Lock, 
  LogOut,
  UserPlus,
  Cloud, 
  CloudOff, 
  RefreshCw, 
  UserCheck, 
  ChevronDown, 
  ShieldCheck,
  Stethoscope,
  Receipt,
  Menu,
  X,
  Search
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleMobileMenu, 
  isMobileMenuOpen,
  onOpenCommandPalette 
}) => {
  const { 
    role, 
    currentStaff, 
    switchRole, 
    lockSession, 
    logout,
    settings, 
    syncStatus, 
    lastSyncTime, 
    triggerCloudSync,
    openStaffModal
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Left Zone: Clinic & Doctor Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 -ml-1 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:outline-hidden transition-colors shrink-0"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 tracking-tight leading-tight truncate">
                {settings.clinicName}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 leading-tight truncate mt-0.5">
                {settings.doctorName && <span className="font-semibold text-slate-700 truncate">{settings.doctorName}</span>}
                {settings.qualification && (
                  <span className="hidden sm:inline text-slate-400 truncate">
                    <span aria-hidden="true" className="mr-1 text-slate-300">·</span>
                    {settings.qualification}
                  </span>
                )}
                {settings.registrationNumber && (
                  <span className="hidden md:inline font-mono text-[10px] text-slate-400 truncate">
                    <span aria-hidden="true" className="mr-1 text-slate-300">·</span>
                    Reg: {settings.registrationNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Zone: Search Command Palette Trigger */}
          <div className="flex-1 max-w-md mx-3 hidden md:block">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 rounded-xl transition-all cursor-pointer shadow-2xs group"
              title="Search patients, consultations, and actions"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              <span className="font-medium text-slate-600 truncate">Quick Search (Patients, Consultations)...</span>
            </button>
          </div>

          {/* Right Zone: Mobile Search, Sync Status, Staff Badge & PIN Lock */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="md:hidden p-1.5 sm:p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Quick Search"
              aria-label="Search patients and consultations"
            >
              <Search className="w-4 h-4" />
            </button>
            
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
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${getRoleBadgeStyle(role)}`}
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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Session</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{currentStaff.name}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{role} Station</p>
                    </div>

                    {/* Manage Staff Users (Admin & Doctor) */}
                    {(role === 'admin' || role === 'doctor') && (
                      <div className="p-1 border-b border-slate-100 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRoleMenuOpen(false);
                            openStaffModal('receptionist', true);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-blue-900 bg-blue-50/70 hover:bg-blue-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-blue-600" />
                            <span>+ Add Receptionist</span>
                          </div>
                          <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                            Front Desk
                          </span>
                        </button>

                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoleMenuOpen(false);
                              openStaffModal('doctor', true);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-indigo-600" />
                              <span>+ Add Doctor</span>
                            </div>
                            <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded font-bold">
                              Practitioner
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setRoleMenuOpen(false);
                            openStaffModal(undefined, false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span>Manage Staff Directory</span>
                          <span className="text-[10px] text-slate-400">View All</span>
                        </button>
                      </div>
                    )}

                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRoleMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out / Switch Station</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Prominent Sign Out / Lock Button */}
            <button
              onClick={logout}
              title="Sign out and return to Login Screen"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

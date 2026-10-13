import React from 'react';
import { useClinic, NavigationTab } from '../../context/ClinicContext';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Stethoscope, 
  FileText, 
  Package, 
  CreditCard, 
  Database,
  Sliders,
  AlertCircle,
  Search
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isMobileOpen, 
  onCloseMobile,
  onOpenCommandPalette 
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    role, 
    appointments, 
    inventory,
    settings 
  } = useClinic();

  // Calculate live badge counts
  const today = new Date().toISOString().split('T')[0];
  const waitingCount = appointments.filter(a => a.date === today && a.status === 'waiting').length;
  const inConsultCount = appointments.filter(a => a.date === today && a.status === 'in-consultation').length;
  
  const configuredThreshold = settings.lowStockThreshold ?? 5;
  const thresholdMode = settings.lowStockThresholdMode || 'global';
  const lowStockCount = inventory.filter(i => {
    if (thresholdMode === 'item-specific') return i.currentStock <= i.minReorderLevel;
    if (thresholdMode === 'combined') return i.currentStock <= configuredThreshold || i.currentStock <= i.minReorderLevel;
    return i.currentStock <= configuredThreshold;
  }).length;

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; allowedRoles: string[]; badge?: number | string; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Clinic Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
    },
    {
      id: 'queue',
      label: 'Daily Patient Queue',
      icon: <Clock className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
      badge: waitingCount > 0 ? `${waitingCount} waiting` : undefined,
      badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200',
    },
    {
      id: 'patients',
      label: 'Patient Directory',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
    },
    {
      id: 'consultation',
      label: 'Doctor Consultation (EMR)',
      icon: <Stethoscope className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor'],
      badge: inConsultCount > 0 ? 'Active' : undefined,
      badgeColor: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    },
    {
      id: 'prescriptions',
      label: 'Prescription Records',
      icon: <FileText className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
    },
    {
      id: 'inventory',
      label: 'Dispensary & Cosmetics',
      icon: <Package className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: 'bg-rose-50 text-rose-800 border border-rose-200',
    },
    {
      id: 'billing',
      label: 'Billing & Payments',
      icon: <CreditCard className="w-4 h-4" />,
      allowedRoles: ['admin', 'receptionist', 'doctor'],
    },
    {
      id: 'settings',
      label: 'Practice Customization',
      icon: <Sliders className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor'],
    },
    {
      id: 'backup',
      label: 'Database & Cloud Sync',
      icon: <Database className="w-4 h-4" />,
      allowedRoles: ['admin', 'doctor'],
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full py-4">
      {/* Global Command Palette Trigger Button */}
      {onOpenCommandPalette && (
        <div className="px-3 mb-3">
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenCommandPalette();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/90 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs group"
            title="Open command palette (⌘K / Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Quick Search</span>
            </div>
            <kbd className="font-mono text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs text-slate-500 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      <div className="px-4 mb-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Practice Navigation
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems
          .filter(item => item.allowedRoles.includes(role))
          .map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Low stock alert callout in sidebar */}
      {lowStockCount > 0 && (
        <div className="mx-3 mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900">Low Stock Notice</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {lowStockCount} homoeopathic medicines are below reorder level.
              </p>
              <button
                onClick={() => handleNavClick('inventory')}
                className="mt-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
              >
                Open Dispensary →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Footer Badge */}
      <div className="px-4 pt-4 border-t border-slate-100 mt-auto">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[11px] font-medium text-slate-700">HomoeoCare System</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Single-Clinic EMR v1.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="no-print hidden lg:block w-64 bg-white border-r border-slate-200 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl z-50">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useClinic, NavigationTab } from '../../context/ClinicContext';
import { Patient, Consultation, UserRole } from '../../types/clinic';
import { 
  Search, 
  X, 
  User, 
  Users, 
  Stethoscope, 
  FileText, 
  Printer, 
  Clock, 
  Calendar, 
  CornerDownLeft, 
  Command, 
  Lock, 
  RefreshCw, 
  Plus, 
  Phone, 
  Sparkles, 
  Package, 
  CreditCard, 
  Settings, 
  Database, 
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  HeartPulse,
  Pill
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewPatientModal: (initialName?: string) => void;
  onOpenBookAppointmentModal: (patientId?: string) => void;
}

type PaletteCategory = 'all' | 'patients' | 'consultations' | 'pages' | 'actions';

interface FlatPaletteItem {
  id: string;
  category: 'patients' | 'consultations' | 'pages' | 'actions';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  // Specific metadata
  patient?: Patient;
  consultation?: Consultation;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenNewPatientModal,
  onOpenBookAppointmentModal,
}) => {
  const {
    patients,
    consultations,
    prescriptions,
    setActiveTab,
    startConsultation,
    openPatientDetails,
    openPrescriptionPrint,
    lockSession,
    switchRole,
    triggerCloudSync,
    settings,
    role
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input and lock body scrolling when open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setSelectedCategory('all');
      document.body.style.overflow = 'hidden';

      // Wait a microtask for DOM render
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timeout);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Navigation pages list
  const pagesList: { id: NavigationTab; title: string; subtitle: string; icon: React.ReactNode; tab: NavigationTab }[] = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Practice Overview & Analytics',
      subtitle: 'Real-time clinic statistics, OPD revenue & consultation summary',
      icon: <LayoutDashboard className="w-4 h-4 text-indigo-600" />,
      tab: 'dashboard'
    },
    {
      id: 'queue',
      title: 'Appointments & Token Queue',
      subtitle: 'Live waiting room queue, token call-in & walk-ins',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      tab: 'queue'
    },
    {
      id: 'patients',
      title: 'Patient Directory (EMR)',
      subtitle: 'Searchable patient database with full homoeopathic constitutional histories',
      icon: <Users className="w-4 h-4 text-teal-600" />,
      tab: 'patients'
    },
    {
      id: 'consultation',
      title: 'Doctor EMR Consultation Workspace',
      subtitle: 'Homoeopathic case recording, repertorisation & digital prescription generator',
      icon: <Stethoscope className="w-4 h-4 text-rose-600" />,
      tab: 'consultation'
    },
    {
      id: 'prescriptions',
      title: 'Prescription Records (Rx)',
      subtitle: 'Archive of issued digital prescriptions, dosages & re-prints',
      icon: <FileText className="w-4 h-4 text-blue-600" />,
      tab: 'prescriptions'
    },
    {
      id: 'inventory',
      title: 'Pharmacy & Stock Dispensary',
      subtitle: 'Homoeopathic dilutions, mother tinctures, biocombinations & cosmetics',
      icon: <Package className="w-4 h-4 text-emerald-600" />,
      tab: 'inventory'
    },
    {
      id: 'billing',
      title: 'Billing & Invoicing Counter',
      subtitle: 'Consultation fees, dispensary payments, GST invoices & UPI QR receipts',
      icon: <CreditCard className="w-4 h-4 text-violet-600" />,
      tab: 'billing'
    },
    {
      id: 'settings',
      title: 'Clinic & Practice Settings',
      subtitle: 'Clinic name, doctor credentials, letterhead, consultation fees & staff PINs',
      icon: <Settings className="w-4 h-4 text-slate-600" />,
      tab: 'settings'
    },
    {
      id: 'backup',
      title: 'Data Backup & Offline Sync',
      subtitle: 'JSON database export, offline cache backup & restoration',
      icon: <Database className="w-4 h-4 text-stone-600" />,
      tab: 'backup'
    }
  ], []);

  // Quick actions list
  const actionsList = useMemo(() => [
    {
      id: 'action-register-patient',
      title: 'Register New Patient',
      subtitle: 'Create a new clinical EMR record with demographic & constitutional details',
      badge: 'Registration',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <Plus className="w-4 h-4 text-emerald-600" />,
      onSelect: () => {
        onClose();
        onOpenNewPatientModal();
      }
    },
    {
      id: 'action-book-appointment',
      title: 'Issue Token / Book Appointment',
      subtitle: 'Schedule upcoming slot or issue immediate OPD walk-in queue token',
      badge: 'Queue',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: <Calendar className="w-4 h-4 text-indigo-600" />,
      onSelect: () => {
        onClose();
        onOpenBookAppointmentModal();
      }
    },
    {
      id: 'action-lock-station',
      title: 'Lock Station (PIN Lock)',
      subtitle: 'Protect patient confidentiality when stepping away from the counter',
      badge: 'Security',
      badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
      icon: <Lock className="w-4 h-4 text-stone-600" />,
      onSelect: () => {
        onClose();
        lockSession();
      }
    },
    {
      id: 'action-switch-doctor',
      title: 'Switch Station: Doctor Desk',
      subtitle: `Active user: ${settings.doctorName || 'Doctor'} · EMR & Clinical Prescriptions`,
      badge: role === 'doctor' ? 'Current' : 'Switch',
      badgeColor: role === 'doctor' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <Stethoscope className="w-4 h-4 text-indigo-600" />,
      onSelect: () => {
        onClose();
        switchRole('doctor');
      }
    },
    {
      id: 'action-switch-reception',
      title: 'Switch Station: Reception Counter',
      subtitle: 'Front Desk: Patient tokens, waiting room queue & payment invoicing',
      badge: role === 'receptionist' ? 'Current' : 'Switch',
      badgeColor: role === 'receptionist' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <CreditCard className="w-4 h-4 text-blue-600" />,
      onSelect: () => {
        onClose();
        switchRole('receptionist');
      }
    },
    {
      id: 'action-switch-admin',
      title: 'Switch Station: Administrator',
      subtitle: 'Full managerial access: Inventory control, fees, staff PINs & backups',
      badge: role === 'admin' ? 'Current' : 'Switch',
      badgeColor: role === 'admin' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
      onSelect: () => {
        onClose();
        switchRole('admin');
      }
    },
    {
      id: 'action-sync-cloud',
      title: 'Synchronize Clinic Database',
      subtitle: 'Push local clinic records to cloud storage cache and verify persistence',
      badge: 'Sync',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: <RefreshCw className="w-4 h-4 text-sky-600" />,
      onSelect: () => {
        onClose();
        triggerCloudSync();
      }
    }
  ], [onClose, onOpenNewPatientModal, onOpenBookAppointmentModal, lockSession, switchRole, triggerCloudSync, settings.doctorName, role]);

  // Compute filtered items
  const { flatItems, counts } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Filter Patients
    const matchedPatients: FlatPaletteItem[] = patients
      .filter(p => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.patientId.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.constitutionalType && p.constitutionalType.toLowerCase().includes(q)) ||
          (p.allergies && p.allergies.toLowerCase().includes(q)) ||
          (p.medicalHistory && p.medicalHistory.toLowerCase().includes(q))
        );
      })
      .slice(0, q ? 10 : 5)
      .map(p => ({
        id: `patient-${p.id}`,
        category: 'patients' as const,
        title: p.name,
        subtitle: `${p.gender} · ${p.age}y · Phone: ${p.phone}${p.constitutionalType ? ` · Affinity: ${p.constitutionalType}` : ''}`,
        badge: p.patientId,
        badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200/80',
        icon: (
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200/80 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            {p.patientId.slice(-4)}
          </div>
        ),
        onSelect: () => {
          onClose();
          openPatientDetails(p.id);
        },
        patient: p
      }));

    // 2. Filter Consultations
    // Sort consultations by newest first
    const sortedConsultations = [...consultations].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });

    const matchedConsultations: FlatPaletteItem[] = sortedConsultations
      .filter(c => {
        const pat = patients.find(p => p.id === c.patientId);
        const patName = pat?.name || 'Patient';
        const patId = pat?.patientId || '';
        const complaintTexts = (c.chiefComplaints || []).map(cc => cc.complaint).join(' ');
        
        // Find prescription if any
        const rx = prescriptions.find(p => p.consultationId === c.id || p.patientId === c.patientId);
        const remedyNames = rx ? rx.remedies.map(r => r.name).join(' ') : '';

        if (!q) return true;
        return (
          patName.toLowerCase().includes(q) ||
          patId.toLowerCase().includes(q) ||
          (c.diagnosis && c.diagnosis.toLowerCase().includes(q)) ||
          complaintTexts.toLowerCase().includes(q) ||
          remedyNames.toLowerCase().includes(q) ||
          (c.doctorName && c.doctorName.toLowerCase().includes(q)) ||
          c.date.includes(q)
        );
      })
      .slice(0, q ? 10 : 6)
      .map(c => {
        const pat = patients.find(p => p.id === c.patientId);
        const patName = pat?.name || 'Walk-in Patient';
        const patId = pat?.patientId || 'SMHC';
        const formattedDate = new Date(c.date || c.createdAt).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const primaryComplaint = c.chiefComplaints && c.chiefComplaints.length > 0 
          ? c.chiefComplaints[0].complaint 
          : 'Clinical Consultation Record';

        const rx = prescriptions.find(p => p.consultationId === c.id);

        return {
          id: `consultation-${c.id}`,
          category: 'consultations' as const,
          title: `${patName} — ${c.diagnosis || 'Homoeopathic Consultation'}`,
          subtitle: `${formattedDate} · ${primaryComplaint}${rx ? ` · Rx: ${rx.remedies.map(r => r.name).slice(0, 2).join(', ')}` : ''}`,
          badge: patId,
          badgeColor: 'bg-teal-50 text-teal-900 border-teal-200/80',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 border border-teal-200/80 flex items-center justify-center shrink-0">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
          ),
          onSelect: () => {
            onClose();
            if (pat) {
              openPatientDetails(pat.id);
            } else {
              setActiveTab('prescriptions');
            }
          },
          consultation: c,
          patient: pat
        };
      });

    // 3. Filter Navigation Pages
    const matchedPages: FlatPaletteItem[] = pagesList
      .filter(p => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      })
      .map(p => ({
        id: `page-${p.id}`,
        category: 'pages' as const,
        title: p.title,
        subtitle: p.subtitle,
        badge: 'Page',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: (
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            {p.icon}
          </div>
        ),
        onSelect: () => {
          onClose();
          setActiveTab(p.tab);
        }
      }));

    // 4. Filter Actions
    const matchedActions: FlatPaletteItem[] = actionsList
      .filter(a => {
        if (!q) return true;
        return (
          a.title.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q) ||
          a.badge.toLowerCase().includes(q)
        );
      })
      .map(a => ({
        id: a.id,
        category: 'actions' as const,
        title: a.title,
        subtitle: a.subtitle,
        badge: a.badge,
        badgeColor: a.badgeColor,
        icon: (
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            {a.icon}
          </div>
        ),
        onSelect: a.onSelect
      }));

    // Filter by category tab if selected
    let combined: FlatPaletteItem[] = [];
    if (selectedCategory === 'all') {
      combined = [
        ...matchedPatients,
        ...matchedConsultations,
        ...matchedPages,
        ...matchedActions
      ];
    } else if (selectedCategory === 'patients') {
      combined = matchedPatients;
    } else if (selectedCategory === 'consultations') {
      combined = matchedConsultations;
    } else if (selectedCategory === 'pages') {
      combined = matchedPages;
    } else if (selectedCategory === 'actions') {
      combined = matchedActions;
    }

    return {
      flatItems: combined,
      counts: {
        all: matchedPatients.length + matchedConsultations.length + matchedPages.length + matchedActions.length,
        patients: matchedPatients.length,
        consultations: matchedConsultations.length,
        pages: matchedPages.length,
        actions: matchedActions.length
      }
    };
  }, [
    searchQuery,
    selectedCategory,
    patients,
    consultations,
    prescriptions,
    pagesList,
    actionsList,
    onClose,
    openPatientDetails,
    setActiveTab
  ]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(Math.max(0, flatItems.length - 1));
    }
  }, [flatItems.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (itemsContainerRef.current) {
      const activeElement = itemsContainerRef.current.querySelector('[data-selected="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard controls within palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].onSelect();
      } else if (searchQuery.trim()) {
        // Fallback: register new patient with this name
        onClose();
        onOpenNewPatientModal(searchQuery.trim());
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const categories: PaletteCategory[] = ['all', 'patients', 'consultations', 'pages', 'actions'];
      const nextIdx = (categories.indexOf(selectedCategory) + 1) % categories.length;
      setSelectedCategory(categories[nextIdx]);
      setSelectedIndex(0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group items by category for clear visual sectioning when 'all' is active
  const groupedSections = selectedCategory === 'all' ? [
    { key: 'patients' as const, label: 'Patients EMR Directory', icon: <Users className="w-3.5 h-3.5 text-indigo-600" /> },
    { key: 'consultations' as const, label: 'Recent Clinical Consultations', icon: <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> },
    { key: 'pages' as const, label: 'Clinic Workspaces & Pages', icon: <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" /> },
    { key: 'actions' as const, label: 'Counter Actions & Operations', icon: <Sparkles className="w-3.5 h-3.5 text-amber-600" /> }
  ] : [
    { 
      key: selectedCategory, 
      label: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1), 
      icon: <Search className="w-3.5 h-3.5 text-indigo-600" /> 
    }
  ];

  return (
    <div 
      className="no-print fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-4 bg-slate-900/35 backdrop-blur-sm overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Box */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-indigo-600" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search patients, consultations, remedy, diagnosis, pages..."
            className="flex-1 text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <kbd className="hidden sm:inline-block font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Filter:
          </span>
          {(['all', 'patients', 'consultations', 'pages', 'actions'] as PaletteCategory[]).map(cat => {
            const count = counts[cat];
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-100/90 text-indigo-900 border border-indigo-200/90 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span className="capitalize">{cat}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-indigo-200/80 text-indigo-950 font-bold' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results List Area */}
        <div 
          ref={itemsContainerRef}
          className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100 space-y-4"
        >
          {flatItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No matching results for "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Try searching by patient name, SMHC ID, phone number, homoeopathic remedy (e.g. Arnica), or disease diagnosis.
              </p>

              {searchQuery.trim() && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNewPatientModal(searchQuery.trim());
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200/80 rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-indigo-700" />
                    <span>Register "{searchQuery.trim()}" as New Patient</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            groupedSections.map(section => {
              const sectionItems = flatItems.filter(item => item.category === section.key);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section.key} className="pt-2 first:pt-0">
                  <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    {section.icon}
                    <span>{section.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">({sectionItems.length})</span>
                  </div>

                  <div className="space-y-1">
                    {sectionItems.map(item => {
                      const itemIndex = flatItems.indexOf(item);
                      const isSelected = itemIndex === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          data-selected={isSelected}
                          onClick={() => item.onSelect()}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-200 shadow-2xs'
                              : 'border-transparent hover:bg-slate-50/80 hover:border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {item.icon}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-bold tracking-tight truncate ${
                                  isSelected ? 'text-indigo-950 font-extrabold' : 'text-slate-800'
                                }`}>
                                  {item.title}
                                </span>

                                {item.badge && (
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Quick Action Buttons for Patients & Consultations */}
                          <div className="flex items-center gap-1 shrink-0">
                            {item.patient && (
                              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                                <button
                                  type="button"
                                  title="Start Homoeopathic Consultation"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onClose();
                                    startConsultation(item.patient!);
                                  }}
                                  className="hidden sm:inline-flex p-1.5 text-xs text-indigo-700 bg-indigo-100/80 hover:bg-indigo-200 rounded-lg border border-indigo-200/80 transition-colors"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  title="Book Appointment / Issue Token"
                                  onClick={e => {
                                    e.stopPropagation();
                                    onClose();
                                    onOpenBookAppointmentModal(item.patient!.id);
                                  }}
                                  className="hidden sm:inline-flex p-1.5 text-xs text-amber-700 bg-amber-100/80 hover:bg-amber-200 rounded-lg border border-amber-200/80 transition-colors"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {item.consultation && (
                              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                                {(() => {
                                  const rx = prescriptions.find(p => p.consultationId === item.consultation!.id);
                                  if (rx) {
                                    return (
                                      <button
                                        type="button"
                                        title="Print / View Digital Prescription"
                                        onClick={e => {
                                          e.stopPropagation();
                                          onClose();
                                          openPrescriptionPrint(rx);
                                        }}
                                        className="hidden sm:inline-flex p-1.5 text-xs text-teal-700 bg-teal-100/80 hover:bg-teal-200 rounded-lg border border-teal-200/80 transition-colors"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}

                            <span className={`text-[11px] font-medium flex items-center gap-1 transition-transform ${
                              isSelected ? 'text-indigo-700 translate-x-0.5' : 'text-slate-400 group-hover:text-slate-600'
                            }`}>
                              <span className="hidden sm:inline text-[10px]">Select</span>
                              <CornerDownLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Keyboard Hint Bar */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.2 rounded shadow-2xs text-[10px] text-slate-600">↑</kbd>
              <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.2 rounded shadow-2xs text-[10px] text-slate-600">↓</kbd>
              <span>to navigate</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.2 rounded shadow-2xs text-[10px] text-slate-600">↵</kbd>
              <span>to open</span>
            </span>

            <span className="hidden sm:flex items-center gap-1">
              <kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs text-[10px] text-slate-600">Tab</kbd>
              <span>to switch category</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
            <span>Shortcut:</span>
            <span className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-600 font-bold">
              ⌘K / Ctrl+K
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

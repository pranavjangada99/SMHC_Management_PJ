import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserRole, 
  StaffProfile, 
  Patient, 
  Appointment, 
  AppointmentStatus,
  Consultation, 
  Prescription, 
  InventoryItem, 
  Invoice, 
  InvoiceItem, 
  PaymentMethod,
  ClinicSettings, 
  StaffPins,
  ConsultationTypeConfig 
} from '../types/clinic';
import { 
  localStore, 
  cloudSync, 
  generateDatabaseBackup, 
  restoreDatabaseBackup,
  DEFAULT_CLINIC_SETTINGS 
} from '../lib/storage';

export type NavigationTab = 
  | 'dashboard' 
  | 'queue' 
  | 'patients' 
  | 'consultation' 
  | 'prescriptions' 
  | 'inventory' 
  | 'billing' 
  | 'settings' 
  | 'backup';

export interface ClinicContextType {
  // Staff Role & Authentication
  role: UserRole;
  isLocked: boolean;
  staffProfiles: Record<UserRole, StaffProfile>;
  currentStaff: StaffProfile;
  unlockWithPin: (pin: string, targetRole?: UserRole) => boolean;
  switchRole: (role: UserRole) => void;
  lockSession: () => void;
  updateStaffPins: (pins: StaffPins) => void;

  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Selected Records for Workflows
  selectedPatientForConsultation: Patient | null;
  selectedAppointmentForConsultation: Appointment | null;
  startConsultation: (patient: Patient, appointment?: Appointment) => void;
  clearConsultationTarget: () => void;
  activePrescriptionToPrint: Prescription | null;
  openPrescriptionPrint: (prescription: Prescription) => void;
  closePrescriptionPrint: () => void;
  activeInvoiceToPrint: Invoice | null;
  openInvoicePrint: (invoice: Invoice) => void;
  closeInvoicePrint: () => void;

  // Data Collections
  settings: ClinicSettings;
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  syncStatus: 'synced' | 'syncing' | 'offline' | 'saved-local';
  lastSyncTime: string;

  // Actions
  addPatient: (data: Partial<Patient>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  scheduleAppointment: (data: Partial<Appointment>) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  cancelAppointment: (id: string) => void;
  saveConsultationAndPrescription: (
    consultation: Omit<Consultation, 'id' | 'createdAt'>, 
    prescription?: Omit<Prescription, 'id' | 'createdAt'>
  ) => { consultation: Consultation; prescription?: Prescription };
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => InventoryItem;
  updateInventoryStock: (id: string, newStock: number) => void;
  adjustInventory: (id: string, delta: number) => void;
  deleteInventoryItem: (id: string) => void;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  recordPayment: (invoiceId: string, amountPaid: number, method: PaymentMethod) => void;
  updateSettings: (updates: Partial<ClinicSettings>) => void;
  addCustomCategory: (cat: string) => void;
  removeCustomCategory: (cat: string) => void;
  addCustomRemedy: (rem: string) => void;
  removeCustomRemedy: (rem: string) => void;
  addCustomDosageFrequency: (freq: string) => void;
  removeCustomDosageFrequency: (freq: string) => void;
  addConsultationType: (type: ConsultationTypeConfig) => void;
  removeConsultationType: (id: string) => void;
  updateConsultationType: (id: string, feeINR: number) => void;
  triggerCloudSync: () => Promise<void>;
  exportBackupFile: () => Promise<{ filename: string; jsonContent: string }>;
  importBackupFile: (jsonString: string) => { success: boolean; message: string; counts?: Record<string, number> };
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Staff Role & PIN State
  const [role, setRole] = useState<UserRole>(() => localStore.getActiveRole() as UserRole);
  const [isLocked, setIsLocked] = useState<boolean>(() => localStore.getIsLocked());

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Active Workflow Selections
  const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<Patient | null>(null);
  const [selectedAppointmentForConsultation, setSelectedAppointmentForConsultation] = useState<Appointment | null>(null);
  const [activePrescriptionToPrint, setActivePrescriptionToPrint] = useState<Prescription | null>(null);
  const [activeInvoiceToPrint, setActiveInvoiceToPrint] = useState<Invoice | null>(null);

  // Entities State
  const [settings, setSettings] = useState<ClinicSettings>(() => localStore.getSettings());
  const [patients, setPatients] = useState<Patient[]>(() => localStore.getPatients());
  const [appointments, setAppointments] = useState<Appointment[]>(() => localStore.getAppointments());
  const [consultations, setConsultations] = useState<Consultation[]>(() => localStore.getConsultations());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => localStore.getPrescriptions());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => localStore.getInventory());
  const [invoices, setInvoices] = useState<Invoice[]>(() => localStore.getInvoices());

  // Sync Diagnostics
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'saved-local'>('saved-local');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Staff Profiles
  const staffProfiles: Record<UserRole, StaffProfile> = {
    admin: {
      role: 'admin',
      name: 'Clinic Administrator',
      title: 'Practice & Financial Manager',
      defaultPin: settings.staffPins?.admin || '1111',
    },
    doctor: {
      role: 'doctor',
      name: settings.doctorName || 'Dr. Pranav J.',
      title: 'Chief Homoeopathic Physician',
      defaultPin: settings.staffPins?.doctor || '2222',
    },
    receptionist: {
      role: 'receptionist',
      name: 'Sunita Rao',
      title: 'Front Desk & Patient Coordinator',
      defaultPin: settings.staffPins?.receptionist || '3333',
    },
  };

  const currentStaff = staffProfiles[role];

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStore.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    localStore.savePatients(patients);
  }, [patients]);

  useEffect(() => {
    localStore.saveAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    localStore.saveConsultations(consultations);
  }, [consultations]);

  useEffect(() => {
    localStore.savePrescriptions(prescriptions);
  }, [prescriptions]);

  useEffect(() => {
    localStore.saveInventory(inventory);
  }, [inventory]);

  useEffect(() => {
    localStore.saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    localStore.setActiveRole(role);
  }, [role]);

  useEffect(() => {
    localStore.setIsLocked(isLocked);
  }, [isLocked]);

  // Cloud Sync Handler
  const triggerCloudSync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await cloudSync.pushToCloud({
        settings,
        patients,
        appointments,
        consultations,
        prescriptions,
        inventory,
        invoices,
      });
      if (res.success) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('saved-local');
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setSyncStatus('offline');
    }
  };

  // Background Cloud Sync on initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCloudSync();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // PIN Unlock
  const unlockWithPin = (pin: string, targetRole?: UserRole): boolean => {
    const roleToCheck = targetRole || role;
    const requiredPin = settings.staffPins?.[roleToCheck] || staffProfiles[roleToCheck].defaultPin;
    
    // Also allow master admin PIN
    const masterAdminPin = settings.staffPins?.admin || '1111';

    if (pin === requiredPin || pin === masterAdminPin) {
      if (targetRole) {
        setRole(targetRole);
      }
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    // If switching between roles, require PIN re-confirmation for admin
    if (newRole === 'admin') {
      setIsLocked(true);
    }
  };

  const lockSession = () => {
    setIsLocked(true);
  };

  const updateStaffPins = (pins: StaffPins) => {
    setSettings(prev => ({
      ...prev,
      staffPins: pins,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Workflow Handlers
  const startConsultation = (patient: Patient, appointment?: Appointment) => {
    setSelectedPatientForConsultation(patient);
    setSelectedAppointmentForConsultation(appointment || null);
    
    // If appointment provided, update its status to in-consultation
    if (appointment && appointment.status !== 'in-consultation') {
      updateAppointmentStatus(appointment.id, 'in-consultation');
    }
    
    setActiveTab('consultation');
  };

  const clearConsultationTarget = () => {
    setSelectedPatientForConsultation(null);
    setSelectedAppointmentForConsultation(null);
  };

  const openPrescriptionPrint = (prescription: Prescription) => {
    setActivePrescriptionToPrint(prescription);
  };

  const closePrescriptionPrint = () => {
    setActivePrescriptionToPrint(null);
  };

  const openInvoicePrint = (invoice: Invoice) => {
    setActiveInvoiceToPrint(invoice);
  };

  const closeInvoicePrint = () => {
    setActiveInvoiceToPrint(null);
  };

  // Patient Actions
  const addPatient = (data: Partial<Patient>): Patient => {
    const nextSeq = patients.length + 1;
    const year = new Date().getFullYear();
    const patientId = `HC-${year}-${String(nextSeq).padStart(4, '0')}`;
    
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      patientId,
      name: data.name || 'Unnamed Patient',
      gender: data.gender || 'male',
      age: data.age || 0,
      dob: data.dob,
      phone: data.phone || '',
      email: data.email,
      address: data.address,
      bloodGroup: data.bloodGroup,
      constitutionalType: data.constitutionalType,
      allergies: data.allergies,
      medicalHistory: data.medicalHistory,
      totalVisits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPatients(prev => [newPatient, ...prev]);
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));
  };

  // Appointment Actions
  const scheduleAppointment = (data: Partial<Appointment>): Appointment => {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = data.date || today;
    
    // Calculate token number for that day
    const sameDayAppointments = appointments.filter(a => a.date === targetDate);
    const tokenNumber = sameDayAppointments.length + 1;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: data.patientId || '',
      patientName: data.patientName || 'Walk-in Patient',
      patientPhone: data.patientPhone || '',
      date: targetDate,
      timeSlot: data.timeSlot || '10:00 AM',
      tokenNumber,
      status: data.status || 'waiting',
      type: data.type || 'new',
      chiefComplaint: data.chiefComplaint,
      assignedDoctor: settings.doctorName,
      createdAt: new Date().toISOString(),
    };

    setAppointments(prev => [newAppointment, ...prev]);
    return newAppointment;
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status };
      }
      return a;
    }));
  };

  const cancelAppointment = (id: string) => {
    updateAppointmentStatus(id, 'cancelled');
  };

  // Consultation & Prescription Action
  const saveConsultationAndPrescription = (
    consultationData: Omit<Consultation, 'id' | 'createdAt'>,
    prescriptionData?: Omit<Prescription, 'id' | 'createdAt'>
  ): { consultation: Consultation; prescription?: Prescription } => {
    const consultationId = `con-${Date.now()}`;
    const newConsultation: Consultation = {
      ...consultationData,
      id: consultationId,
      createdAt: new Date().toISOString(),
    };

    let newPrescription: Prescription | undefined;

    if (prescriptionData && prescriptionData.remedies.length > 0) {
      const rxId = `rx-${Date.now()}`;
      newPrescription = {
        ...prescriptionData,
        id: rxId,
        consultationId,
        createdAt: new Date().toISOString(),
      };
      newConsultation.prescriptionId = rxId;

      setPrescriptions(prev => [newPrescription!, ...prev]);

      // Smart inventory deduction: Check if prescribed remedy matches inventory
      prescriptionData.remedies.forEach(rem => {
        setInventory(prevInv => prevInv.map(invItem => {
          const nameMatches = invItem.name.toLowerCase().includes(rem.name.toLowerCase()) || 
                              rem.name.toLowerCase().includes(invItem.name.toLowerCase());
          const potencyMatches = invItem.potency.toLowerCase().trim() === rem.potency.toLowerCase().trim();
          
          if (nameMatches && potencyMatches && invItem.currentStock > 0) {
            // Deduct 1 unit for dispensing phial / bottle
            return {
              ...invItem,
              currentStock: Math.max(0, invItem.currentStock - 1),
              updatedAt: new Date().toISOString(),
            };
          }
          return invItem;
        }));
      });
    }

    setConsultations(prev => [newConsultation, ...prev]);

    // Update patient's visit count and last visit date
    setPatients(prev => prev.map(p => {
      if (p.id === consultationData.patientId) {
        return {
          ...p,
          totalVisits: (p.totalVisits || 0) + 1,
          lastVisitDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));

    // If an appointment was linked, mark it completed
    if (consultationData.appointmentId) {
      updateAppointmentStatus(consultationData.appointmentId, 'completed');
    }

    // Auto-create pending invoice for reception
    const consultationFee = (consultationData.appointmentId ? 
      (appointments.find(a => a.id === consultationData.appointmentId)?.type === 'follow-up' ? settings.followupFeeINR : settings.consultationFeeINR) 
      : settings.consultationFeeINR) || 500;

    const patient = patients.find(p => p.id === consultationData.patientId);
    const invoiceItems: InvoiceItem[] = [
      {
        id: `item-cons-${Date.now()}`,
        description: `Consultation (${settings.doctorName})`,
        type: 'consultation',
        quantity: 1,
        unitPriceINR: consultationFee,
        totalINR: consultationFee,
      }
    ];

    if (newPrescription && newPrescription.remedies.length > 0) {
      const medicineCharge = 200; // Standard nominal dispensing fee for homoeopathy pack
      invoiceItems.push({
        id: `item-med-${Date.now()}`,
        description: `Homoeopathic Remedies Dispensed (${newPrescription.remedies.length} items)`,
        type: 'medicine',
        quantity: 1,
        unitPriceINR: medicineCharge,
        totalINR: medicineCharge,
      });
    }

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalINR, 0);

    createInvoice({
      patientId: consultationData.patientId,
      patientName: patient?.name || 'Patient',
      appointmentId: consultationData.appointmentId,
      date: new Date().toISOString().split('T')[0],
      items: invoiceItems,
      subtotalINR: subtotal,
      discountINR: 0,
      taxINR: 0,
      grandTotalINR: subtotal,
      paidINR: 0,
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      notes: 'Generated from Doctor Consultation',
    });

    return { consultation: newConsultation, prescription: newPrescription };
  };

  // Inventory Actions
  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'updatedAt'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setInventory(prev => [newItem, ...prev]);
    return newItem;
  };

  const updateInventoryStock = (id: string, newStock: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          currentStock: Math.max(0, newStock),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
  };

  const adjustInventory = (id: string, delta: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          currentStock: Math.max(0, item.currentStock + delta),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    }));
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  // Billing Actions
  const createInvoice = (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const nextSeq = invoices.length + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
    const receiptNumber = data.paymentStatus === 'paid' ? `REC-${year}-${String(nextSeq).padStart(4, '0')}` : undefined;

    const newInvoice: Invoice = {
      ...data,
      id: `inv-rec-${Date.now()}`,
      invoiceNumber,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const recordPayment = (invoiceId: string, amountPaid: number, method: PaymentMethod) => {
    const year = new Date().getFullYear();
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const totalPaid = inv.paidINR + amountPaid;
        const status = totalPaid >= inv.grandTotalINR ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';
        return {
          ...inv,
          paidINR: totalPaid,
          paymentStatus: status,
          paymentMethod: method,
          receiptNumber: inv.receiptNumber || `REC-${year}-${String(Math.floor(1000 + Math.random() * 9000))}`,
        };
      }
      return inv;
    }));
  };

  // Clinic Settings
  const updateSettings = (updates: Partial<ClinicSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const addCustomCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    setSettings(prev => {
      const exists = prev.customCategories?.includes(trimmed);
      if (exists) return prev;
      return {
        ...prev,
        customCategories: [...(prev.customCategories || []), trimmed],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const removeCustomCategory = (cat: string) => {
    setSettings(prev => ({
      ...prev,
      customCategories: (prev.customCategories || []).filter(c => c !== cat),
      updatedAt: new Date().toISOString(),
    }));
  };

  const addCustomRemedy = (rem: string) => {
    const trimmed = rem.trim();
    if (!trimmed) return;
    setSettings(prev => {
      const exists = prev.customRemedies?.some(r => r.toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      return {
        ...prev,
        customRemedies: [...(prev.customRemedies || []), trimmed],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const addCustomDosageFrequency = (freq: string) => {
    const trimmed = freq.trim();
    if (!trimmed) return;
    setSettings(prev => {
      const exists = prev.customDosageFrequencies?.includes(trimmed);
      if (exists) return prev;
      return {
        ...prev,
        customDosageFrequencies: [...(prev.customDosageFrequencies || []), trimmed],
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const removeCustomRemedy = (rem: string) => {
    setSettings(prev => ({
      ...prev,
      customRemedies: (prev.customRemedies || []).filter(r => r !== rem),
      updatedAt: new Date().toISOString(),
    }));
  };

  const removeCustomDosageFrequency = (freq: string) => {
    setSettings(prev => ({
      ...prev,
      customDosageFrequencies: (prev.customDosageFrequencies || []).filter(f => f !== freq),
      updatedAt: new Date().toISOString(),
    }));
  };

  const addConsultationType = (type: ConsultationTypeConfig) => {
    setSettings(prev => ({
      ...prev,
      consultationTypes: [...(prev.consultationTypes || []), type],
      updatedAt: new Date().toISOString(),
    }));
  };

  const removeConsultationType = (id: string) => {
    setSettings(prev => ({
      ...prev,
      consultationTypes: (prev.consultationTypes || []).filter(t => t.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateConsultationType = (id: string, feeINR: number) => {
    setSettings(prev => ({
      ...prev,
      consultationTypes: (prev.consultationTypes || []).map(t => t.id === id ? { ...t, feeINR } : t),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Backup & Restore
  const exportBackupFile = async () => {
    return await generateDatabaseBackup();
  };

  const importBackupFile = (jsonString: string) => {
    const res = restoreDatabaseBackup(jsonString);
    if (res.success) {
      // Reload states from localStore
      setSettings(localStore.getSettings());
      setPatients(localStore.getPatients());
      setAppointments(localStore.getAppointments());
      setConsultations(localStore.getConsultations());
      setPrescriptions(localStore.getPrescriptions());
      setInventory(localStore.getInventory());
      setInvoices(localStore.getInvoices());
      triggerCloudSync();
    }
    return res;
  };

  return (
    <ClinicContext.Provider
      value={{
        role,
        isLocked,
        staffProfiles,
        currentStaff,
        unlockWithPin,
        switchRole,
        lockSession,
        updateStaffPins,
        activeTab,
        setActiveTab,
        selectedPatientForConsultation,
        selectedAppointmentForConsultation,
        startConsultation,
        clearConsultationTarget,
        activePrescriptionToPrint,
        openPrescriptionPrint,
        closePrescriptionPrint,
        activeInvoiceToPrint,
        openInvoicePrint,
        closeInvoicePrint,
        settings,
        patients,
        appointments,
        consultations,
        prescriptions,
        inventory,
        invoices,
        syncStatus,
        lastSyncTime,
        addPatient,
        updatePatient,
        scheduleAppointment,
        updateAppointmentStatus,
        cancelAppointment,
        saveConsultationAndPrescription,
        addInventoryItem,
        updateInventoryStock,
        adjustInventory,
        deleteInventoryItem,
        createInvoice,
        recordPayment,
        updateSettings,
        addCustomCategory,
        removeCustomCategory,
        addCustomRemedy,
        removeCustomRemedy,
        addCustomDosageFrequency,
        removeCustomDosageFrequency,
        addConsultationType,
        removeConsultationType,
        updateConsultationType,
        triggerCloudSync,
        exportBackupFile,
        importBackupFile,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

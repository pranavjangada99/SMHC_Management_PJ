import { 
  Patient, 
  Appointment, 
  Consultation, 
  Prescription, 
  InventoryItem, 
  Invoice, 
  ClinicSettings, 
  DatabaseBackup 
} from '../types/clinic';

const STORAGE_KEYS = {
  SETTINGS: 'homoeocare_settings',
  PATIENTS: 'homoeocare_patients',
  APPOINTMENTS: 'homoeocare_appointments',
  CONSULTATIONS: 'homoeocare_consultations',
  PRESCRIPTIONS: 'homoeocare_prescriptions',
  INVENTORY: 'homoeocare_inventory',
  INVOICES: 'homoeocare_invoices',
  ACTIVE_ROLE: 'homoeocare_active_role',
  IS_LOCKED: 'homoeocare_is_locked',
};

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: 'HomoeoCare Health Centre',
  tagline: 'Holistic & Individualized Healing Clinic',
  doctorName: 'Dr. Pranav J.',
  qualification: 'B.H.M.S, M.D. (Hom.)',
  registrationNumber: 'HOM-MAH-84920',
  phone: '+91 98201 45890',
  email: 'contact@homoeocareclinic.in',
  address: 'Shop No. 4, Shanti Niketan Arcade, M.G. Road, Pune, Maharashtra 411001',
  opdTimings: 'Mon-Sat: 10:00 AM - 1:30 PM & 5:30 PM - 9:00 PM | Sun: Closed',
  consultationFeeINR: 500,
  followupFeeINR: 300,
  currencySymbol: '₹',
  staffPins: {
    admin: '1111',
    doctor: '2222',
    receptionist: '3333',
  },
  upiId: 'homoeocare@icici',
  upiPayeeName: 'HomoeoCare Health Centre',
  invoicePrefix: 'INV-2026-',
  patientIdPrefix: 'SMHC-',
  gstNumber: '27AABCH1234F1Z8',
  defaultPrescriptionAdvice: 'Avoid raw onions, garlic, camphor, menthol, and strong coffee within 30 minutes before and after taking medicines. Keep phials away from direct sunlight, pungent spices, and electronic magnetic devices.',

  consultationTypes: [
    { id: 'ct-1', name: 'New Patient Consultation', feeINR: 500 },
    { id: 'ct-2', name: 'Follow-up Consultation', feeINR: 300 },
    { id: 'ct-3', name: 'Constitutional Chronic Case Review', feeINR: 750 },
    { id: 'ct-4', name: 'Emergency Acute OPD', feeINR: 600 },
    { id: 'ct-5', name: 'Aesthetic & Skin / Hair Consultation', feeINR: 450 },
  ],
  customCategories: [
    'Dilution',
    'Mother Tincture',
    'Biochemic',
    'Trituration',
    'Cosmetic & Skincare',
    'Hair & Scalp Care',
    'Sugar Globules',
    'Supplements & Tonics'
  ],
  customDosageFrequencies: [
    'Morning & Night (BD)',
    'Thrice Daily (TDS)',
    'Once Daily (OD)',
    'At Bedtime (HS)',
    'Weekly Single Dose',
    'As Needed (SOS)',
    'Every 2 Hours (Acute State)'
  ],
  customRemedies: [
    'Arnica Montana',
    'Nux Vomica',
    'Lycopodium Clavatum',
    'Pulsatilla Nigricans',
    'Belladonna',
    'Rhus Toxicodendron',
    'Bryonia Alba',
    'Arsenicum Album',
    'Thuja Occidentalis',
    'Calcarea Carbonica',
    'Sulphur',
    'Silicea',
    'Hepar Sulphuris',
    'Phosphorus',
    'Ignatia Amara',
    'Natrum Muriaticum',
    'Sepia Succus',
    'Berberis Aquifolium',
    'Calendula Officinalis',
    'Five Phos 6X'
  ],
  themeMode: 'warm-stone',
  lowStockThreshold: 5,
  lowStockThresholdMode: 'global',
  updatedAt: new Date().toISOString(),
};

// Clean clinical datasets (starts with 0 dummy patients)
export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_CONSULTATIONS: Consultation[] = [];
export const INITIAL_PRESCRIPTIONS: Prescription[] = [];
export const INITIAL_INVOICES: Invoice[] = [];


// Helper to calculate SHA256 checksum for backup integrity verification
async function calculateChecksum(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'chk-' + Date.now().toString(36);
  }
}

// Local Storage Wrappers with safe JSON parsing
export const localStore = {
  getSettings(): ClinicSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_CLINIC_SETTINGS;
    try {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_CLINIC_SETTINGS,
        ...parsed,
        consultationTypes: (parsed.consultationTypes && parsed.consultationTypes.length > 0)
          ? parsed.consultationTypes
          : DEFAULT_CLINIC_SETTINGS.consultationTypes,
        customCategories: (parsed.customCategories && parsed.customCategories.length > 0)
          ? parsed.customCategories
          : DEFAULT_CLINIC_SETTINGS.customCategories,
        customDosageFrequencies: (parsed.customDosageFrequencies && parsed.customDosageFrequencies.length > 0)
          ? parsed.customDosageFrequencies
          : DEFAULT_CLINIC_SETTINGS.customDosageFrequencies,
        customRemedies: (parsed.customRemedies && parsed.customRemedies.length > 0)
          ? parsed.customRemedies
          : DEFAULT_CLINIC_SETTINGS.customRemedies,
      };
    } catch {
      return DEFAULT_CLINIC_SETTINGS;
    }
  },
  saveSettings(settings: ClinicSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
  getPatients(): Patient[] {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    const list: Patient[] = data ? JSON.parse(data) : INITIAL_PATIENTS;
    return list.map(p => ({
      ...p,
      patientId: p.patientId && p.patientId.startsWith('HC-') ? p.patientId.replace(/^HC-/, 'SMHC-') : p.patientId
    }));
  },
  savePatients(patients: Patient[]) {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  },
  getAppointments(): Appointment[] {
    const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
  },
  saveAppointments(appointments: Appointment[]) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },
  getConsultations(): Consultation[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
    return data ? JSON.parse(data) : INITIAL_CONSULTATIONS;
  },
  saveConsultations(consultations: Consultation[]) {
    localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(consultations));
  },
  getPrescriptions(): Prescription[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
    return data ? JSON.parse(data) : INITIAL_PRESCRIPTIONS;
  },
  savePrescriptions(prescriptions: Prescription[]) {
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
  },
  getInventory(): InventoryItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : INITIAL_INVENTORY;
  },
  saveInventory(inventory: InventoryItem[]) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  },
  getInvoices(): Invoice[] {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : INITIAL_INVOICES;
  },
  saveInvoices(invoices: Invoice[]) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },
  getActiveRole(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) || '';
  },
  setActiveRole(role: string) {
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    }
  },
  getIsLocked(): boolean {
    const session = sessionStorage.getItem('homoeocare_auth_session') || localStorage.getItem('homoeocare_auth_session');
    if (!session) return true; // Unauthenticated: show login screen!
    const val = localStorage.getItem(STORAGE_KEYS.IS_LOCKED);
    return val === 'true';
  },
  setIsLocked(locked: boolean) {
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, String(locked));
    if (locked) {
      sessionStorage.removeItem('homoeocare_auth_session');
      localStorage.removeItem('homoeocare_auth_session');
    }
  },
  getAuthSession(): { id?: string; role: string; name: string; title?: string } | null {
    try {
      const data = sessionStorage.getItem('homoeocare_auth_session') || localStorage.getItem('homoeocare_auth_session');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setAuthSession(session: { id?: string; role: string; name: string; title?: string }) {
    const json = JSON.stringify(session);
    sessionStorage.setItem('homoeocare_auth_session', json);
    localStorage.setItem('homoeocare_auth_session', json);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, session.role);
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
  },
  clearAuthSession() {
    sessionStorage.removeItem('homoeocare_auth_session');
    localStorage.removeItem('homoeocare_auth_session');
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
  }
};

// Cloud Database Sync Adapter (Cloudflare D1 is the primary database)
export const cloudSync = {
  async pushToCloud(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Cloudflare D1 database active' };
  },

  async pullFromCloud(): Promise<Partial<DatabaseBackup> | null> {
    return null;
  }
};

// Database Backup Export (JSON format with metadata and checksum)
export async function generateDatabaseBackup(): Promise<{ filename: string; jsonContent: string }> {
  const settings = localStore.getSettings();
  const patients = localStore.getPatients();
  const appointments = localStore.getAppointments();
  const consultations = localStore.getConsultations();
  const prescriptions = localStore.getPrescriptions();
  const inventory = localStore.getInventory();
  const invoices = localStore.getInvoices();

  const exportPayloadWithoutChecksum = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    clinicSettings: settings,
    patients,
    appointments,
    consultations,
    prescriptions,
    inventory,
    invoices,
  };

  const rawJson = JSON.stringify(exportPayloadWithoutChecksum, null, 2);
  const checksum = await calculateChecksum(rawJson);

  const fullBackup: DatabaseBackup = {
    ...exportPayloadWithoutChecksum,
    checksum,
  };

  const filename = `HomoeoCare_Backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString(36)}.json`;
  return {
    filename,
    jsonContent: JSON.stringify(fullBackup, null, 2),
  };
}

// Database Backup Restore with schema validation
export function restoreDatabaseBackup(jsonString: string): { success: boolean; message: string; counts?: Record<string, number> } {
  try {
    const data = JSON.parse(jsonString);

    if (!data.version || !data.clinicSettings) {
      return { success: false, message: 'Invalid backup file: Missing clinic header schema.' };
    }

    if (data.clinicSettings) localStore.saveSettings(data.clinicSettings);
    if (Array.isArray(data.patients)) localStore.savePatients(data.patients);
    if (Array.isArray(data.appointments)) localStore.saveAppointments(data.appointments);
    if (Array.isArray(data.consultations)) localStore.saveConsultations(data.consultations);
    if (Array.isArray(data.prescriptions)) localStore.savePrescriptions(data.prescriptions);
    if (Array.isArray(data.inventory)) localStore.saveInventory(data.inventory);
    if (Array.isArray(data.invoices)) localStore.saveInvoices(data.invoices);

    return {
      success: true,
      message: 'Database backup restored successfully into active storage.',
      counts: {
        patients: data.patients?.length || 0,
        appointments: data.appointments?.length || 0,
        consultations: data.consultations?.length || 0,
        inventory: data.inventory?.length || 0,
        invoices: data.invoices?.length || 0,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to parse JSON backup file.' 
    };
  }
}

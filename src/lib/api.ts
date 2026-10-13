/**
 * Cloudflare Worker / D1 API Client
 * Replaces direct Firestore access with secure API layer
 */

import {
  Patient,
  Appointment,
  AppointmentStatus,
  Consultation,
  Prescription,
  InventoryItem,
  Invoice,
  ClinicSettings,
  UserRole,
  PaymentMethod,
} from '../types/clinic';
import { auth } from './firebase';

export interface DbStatusResponse {
  status: string;
  database: string;
  databaseId?: string;
  latencyMs: number;
  stats?: {
    patients: number;
    invoices: number;
    inventory: number;
  };
  timestamp: string;
}

// Get stored staff credentials for headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const role = localStorage.getItem('homoeocare_active_role') || 'doctor';
    headers['X-Staff-Role'] = role;

    // Attach Firebase token if current user is logged in
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Async token or cached token if available
    }
  } catch {
    // fallback
  }

  return headers;
}

function getApiUrl(endpoint: string): string {
  // If running on Cloudflare Pages, direct calls to the live Cloudflare Worker API
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.pages.dev')) {
    return `https://homoeocare-clinic.pranavjangada.workers.dev${endpoint}`;
  }
  return endpoint;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders = getAuthHeaders();
  const headers = {
    ...defaultHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  const targetUrl = getApiUrl(endpoint);
  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `API Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const clinicApi = {
  // Database Status & Diagnostics
  async getDbStatus(): Promise<DbStatusResponse> {
    return apiRequest<DbStatusResponse>('/api/db-status');
  },

  // Settings
  async getSettings(): Promise<ClinicSettings> {
    const data = await apiRequest<Record<string, any>>('/api/settings');
    return {
      clinicName: data.clinic_name || data.clinicName,
      tagline: data.tagline,
      doctorName: data.doctor_name || data.doctorName,
      qualification: data.qualification,
      registrationNumber: data.registration_number || data.registrationNumber,
      phone: data.phone,
      email: data.email,
      address: data.address,
      opdTimings: data.opd_timings || data.opdTimings,
      consultationFeeINR: data.consultation_fee_inr || data.consultationFeeINR || 500,
      followupFeeINR: data.followup_fee_inr || data.followupFeeINR || 300,
      currencySymbol: data.currency_symbol || data.currencySymbol || '₹',
      staffPins: data.staff_pins || data.staffPins || { admin: '1111', doctor: '2222', receptionist: '3333' },
      upiId: data.upi_id || data.upiId,
      upiPayeeName: data.upi_payee_name || data.upiPayeeName,
      gstNumber: data.gst_number || data.gstNumber,
      invoicePrefix: data.invoice_prefix || data.invoicePrefix || 'INV-2026-',
      patientIdPrefix: data.patient_id_prefix || data.patientIdPrefix || 'SMHC-',
      defaultPrescriptionAdvice: data.default_prescription_advice || data.defaultPrescriptionAdvice,
      consultationTypes: data.consultation_types || data.consultationTypes || [],
      customCategories: data.custom_categories || data.customCategories || [],
      customDosageFrequencies: data.custom_dosage_frequencies || data.customDosageFrequencies || [],
      customRemedies: data.custom_remedies || data.customRemedies || [],
      themeMode: data.theme_mode || data.themeMode || 'warm-stone',
      lowStockThreshold: data.low_stock_threshold ?? data.lowStockThreshold ?? 5,
      lowStockThresholdMode: data.low_stock_threshold_mode || data.lowStockThresholdMode || 'global',
      updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
    };
  },

  async updateSettings(updates: Partial<ClinicSettings>): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Patients
  async getPatients(): Promise<Patient[]> {
    const raw = await apiRequest<any[]>('/api/patients');
    return raw.map(p => ({
      id: p.id,
      patientId: p.patient_id || p.patientId,
      name: p.name,
      gender: p.gender,
      age: p.age,
      dob: p.dob,
      phone: p.phone,
      email: p.email,
      address: p.address,
      bloodGroup: p.blood_group || p.bloodGroup,
      constitutionalType: p.constitutional_type || p.constitutionalType,
      allergies: p.allergies,
      medicalHistory: p.medical_history || p.medicalHistory,
      totalVisits: p.total_visits ?? p.totalVisits ?? 0,
      lastVisitDate: p.last_visit_date || p.lastVisitDate,
      createdAt: p.created_at || p.createdAt,
      updatedAt: p.updated_at || p.updatedAt,
    }));
  },

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    const p = await apiRequest<any>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
    return {
      id: p.id,
      patientId: p.patient_id || p.patientId,
      name: p.name,
      gender: p.gender,
      age: p.age,
      dob: p.dob,
      phone: p.phone,
      email: p.email,
      address: p.address,
      bloodGroup: p.blood_group || p.bloodGroup,
      constitutionalType: p.constitutional_type || p.constitutionalType,
      allergies: p.allergies,
      medicalHistory: p.medical_history || p.medicalHistory,
      totalVisits: p.total_visits ?? p.totalVisits ?? 0,
      lastVisitDate: p.last_visit_date || p.lastVisitDate,
      createdAt: p.created_at || p.createdAt,
      updatedAt: p.updated_at || p.updatedAt,
    };
  },

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const p = await apiRequest<any>(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return {
      id: p.id,
      patientId: p.patient_id || p.patientId,
      name: p.name,
      gender: p.gender,
      age: p.age,
      dob: p.dob,
      phone: p.phone,
      email: p.email,
      address: p.address,
      bloodGroup: p.blood_group || p.bloodGroup,
      constitutionalType: p.constitutional_type || p.constitutionalType,
      allergies: p.allergies,
      medicalHistory: p.medical_history || p.medicalHistory,
      totalVisits: p.total_visits ?? p.totalVisits ?? 0,
      lastVisitDate: p.last_visit_date || p.lastVisitDate,
      createdAt: p.created_at || p.createdAt,
      updatedAt: p.updated_at || p.updatedAt,
    };
  },

  // Appointments
  async getAppointments(date?: string): Promise<Appointment[]> {
    const path = date ? `/api/appointments?date=${encodeURIComponent(date)}` : '/api/appointments';
    const raw = await apiRequest<any[]>(path);
    return raw.map(a => ({
      id: a.id,
      patientId: a.patient_id || a.patientId,
      patientName: a.patient_name || a.patientName,
      patientPhone: a.patient_phone || a.patientPhone,
      date: a.date,
      timeSlot: a.time_slot || a.timeSlot,
      tokenNumber: a.token_number ?? a.tokenNumber,
      status: a.status,
      type: a.type,
      chiefComplaint: a.chief_complaint || a.chiefComplaint,
      assignedDoctor: a.assigned_doctor || a.assignedDoctor,
      createdAt: a.created_at || a.createdAt,
    }));
  },

  async scheduleAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    const a = await apiRequest<any>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return {
      id: a.id,
      patientId: a.patient_id || a.patientId,
      patientName: a.patient_name || a.patientName,
      patientPhone: a.patient_phone || a.patientPhone,
      date: a.date,
      timeSlot: a.time_slot || a.timeSlot,
      tokenNumber: a.token_number ?? a.tokenNumber,
      status: a.status,
      type: a.type,
      chiefComplaint: a.chief_complaint || a.chiefComplaint,
      assignedDoctor: a.assigned_doctor || a.assignedDoctor,
      createdAt: a.created_at || a.createdAt,
    };
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
    await apiRequest(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async cancelAppointment(id: string): Promise<void> {
    await apiRequest(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  // Consultations (Doctor & Admin)
  async getConsultations(patientId?: string): Promise<Consultation[]> {
    const path = patientId ? `/api/consultations?patientId=${encodeURIComponent(patientId)}` : '/api/consultations';
    const raw = await apiRequest<any[]>(path);
    return raw.map(c => ({
      id: c.id,
      patientId: c.patient_id || c.patientId,
      appointmentId: c.appointment_id || c.appointmentId,
      date: c.date,
      doctorName: c.doctor_name || c.doctorName,
      vitals: c.vitals,
      chiefComplaints: c.chiefComplaints || [],
      modalities: c.modalities,
      mindGenerals: c.mindGenerals,
      physicalObservations: c.physical_observations || c.physicalObservations,
      miasm: c.miasm,
      diagnosis: c.diagnosis,
      prescriptionId: c.prescription_id || c.prescriptionId,
      followUpAdvice: c.follow_up_advice || c.followUpAdvice,
      nextVisitDate: c.next_visit_date || c.nextVisitDate,
      createdAt: c.created_at || c.createdAt,
    }));
  },

  async createConsultation(consultation: Omit<Consultation, 'id' | 'createdAt'>): Promise<Consultation> {
    const c = await apiRequest<any>('/api/consultations', {
      method: 'POST',
      body: JSON.stringify(consultation),
    });
    return {
      id: c.id,
      patientId: c.patientId,
      appointmentId: c.appointmentId,
      date: c.date,
      doctorName: c.doctorName,
      vitals: c.vitals,
      chiefComplaints: c.chiefComplaints,
      modalities: c.modalities,
      mindGenerals: c.mindGenerals,
      physicalObservations: c.physicalObservations,
      miasm: c.miasm,
      diagnosis: c.diagnosis,
      prescriptionId: c.prescriptionId,
      followUpAdvice: c.followUpAdvice,
      nextVisitDate: c.nextVisitDate,
      createdAt: c.createdAt || new Date().toISOString(),
    };
  },

  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    return apiRequest<Prescription[]>('/api/prescriptions');
  },

  async createPrescription(prescription: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> {
    const res = await apiRequest<{ id: string; success: boolean }>('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescription),
    });
    return {
      ...prescription,
      id: res.id,
      createdAt: new Date().toISOString(),
    };
  },

  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    return apiRequest<InventoryItem[]>('/api/inventory');
  },

  async createInventoryItem(item: Omit<InventoryItem, 'id' | 'updatedAt'>): Promise<InventoryItem> {
    const res = await apiRequest<any>('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return {
      ...item,
      id: res.id,
      updatedAt: new Date().toISOString(),
    };
  },

  async updateInventoryStock(id: string, newStock: number): Promise<void> {
    await apiRequest(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ currentStock: newStock }),
    });
  },

  async deleteInventoryItem(id: string): Promise<void> {
    await apiRequest(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  // Invoices & Billing
  async getInvoices(): Promise<Invoice[]> {
    return apiRequest<Invoice[]>('/api/invoices');
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Invoice> {
    const res = await apiRequest<any>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
    return {
      ...invoice,
      id: res.id,
      invoiceNumber: res.invoiceNumber,
      createdAt: new Date().toISOString(),
    };
  },

  async recordPayment(invoiceId: string, amountPaid: number, method: PaymentMethod): Promise<void> {
    await apiRequest(`/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ amountPaid, method }),
    });
  },

  // Migration from Firestore
  async migrateFromFirestore(payload: Record<string, any>): Promise<{ success: boolean; message: string; migratedCounts?: Record<string, number> }> {
    return apiRequest<{ success: boolean; message: string; migratedCounts?: Record<string, number> }>('/api/migrate-from-firestore', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

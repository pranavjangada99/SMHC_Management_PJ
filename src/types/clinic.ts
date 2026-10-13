/**
 * HomoeoCare Clinic Management Types
 */

export type UserRole = 'admin' | 'doctor' | 'receptionist';

export interface StaffProfile {
  role: UserRole;
  name: string;
  title: string;
  defaultPin: string;
}

export interface StaffUser {
  id: string;
  role: UserRole;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  pin?: string;
  status?: string;
  createdByRole?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  patientId: string; // e.g. SMHC-2026-0001
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  dob?: string;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  constitutionalType?: string; // Homoeopathic constitutional remedy affinity (e.g. Lycopodium, Pulsatilla, Sulphur, Calcarea Carb)
  allergies?: string;
  medicalHistory?: string;
  totalVisits: number;
  lastVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'scheduled' | 'waiting' | 'in-consultation' | 'completed' | 'cancelled' | 'no-show';
export type AppointmentType = 'new' | 'follow-up' | 'emergency';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. 10:30 AM
  tokenNumber: number; // 1, 2, 3...
  status: AppointmentStatus;
  type: AppointmentType;
  chiefComplaint?: string;
  assignedDoctor: string;
  createdAt: string;
}

export interface Vitals {
  bp?: string; // e.g. 120/80
  pulse?: number; // bpm
  temperature?: number; // °F
  spo2?: number; // %
  weight?: number; // kg
}

export interface ChiefComplaintItem {
  complaint: string;
  duration: string;
  sensation?: string; // e.g. Burning, Throbbing, Sticking
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Modalities {
  aggravation?: string; // What makes it worse: Heat, Cold, Damp, Night, Motion
  amelioration?: string; // What makes it better: Rest, Warmth, Cold applications, Pressure
}

export type ThermalReaction = 'chilly' | 'hot' | 'ambithermal';

export interface MindAndGenerals {
  temperament?: string; // Mild, Anxious, Irritable, Weeping easily, Restless
  thermalReaction?: ThermalReaction; // Chilly vs Hot patient
  appetite?: string;
  thirst?: string; // Thirstless or Thirsty for large quantities
  sleep?: string;
  cravingsAndAversions?: string; // Sweets, Spicy, Salt, Warm drinks
}

export type MiasmType = 'psora' | 'sycosis' | 'syphilis' | 'tubercular' | 'mixed';

export interface Consultation {
  id: string;
  patientId: string;
  appointmentId?: string;
  date: string; // ISO string
  doctorName: string;
  vitals?: Vitals;
  chiefComplaints: ChiefComplaintItem[];
  modalities?: Modalities;
  mindGenerals?: MindAndGenerals;
  physicalObservations?: string;
  miasm?: MiasmType;
  diagnosis: string;
  prescriptionId?: string;
  followUpAdvice?: string;
  nextVisitDate?: string;
  createdAt: string;
}

export interface PrescribedRemedy {
  id: string;
  name: string; // e.g. Arnica Montana
  potency: string; // e.g. 30C, 200C, 1M, Q (Mother Tincture), 6X
  form: 'pills' | 'dilution' | 'biochemic' | 'mother-tincture' | 'trituration';
  dosage: string; // e.g. 4 pills, 10 drops
  frequency: string; // e.g. Morning & Night (BD), Thrice daily (TDS), Once daily (OD), SOS
  durationDays: number; // e.g. 7, 14, 30
  instructions?: string; // e.g. Dissolve on clean tongue, before meals
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  date: string;
  remedies: PrescribedRemedy[];
  generalAdvice?: string; // Homoeopathy precautions: Avoid raw onions, garlic, camphor, coffee near dose time
  doctorSignature: string;
  doctorRegistrationNumber?: string;
  createdAt: string;
}

export type MedicineCategory = 
  | 'dilution' 
  | 'mother-tincture' 
  | 'biochemic' 
  | 'trituration' 
  | 'globules' 
  | 'bottle' 
  | 'cosmetic' 
  | 'skincare' 
  | 'supplement'
  | string;

export interface InventoryItem {
  id: string;
  name: string;
  category: MedicineCategory;
  productType?: 'medicine' | 'cosmetic' | 'wellness';
  potency: string; // e.g. 30C, 200C, 1M, 6X, or cosmetic formulation like 'Topical Cream'
  unit: string; // e.g. ml, phials, tablets, pack, 50g jar, 100ml bottle
  currentStock: number;
  minReorderLevel: number;
  unitPriceINR: number;
  purchasePriceINR?: number;
  batchNumber?: string;
  expiryDate?: string; // YYYY-MM
  supplier?: string;
  brand?: string; // e.g. SBL, Wheezal, Bakson, Dr. Reckeweg, In-House
  subCategory?: string; // e.g. Face Cream, Hair Oil, Serum, Lotion, Shampoo, Face Wash
  cosmeticBenefit?: string; // e.g. Acne marks & radiant glow, Hair fall control, Sun protection
  activeIngredients?: string; // e.g. Berberis Aquifolium, Calendula, Arnica Montana
  shelfLocation?: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  type: 'consultation' | 'medicine' | 'cosmetic' | 'test' | 'other';
  quantity: number;
  unitPriceINR: number;
  totalINR: number;
}

export type PaymentStatus = 'paid' | 'partial' | 'pending';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank-transfer';

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2026-0001
  patientId: string;
  patientName: string;
  appointmentId?: string;
  date: string;
  items: InvoiceItem[];
  subtotalINR: number;
  discountINR: number;
  taxINR: number;
  grandTotalINR: number;
  paidINR: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  transactionRef?: string;
  notes?: string;
  createdAt: string;
}

export interface StaffPins {
  admin: string;
  doctor: string;
  receptionist: string;
}

export interface ConsultationTypeConfig {
  id: string;
  name: string;
  feeINR: number;
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  doctorName: string;
  registrationNumber: string;
  qualification: string;
  phone: string;
  email: string;
  address: string;
  opdTimings?: string;
  consultationFeeINR: number;
  followupFeeINR: number;
  currencySymbol: string;
  staffPins: StaffPins;
  upiId?: string;
  upiPayeeName?: string;
  gstNumber?: string;
  bankDetails?: string;
  taxRatePercent?: number;
  invoicePrefix?: string;
  patientIdPrefix?: string;
  defaultPrescriptionAdvice?: string;
  consultationTypes: ConsultationTypeConfig[];
  customCategories: string[];
  customDosageFrequencies: string[];
  customRemedies: string[];
  themeMode?: 'warm-stone' | 'aesthetic-slate' | 'soft-mineral' | 'rose-wellness';
  lowStockThreshold?: number;
  lowStockThresholdMode?: 'global' | 'item-specific' | 'combined';
  updatedAt: string;
}

export interface DatabaseBackup {
  version: string;
  exportedAt: string;
  checksum: string;
  clinicSettings: ClinicSettings;
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  inventory: InventoryItem[];
  invoices: Invoice[];
}


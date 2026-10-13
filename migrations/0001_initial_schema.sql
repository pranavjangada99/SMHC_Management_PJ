-- =====================================================================
-- Cloudflare D1 Relational Schema Migration: 0001_initial_schema.sql
-- Clinic Management Application (HomoeoCare Health Centre)
-- Designed for Cloudflare D1 (SQLite) with scalability for 10,000+ patients
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Clinic Settings & Configuration
CREATE TABLE IF NOT EXISTS clinic_settings (
  id TEXT PRIMARY KEY,
  clinic_name TEXT NOT NULL,
  tagline TEXT,
  doctor_name TEXT NOT NULL,
  qualification TEXT,
  registration_number TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  opd_timings TEXT,
  consultation_fee_inr REAL NOT NULL DEFAULT 500,
  followup_fee_inr REAL NOT NULL DEFAULT 300,
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  staff_pins TEXT NOT NULL, -- JSON: {"admin":"1111","doctor":"2222","receptionist":"3333"}
  upi_id TEXT,
  upi_payee_name TEXT,
  gst_number TEXT,
  bank_details TEXT,
  tax_rate_percent REAL DEFAULT 0,
  invoice_prefix TEXT DEFAULT 'INV-2026-',
  patient_id_prefix TEXT DEFAULT 'SMHC-',
  default_prescription_advice TEXT,
  consultation_types TEXT, -- JSON array of ConsultationTypeConfig
  custom_categories TEXT, -- JSON array of strings
  custom_dosage_frequencies TEXT, -- JSON array of strings
  custom_remedies TEXT, -- JSON array of strings
  theme_mode TEXT DEFAULT 'warm-stone',
  low_stock_threshold INTEGER DEFAULT 5,
  low_stock_threshold_mode TEXT DEFAULT 'global',
  updated_at TEXT NOT NULL
);

-- 2. Staff Profiles & Users
CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'receptionist')),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  firebase_uid TEXT UNIQUE,
  created_at TEXT NOT NULL
);

-- 3. Patients Registry (Indexed for fast lookup by phone, name, and patient_id)
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  patient_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('male', 'female', 'other')),
  age INTEGER NOT NULL,
  dob TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  blood_group TEXT,
  constitutional_type TEXT,
  allergies TEXT,
  medical_history TEXT,
  total_visits INTEGER NOT NULL DEFAULT 0,
  last_visit_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_last_visit ON patients(last_visit_date);

-- 4. Patient Appointments & Queue Tokens
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  time_slot TEXT NOT NULL,
  token_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('scheduled', 'waiting', 'in-consultation', 'completed', 'cancelled', 'no-show')),
  type TEXT NOT NULL CHECK(type IN ('new', 'follow-up', 'emergency')),
  chief_complaint TEXT,
  assigned_doctor TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- 5. Clinical Consultations (Doctor Case Taking & Examination)
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  vitals_bp TEXT,
  vitals_pulse INTEGER,
  vitals_temp REAL,
  vitals_spo2 INTEGER,
  vitals_weight REAL,
  chief_complaints TEXT NOT NULL, -- JSON array of ChiefComplaintItem
  modalities TEXT, -- JSON Modalities
  mind_generals TEXT, -- JSON MindAndGenerals
  physical_observations TEXT,
  miasm TEXT,
  diagnosis TEXT NOT NULL,
  prescription_id TEXT,
  follow_up_advice TEXT,
  next_visit_date TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date);

-- 6. Prescriptions (Linked to consultations & patients)
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  consultation_id TEXT REFERENCES consultations(id) ON DELETE SET NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  date TEXT NOT NULL,
  general_advice TEXT,
  doctor_signature TEXT NOT NULL,
  doctor_registration_number TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(date);

-- 7. Prescription Remedies (Normalized Line Items)
CREATE TABLE IF NOT EXISTS prescription_remedies (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  potency TEXT NOT NULL,
  form TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  instructions TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_remedies_prescription_id ON prescription_remedies(prescription_id);

-- 8. Inventory & Medicine Dispensary Stocks
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  product_type TEXT DEFAULT 'medicine',
  potency TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_reorder_level INTEGER NOT NULL DEFAULT 5,
  unit_price_inr REAL NOT NULL,
  purchase_price_inr REAL,
  batch_number TEXT,
  expiry_date TEXT,
  supplier TEXT,
  brand TEXT,
  sub_category TEXT,
  cosmetic_benefit TEXT,
  active_ingredients TEXT,
  shelf_location TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(current_stock);

-- 9. Invoices & Billing Records
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  subtotal_inr REAL NOT NULL,
  discount_inr REAL NOT NULL DEFAULT 0,
  tax_inr REAL NOT NULL DEFAULT 0,
  grand_total_inr REAL NOT NULL,
  paid_inr REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL CHECK(payment_status IN ('paid', 'partial', 'pending')),
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'upi', 'card', 'bank-transfer')),
  receipt_number TEXT,
  transaction_ref TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(payment_status);

-- 10. Invoice Line Items (Normalized Line Items)
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('consultation', 'medicine', 'cosmetic', 'test', 'other')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_inr REAL NOT NULL,
  total_inr REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 11. Payments & Transaction Log
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount_inr REAL NOT NULL,
  payment_method TEXT NOT NULL,
  receipt_number TEXT,
  transaction_ref TEXT,
  paid_at TEXT NOT NULL,
  recorded_by_role TEXT NOT NULL DEFAULT 'receptionist'
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

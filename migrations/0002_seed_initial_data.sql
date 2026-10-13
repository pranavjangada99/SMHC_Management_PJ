-- =====================================================================
-- Cloudflare D1 Relational Seed Migration: 0002_seed_initial_data.sql
-- Default seed dataset for HomoeoCare Health Centre
-- =====================================================================

-- Seed Clinic Settings
INSERT OR IGNORE INTO clinic_settings (
  id,
  clinic_name,
  tagline,
  doctor_name,
  qualification,
  registration_number,
  phone,
  email,
  address,
  opd_timings,
  consultation_fee_inr,
  followup_fee_inr,
  currency_symbol,
  staff_pins,
  upi_id,
  upi_payee_name,
  gst_number,
  invoice_prefix,
  patient_id_prefix,
  default_prescription_advice,
  consultation_types,
  custom_categories,
  custom_dosage_frequencies,
  custom_remedies,
  theme_mode,
  low_stock_threshold,
  low_stock_threshold_mode,
  updated_at
) VALUES (
  'active',
  'HomoeoCare Health Centre',
  'Holistic & Individualized Healing Clinic',
  'Dr. Pranav J.',
  'B.H.M.S, M.D. (Hom.)',
  'HOM-MAH-84920',
  '+91 98201 45890',
  'contact@homoeocareclinic.in',
  'Shop No. 4, Shanti Niketan Arcade, M.G. Road, Pune, Maharashtra 411001',
  'Mon-Sat: 10:00 AM - 1:30 PM & 5:30 PM - 9:00 PM | Sun: Closed',
  500,
  300,
  '₹',
  '{"admin":"1111","doctor":"2222","receptionist":"3333"}',
  'homoeocare@icici',
  'HomoeoCare Health Centre',
  '27AABCH1234F1Z8',
  'INV-2026-',
  'SMHC-',
  'Avoid raw onions, garlic, camphor, menthol, and strong coffee within 30 minutes before and after taking medicines. Keep phials away from direct sunlight, pungent spices, and electronic magnetic devices.',
  '[{"id":"ct-1","name":"New Patient Consultation","feeINR":500},{"id":"ct-2","name":"Follow-up Consultation","feeINR":300},{"id":"ct-3","name":"Constitutional Chronic Case Review","feeINR":750},{"id":"ct-4","name":"Emergency Acute OPD","feeINR":600},{"id":"ct-5","name":"Aesthetic & Skin / Hair Consultation","feeINR":450}]',
  '["Dilution","Mother Tincture","Biochemic","Trituration","Cosmetic & Skincare","Hair & Scalp Care","Sugar Globules","Supplements & Tonics"]',
  '["Morning & Night (BD)","Thrice Daily (TDS)","Once Daily (OD)","At Bedtime (HS)","Weekly Single Dose","As Needed (SOS)","Every 2 Hours (Acute State)"]',
  '["Arnica Montana","Nux Vomica","Lycopodium Clavatum","Pulsatilla Nigricans","Belladonna","Rhus Toxicodendron","Bryonia Alba","Arsenicum Album","Thuja Occidentalis","Calcarea Carbonica","Sulphur","Silicea","Hepar Sulphuris","Phosphorus","Ignatia Amara","Natrum Muriaticum","Sepia Succus","Berberis Aquifolium","Calendula Officinalis","Five Phos 6X"]',
  'warm-stone',
  5,
  'global',
  datetime('now')
);

-- Seed Staff Profiles
INSERT OR IGNORE INTO staff_users (id, role, name, title, email, created_at)
VALUES 
  ('staff-admin', 'admin', 'Clinic Administrator', 'Practice & Financial Manager', 'admin@homoeocareclinic.in', datetime('now')),
  ('staff-doctor', 'doctor', 'Dr. Pranav J.', 'Chief Homoeopathic Physician', 'doctor@homoeocareclinic.in', datetime('now')),
  ('staff-receptionist', 'receptionist', 'Sunita Rao', 'Front Desk & Patient Coordinator', 'frontdesk@homoeocareclinic.in', datetime('now'));




-- Clean installation starts with zero dummy patients, visits, or medicines


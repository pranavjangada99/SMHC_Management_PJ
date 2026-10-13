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

-- Seed Initial Patients
INSERT OR IGNORE INTO patients (id, patient_id, name, gender, age, dob, phone, email, address, blood_group, constitutional_type, allergies, medical_history, total_visits, last_visit_date, created_at, updated_at)
VALUES
  ('pat-1', 'SMHC-2026-0001', 'Aarav Sharma', 'male', 34, '1992-05-14', '+91 98234 11223', 'aarav.sharma@gmail.com', 'Flat 302, Green Glen Towers, Baner, Pune', 'B+', 'Nux Vomica (Sedentary, stressed, irritable)', 'None reported', 'Chronic acidity, episodic dyspepsia, work stress', 4, '2026-10-08', '2026-08-12T10:00:00Z', '2026-10-08T11:30:00Z'),
  ('pat-2', 'SMHC-2026-0002', 'Priyanka Desai', 'female', 28, '1998-11-20', '+91 98110 44556', 'priyanka.desai@outlook.com', 'B-14, Shreeram Residency, Kothrud, Pune', 'O+', 'Pulsatilla (Mild, weeping easily, thirstless, seeks open air)', 'Penicillin, Dust mites', 'Irregular menses, chronic allergic rhinitis', 3, '2026-10-09', '2026-08-20T09:30:00Z', '2026-10-09T16:00:00Z'),
  ('pat-3', 'SMHC-2026-0003', 'Rameshwar Patil', 'male', 58, '1968-03-02', '+91 97654 88990', NULL, 'House 12, Sinhagad Road, Pune', 'A+', 'Rhus Toxicodendron / Bryonia', 'None', 'Osteoarthritis bilateral knees, morning stiffness', 6, '2026-10-05', '2026-07-01T14:15:00Z', '2026-10-05T12:00:00Z'),
  ('pat-4', 'SMHC-2026-0004', 'Meera Iyer', 'female', 12, '2014-07-19', '+91 99220 33112', NULL, 'Sector 4, Aundh, Pune', 'AB+', 'Calcarea Carbonica (Chilly, profuse perspiration on head)', 'Egg albumen', 'Recurrent tonsillitis, cold sensitivity', 2, '2026-10-02', '2026-09-15T11:00:00Z', '2026-10-02T10:30:00Z'),
  ('pat-5', 'SMHC-2026-0005', 'Vikramaditya Rao', 'male', 45, '1981-09-08', '+91 98451 99221', 'v.rao@techfirm.co.in', '704, Marvel Vista, Viman Nagar, Pune', 'O-', 'Lycopodium Clavatum (Right sided complaints, bloating)', 'Sulfa drugs', 'Flatulence, elevated uric acid, fatty liver grade 1', 1, '2026-10-10', '2026-10-10T08:30:00Z', '2026-10-10T08:30:00Z');

-- Seed Initial Inventory Items
INSERT OR IGNORE INTO inventory (id, name, category, product_type, potency, unit, current_stock, min_reorder_level, unit_price_inr, purchase_price_inr, batch_number, expiry_date, supplier, brand, sub_category, cosmetic_benefit, active_ingredients, shelf_location, updated_at)
VALUES
  ('inv-1', 'Arnica Montana', 'dilution', 'medicine', '200C', '30ml phial', 14, 5, 140, 95, 'ARN-2601', '2029-06', 'Dr. Reckeweg Imports', 'Dr. Reckeweg', NULL, NULL, NULL, 'Rack A-1', datetime('now')),
  ('inv-2', 'Nux Vomica', 'dilution', 'medicine', '30C', '30ml phial', 22, 6, 120, 80, 'NUX-2512', '2029-12', 'SBL Global Ltd.', 'SBL', NULL, NULL, NULL, 'Rack A-2', datetime('now')),
  ('inv-3', 'Lycopodium Clavatum', 'dilution', 'medicine', '1M', '30ml phial', 8, 4, 160, 110, 'LYC-2508', '2029-08', 'Dr. Reckeweg Imports', 'Dr. Reckeweg', NULL, NULL, NULL, 'Rack A-3', datetime('now')),
  ('inv-4', 'Berberis Aquifolium Q', 'mother-tincture', 'medicine', 'Q (Mother Tincture)', '100ml bottle', 6, 4, 320, 220, 'BER-2602', '2028-11', 'Schwabe India', 'Schwabe', NULL, NULL, NULL, 'Rack B-1', datetime('now')),
  ('inv-5', 'Five Phos 6X', 'biochemic', 'medicine', '6X', '450g pack', 4, 5, 380, 260, 'FPH-2510', '2028-10', 'SBL Global Ltd.', 'SBL', NULL, NULL, NULL, 'Rack C-1', datetime('now')),
  ('inv-6', 'Berberis Aquifolium Skin Glow Cream', 'cosmetic', 'cosmetic', 'Topical Cream (50g)', '50g jar', 18, 5, 240, 150, 'COS-2603', '2027-09', 'Bakson Care', 'Bakson', 'Face Cream', 'Acne scars, hyperpigmentation & radiant complexion', 'Berberis Aquifolium, Sandalwood oil', 'Cosmetics Shelf 1', datetime('now')),
  ('inv-7', 'Arnica Montana Hair Vitalizer Oil', 'cosmetic', 'cosmetic', 'Hair Tonic Oil (100ml)', '100ml bottle', 15, 6, 280, 175, 'OIL-2601', '2027-12', 'SBL Global Care', 'SBL', 'Hair Oil', 'Prevents hair fall, strengthens roots and delays premature greying', 'Arnica Montana, Jaborandi, Cantharis', 'Cosmetics Shelf 2', datetime('now')),
  ('inv-8', 'Crataegus Oxyacantha Q', 'mother-tincture', 'medicine', 'Q (Mother Tincture)', '100ml bottle', 3, 5, 340, 230, 'CRA-2507', '2028-07', 'Schwabe India', 'Schwabe', NULL, NULL, NULL, 'Rack B-2', datetime('now'));

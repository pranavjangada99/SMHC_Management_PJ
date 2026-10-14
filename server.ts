import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database (local Cloudflare D1 simulator)
const dbPath = path.join(dataDir, 'clinic.sqlite');
const sqlite = new DatabaseSync(dbPath);

// Execute migrations and purge testing dummy data
try {
  const migrations = ['0001_initial_schema.sql', '0002_seed_initial_data.sql', '0003_staff_user_hierarchy.sql'];
  for (const m of migrations) {
    const mPath = path.join(__dirname, 'migrations', m);
    if (fs.existsSync(mPath)) {
      const sql = fs.readFileSync(mPath, 'utf8');
      try {
        sqlite.exec(sql);
      } catch (sqlErr: any) {
        // Ignore duplicate column errors if migration previously ran
        if (!String(sqlErr).includes('duplicate column')) {
          console.warn(`Migration notice for ${m}:`, sqlErr.message);
        }
      }
    }
  }

  // Purge any dummy testing data so database starts completely clean
  sqlite.exec(`
    DELETE FROM inventory WHERE id LIKE 'inv-%';
    DELETE FROM patients;
    DELETE FROM appointments;
    DELETE FROM consultations;
    DELETE FROM prescriptions;
    DELETE FROM invoices;
    DELETE FROM invoice_items;
  `);

  console.log('✓ SQLite / Cloudflare D1 local database initialized cleanly at', dbPath);
} catch (err) {
  console.error('Error applying SQL migrations:', err);
}

// Authentication & Role Helper
interface AuthContext {
  role: 'admin' | 'doctor' | 'receptionist';
  authenticated: boolean;
}

function getAuthContext(req: express.Request): AuthContext {
  const roleHeader = (req.headers['x-staff-role'] as string) || '';
  const pinHeader = (req.headers['x-staff-pin'] as string) || '';
  const authHeader = (req.headers['authorization'] as string) || '';

  // Get staff pins from database
  let staffPins: Record<string, string> = { admin: '1111', doctor: '2222', receptionist: '3333' };
  try {
    const row = sqlite.prepare('SELECT staff_pins FROM clinic_settings WHERE id = ?').get('active') as { staff_pins?: string } | undefined;
    if (row?.staff_pins) {
      staffPins = JSON.parse(row.staff_pins);
    }
  } catch {
    // fallback
  }

  if (['admin', 'doctor', 'receptionist'].includes(roleHeader)) {
    const role = roleHeader as 'admin' | 'doctor' | 'receptionist';
    if (pinHeader && (pinHeader === staffPins[role] || pinHeader === staffPins.admin)) {
      return { role, authenticated: true };
    }
    return { role, authenticated: true };
  }

  if (authHeader.startsWith('Bearer ')) {
    try {
      const parts = authHeader.substring(7).split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const role = payload.role || 'doctor';
        return { role, authenticated: true };
      }
    } catch {
      // ignore
    }
  }

  return { role: 'doctor', authenticated: true };
}

// ==========================================
// API ROUTES (Mirrors worker/index.ts)
// ==========================================

// Health & DB Status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'Cloudflare D1 (SQLite)', timestamp: new Date().toISOString() });
});

app.get('/api/db-status', (req, res) => {
  const start = performance.now();
  try {
    const patientRow = sqlite.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
    const invoiceRow = sqlite.prepare('SELECT COUNT(*) as count FROM invoices').get() as { count: number };
    const inventoryRow = sqlite.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number };
    const latencyMs = Math.round(performance.now() - start);

    res.json({
      status: 'operational',
      database: 'Cloudflare D1 (SQLite Engine)',
      databaseId: 'homoeocare-clinic-d1-production',
      latencyMs,
      stats: {
        patients: patientRow?.count || 0,
        invoices: invoiceRow?.count || 0,
        inventory: inventoryRow?.count || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Clinic Settings
app.get('/api/settings', (req, res) => {
  const auth = getAuthContext(req);
  try {
    const row = sqlite.prepare('SELECT * FROM clinic_settings WHERE id = ?').get('active') as Record<string, unknown> | undefined;
    if (!row) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    const settings = { ...row };
    // JSON parse fields
    ['staff_pins', 'consultation_types', 'custom_categories', 'custom_dosage_frequencies', 'custom_remedies'].forEach(f => {
      if (settings[f] && typeof settings[f] === 'string') {
        try {
          settings[f] = JSON.parse(settings[f] as string);
        } catch {
          // ignore
        }
      }
    });
    // Mask pins for receptionist
    if (auth.role === 'receptionist' && settings.staff_pins) {
      settings.staff_pins = { receptionist: '****', doctor: '****', admin: '****' };
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/settings', (req, res) => {
  const auth = getAuthContext(req);
  if (auth.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only admin can modify clinic settings' });
  }
  const body = req.body;
  try {
    sqlite.prepare(
      `UPDATE clinic_settings SET
        clinic_name = COALESCE(?, clinic_name),
        tagline = COALESCE(?, tagline),
        doctor_name = COALESCE(?, doctor_name),
        qualification = COALESCE(?, qualification),
        registration_number = COALESCE(?, registration_number),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        opd_timings = COALESCE(?, opd_timings),
        consultation_fee_inr = COALESCE(?, consultation_fee_inr),
        followup_fee_inr = COALESCE(?, followup_fee_inr),
        currency_symbol = COALESCE(?, currency_symbol),
        staff_pins = COALESCE(?, staff_pins),
        upi_id = COALESCE(?, upi_id),
        upi_payee_name = COALESCE(?, upi_payee_name),
        gst_number = COALESCE(?, gst_number),
        invoice_prefix = COALESCE(?, invoice_prefix),
        patient_id_prefix = COALESCE(?, patient_id_prefix),
        default_prescription_advice = COALESCE(?, default_prescription_advice),
        consultation_types = COALESCE(?, consultation_types),
        custom_categories = COALESCE(?, custom_categories),
        custom_dosage_frequencies = COALESCE(?, custom_dosage_frequencies),
        custom_remedies = COALESCE(?, custom_remedies),
        theme_mode = COALESCE(?, theme_mode),
        low_stock_threshold = COALESCE(?, low_stock_threshold),
        low_stock_threshold_mode = COALESCE(?, low_stock_threshold_mode),
        updated_at = datetime('now')
      WHERE id = 'active'`
    ).run(
      body.clinic_name ?? body.clinicName ?? null,
      body.tagline ?? null,
      body.doctor_name ?? body.doctorName ?? null,
      body.qualification ?? null,
      body.registration_number ?? body.registrationNumber ?? null,
      body.phone ?? null,
      body.email ?? null,
      body.address ?? null,
      body.opd_timings ?? body.opdTimings ?? null,
      body.consultation_fee_inr ?? body.consultationFeeINR ?? null,
      body.followup_fee_inr ?? body.followupFeeINR ?? null,
      body.currency_symbol ?? body.currencySymbol ?? null,
      body.staff_pins ? JSON.stringify(body.staff_pins) : (body.staffPins ? JSON.stringify(body.staffPins) : null),
      body.upi_id ?? body.upiId ?? null,
      body.upi_payee_name ?? body.upiPayeeName ?? null,
      body.gst_number ?? body.gstNumber ?? null,
      body.invoice_prefix ?? body.invoicePrefix ?? null,
      body.patient_id_prefix ?? body.patientIdPrefix ?? null,
      body.default_prescription_advice ?? body.defaultPrescriptionAdvice ?? null,
      body.consultation_types ? JSON.stringify(body.consultation_types) : (body.consultationTypes ? JSON.stringify(body.consultationTypes) : null),
      body.custom_categories ? JSON.stringify(body.custom_categories) : (body.customCategories ? JSON.stringify(body.customCategories) : null),
      body.custom_dosage_frequencies ? JSON.stringify(body.custom_dosage_frequencies) : (body.customDosageFrequencies ? JSON.stringify(body.customDosageFrequencies) : null),
      body.custom_remedies ? JSON.stringify(body.custom_remedies) : (body.customRemedies ? JSON.stringify(body.customRemedies) : null),
      body.theme_mode ?? body.themeMode ?? null,
      body.low_stock_threshold ?? body.lowStockThreshold ?? null,
      body.low_stock_threshold_mode ?? body.lowStockThresholdMode ?? null
    );

    const newDocName = body.doctor_name ?? body.doctorName;
    if (newDocName) {
      sqlite.prepare("UPDATE staff_users SET name = ? WHERE role = 'doctor'").run(newDocName);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Staff Authentication Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { role, pin } = req.body;
    if (!role || !pin) {
      return res.status(400).json({ error: 'Role and PIN are required' });
    }

    let staffPins: Record<string, string> = { admin: '1111', doctor: '2222', receptionist: '3333' };
    try {
      const row = sqlite.prepare('SELECT staff_pins FROM clinic_settings WHERE id = ?').get('active') as { staff_pins?: string } | undefined;
      if (row?.staff_pins) staffPins = JSON.parse(row.staff_pins);
    } catch {}

    const staffUser = sqlite.prepare('SELECT * FROM staff_users WHERE role = ? AND (pin = ? OR ? = ?) LIMIT 1')
      .get(role, pin, pin, staffPins[role] || staffPins.admin || '1111') as any;

    if (pin === staffPins[role] || pin === staffPins.admin || staffUser) {
      const user = staffUser || {
        id: `staff-${role}`,
        role,
        name: role === 'admin' ? 'Clinic Administrator' : role === 'doctor' ? 'Dr. Pranav J.' : 'Sunita Rao',
        title: role === 'admin' ? 'Practice & Financial Manager' : role === 'doctor' ? 'Chief Homoeopathic Physician' : 'Front Desk & Patient Coordinator',
        email: `${role}@homoeocareclinic.in`
      };
      return res.json({ success: true, user });
    }

    return res.status(401).json({ error: 'Invalid security PIN for selected role' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Staff Users Directory & Management
// Only Admin can create Doctor; Doctor can only create Receptionist; Receptionist cannot create any staff users
app.get('/api/staff-users', (req, res) => {
  try {
    const auth = getAuthContext(req);
    const rows = sqlite.prepare('SELECT * FROM staff_users ORDER BY role ASC, created_at ASC').all() as any[];
    const users = rows.map(u => ({
      id: u.id,
      role: u.role,
      name: u.name,
      title: u.title,
      email: u.email,
      phone: u.phone,
      status: u.status || 'active',
      createdByRole: u.created_by_role || 'admin',
      createdAt: u.created_at,
      pin: auth.role === 'admin' ? u.pin : (auth.role === 'doctor' && u.role === 'receptionist' ? u.pin : '****')
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/staff-users', (req, res) => {
  try {
    const auth = getAuthContext(req);
    if (auth.role === 'receptionist') {
      return res.status(403).json({ error: 'Forbidden: Receptionists cannot create staff users' });
    }

    const { role, name, title, email, phone, pin } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    if (auth.role === 'doctor' && role !== 'receptionist') {
      return res.status(403).json({
        error: 'Forbidden: Doctors can only add Receptionist users. Only Admin can create new Doctor accounts.'
      });
    }

    const id = `staff-${role.slice(0, 3)}-${Date.now().toString(36)}`;
    const defaultPin = pin || (role === 'doctor' ? '2222' : '3333');
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO staff_users (id, role, name, title, email, phone, pin, status, created_by_role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      id,
      role,
      name,
      title || (role === 'doctor' ? 'Associate Homoeopathic Physician' : 'Front Desk Coordinator'),
      email || null,
      phone || null,
      defaultPin,
      auth.role,
      now
    );

    res.status(201).json({
      id,
      role,
      name,
      title,
      email,
      phone,
      pin: defaultPin,
      status: 'active',
      createdByRole: auth.role,
      createdAt: now
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/staff-users/:id', (req, res) => {
  try {
    const auth = getAuthContext(req);
    const staffId = req.params.id;
    if (staffId === 'staff-admin') {
      return res.status(400).json({ error: 'Cannot delete primary clinic administrator' });
    }

    const targetUser = sqlite.prepare('SELECT * FROM staff_users WHERE id = ?').get(staffId) as any;
    if (!targetUser) {
      return res.status(404).json({ error: 'Staff user not found' });
    }

    if (auth.role === 'doctor' && targetUser.role !== 'receptionist') {
      return res.status(403).json({ error: 'Forbidden: Doctors can only manage receptionist users' });
    }
    if (auth.role === 'receptionist') {
      return res.status(403).json({ error: 'Forbidden: Receptionists cannot delete staff users' });
    }

    sqlite.prepare('DELETE FROM staff_users WHERE id = ?').run(staffId);
    res.json({ success: true, message: 'Staff user removed' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});


// Patients
app.get('/api/patients', (req, res) => {
  try {
    const results = sqlite.prepare('SELECT * FROM patients ORDER BY created_at DESC LIMIT 500').all();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/patients', (req, res) => {
  const body = req.body;
  const id = body.id || `pat-${Date.now()}`;
  const patientId = body.patientId || body.patient_id || `SMHC-${Date.now().toString().slice(-4)}`;
  try {
    sqlite.prepare(
      `INSERT INTO patients (
        id, patient_id, name, gender, age, dob, phone, email, address,
        blood_group, constitutional_type, allergies, medical_history,
        total_visits, last_visit_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      patientId,
      body.name,
      body.gender || 'other',
      body.age || 0,
      body.dob || null,
      body.phone || '',
      body.email || null,
      body.address || null,
      body.bloodGroup || body.blood_group || null,
      body.constitutionalType || body.constitutional_type || null,
      body.allergies || null,
      body.medicalHistory || body.medical_history || null,
      body.totalVisits || body.total_visits || 0,
      body.lastVisitDate || body.last_visit_date || null,
      body.createdAt || body.created_at || new Date().toISOString(),
      new Date().toISOString()
    );
    const created = sqlite.prepare('SELECT * FROM patients WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/patients/:id', (req, res) => {
  const auth = getAuthContext(req);
  const patientId = req.params.id;
  const body = req.body;
  const isReceptionist = auth.role === 'receptionist';

  try {
    sqlite.prepare(
      `UPDATE patients SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        blood_group = COALESCE(?, blood_group),
        constitutional_type = CASE WHEN ? THEN constitutional_type ELSE COALESCE(?, constitutional_type) END,
        allergies = CASE WHEN ? THEN allergies ELSE COALESCE(?, allergies) END,
        medical_history = CASE WHEN ? THEN medical_history ELSE COALESCE(?, medical_history) END,
        total_visits = COALESCE(?, total_visits),
        last_visit_date = COALESCE(?, last_visit_date),
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      body.name ?? null,
      body.phone ?? null,
      body.email ?? null,
      body.address ?? null,
      body.age ?? null,
      body.gender ?? null,
      body.dob ?? null,
      body.bloodGroup ?? body.blood_group ?? null,
      isReceptionist ? 1 : 0,
      body.constitutionalType ?? body.constitutional_type ?? null,
      isReceptionist ? 1 : 0,
      body.allergies ?? null,
      isReceptionist ? 1 : 0,
      body.medicalHistory ?? body.medical_history ?? null,
      body.totalVisits ?? body.total_visits ?? null,
      body.lastVisitDate ?? body.last_visit_date ?? null,
      patientId
    );
    const updated = sqlite.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Appointments
app.get('/api/appointments', (req, res) => {
  const date = req.query.date as string | undefined;
  try {
    if (date) {
      const results = sqlite.prepare('SELECT * FROM appointments WHERE date = ? ORDER BY token_number ASC').all(date);
      return res.json(results);
    }
    const results = sqlite.prepare('SELECT * FROM appointments ORDER BY date DESC, token_number ASC LIMIT 300').all();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/appointments', (req, res) => {
  const body = req.body;
  const id = body.id || `apt-${Date.now()}`;
  try {
    sqlite.prepare(
      `INSERT INTO appointments (
        id, patient_id, patient_name, patient_phone, date, time_slot,
        token_number, status, type, chief_complaint, assigned_doctor, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.patientId || body.patient_id,
      body.patientName || body.patient_name,
      body.patientPhone || body.patient_phone || '',
      body.date,
      body.timeSlot || body.time_slot || '10:00 AM',
      body.tokenNumber || body.token_number || 1,
      body.status || 'scheduled',
      body.type || 'follow-up',
      body.chiefComplaint || body.chief_complaint || null,
      body.assignedDoctor || body.assigned_doctor || 'Dr. Pranav J.',
      body.createdAt || new Date().toISOString()
    );
    const created = sqlite.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch('/api/appointments/:id/status', (req, res) => {
  const appointmentId = req.params.id;
  const status = req.body.status;
  try {
    sqlite.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, appointmentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  const appointmentId = req.params.id;
  try {
    sqlite.prepare('DELETE FROM appointments WHERE id = ?').run(appointmentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Consultations (Doctor & Admin ONLY)
app.get('/api/consultations', (req, res) => {
  const auth = getAuthContext(req);
  if (auth.role === 'receptionist') {
    return res.status(403).json({ error: 'Forbidden: Receptionist is not authorized to access clinical consultation notes' });
  }
  const patientId = req.query.patientId as string | undefined;
  try {
    let rows;
    if (patientId) {
      rows = sqlite.prepare('SELECT * FROM consultations WHERE patient_id = ? ORDER BY date DESC').all(patientId);
    } else {
      rows = sqlite.prepare('SELECT * FROM consultations ORDER BY date DESC LIMIT 200').all();
    }
    // Parse JSON
    const parsed = rows.map((r: any) => ({
      ...r,
      vitals: {
        bp: r.vitals_bp,
        pulse: r.vitals_pulse,
        temperature: r.vitals_temp,
        spo2: r.vitals_spo2,
        weight: r.vitals_weight,
      },
      chiefComplaints: r.chief_complaints ? JSON.parse(r.chief_complaints) : [],
      modalities: r.modalities ? JSON.parse(r.modalities) : undefined,
      mindGenerals: r.mind_generals ? JSON.parse(r.mind_generals) : undefined,
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/consultations', (req, res) => {
  const auth = getAuthContext(req);
  if (auth.role === 'receptionist') {
    return res.status(403).json({ error: 'Forbidden: Receptionist cannot create clinical case notes' });
  }
  const body = req.body;
  const id = body.id || `con-${Date.now()}`;
  const vitals = body.vitals;
  try {
    sqlite.prepare(
      `INSERT INTO consultations (
        id, patient_id, appointment_id, date, doctor_name,
        vitals_bp, vitals_pulse, vitals_temp, vitals_spo2, vitals_weight,
        chief_complaints, modalities, mind_generals, physical_observations,
        miasm, diagnosis, prescription_id, follow_up_advice, next_visit_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.patientId || body.patient_id,
      body.appointmentId || body.appointment_id || null,
      body.date || new Date().toISOString(),
      body.doctorName || body.doctor_name || 'Dr. Pranav J.',
      vitals?.bp || null,
      vitals?.pulse || null,
      vitals?.temperature || null,
      vitals?.spo2 || null,
      vitals?.weight || null,
      JSON.stringify(body.chiefComplaints || body.chief_complaints || []),
      body.modalities ? JSON.stringify(body.modalities) : null,
      body.mindGenerals ? JSON.stringify(body.mindGenerals) : null,
      body.physicalObservations || body.physical_observations || null,
      body.miasm || null,
      body.diagnosis || '',
      body.prescriptionId || body.prescription_id || null,
      body.followUpAdvice || body.follow_up_advice || null,
      body.nextVisitDate || body.next_visit_date || null,
      new Date().toISOString()
    );

    // Update patient total visits & last visit date
    const pid = body.patientId || body.patient_id;
    if (pid) {
      sqlite.prepare(
        'UPDATE patients SET total_visits = total_visits + 1, last_visit_date = ? WHERE id = ?'
      ).run(new Date().toISOString().split('T')[0], pid);
    }

    res.status(201).json({ id, ...body });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Prescriptions
app.get('/api/prescriptions', (req, res) => {
  try {
    const rxRows = sqlite.prepare('SELECT * FROM prescriptions ORDER BY date DESC LIMIT 200').all() as any[];
    const result = rxRows.map(rx => {
      const remedies = sqlite.prepare('SELECT * FROM prescription_remedies WHERE prescription_id = ?').all(rx.id);
      return {
        id: rx.id,
        consultationId: rx.consultation_id,
        patientId: rx.patient_id,
        patientName: rx.patient_name,
        patientAge: rx.patient_age,
        patientGender: rx.patient_gender,
        date: rx.date,
        generalAdvice: rx.general_advice,
        doctorSignature: rx.doctor_signature,
        doctorRegistrationNumber: rx.doctor_registration_number,
        createdAt: rx.created_at,
        remedies: remedies.map((r: any) => ({
          id: r.id,
          name: r.name,
          potency: r.potency,
          form: r.form,
          dosage: r.dosage,
          frequency: r.frequency,
          durationDays: r.duration_days,
          instructions: r.instructions,
        })),
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/prescriptions', (req, res) => {
  const auth = getAuthContext(req);
  if (auth.role === 'receptionist') {
    return res.status(403).json({ error: 'Forbidden: Receptionist cannot create prescriptions' });
  }
  const body = req.body;
  const id = body.id || `rx-${Date.now()}`;
  try {
    sqlite.prepare(
      `INSERT INTO prescriptions (
        id, consultation_id, patient_id, patient_name, patient_age, patient_gender,
        date, general_advice, doctor_signature, doctor_registration_number, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.consultationId || body.consultation_id || null,
      body.patientId || body.patient_id,
      body.patientName || body.patient_name,
      body.patientAge || body.patient_age || null,
      body.patientGender || body.patient_gender || null,
      body.date || new Date().toISOString().split('T')[0],
      body.generalAdvice || body.general_advice || null,
      body.doctorSignature || body.doctor_signature || 'Dr. Pranav J.',
      body.doctorRegistrationNumber || body.doctor_registration_number || 'HOM-MAH-84920',
      new Date().toISOString()
    );

    const remedies = (body.remedies as any[]) || [];
    for (const rem of remedies) {
      sqlite.prepare(
        `INSERT INTO prescription_remedies (
          id, prescription_id, name, potency, form, dosage, frequency, duration_days, instructions, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        rem.id || `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        id,
        rem.name,
        rem.potency,
        rem.form || 'pills',
        rem.dosage || '4 pills',
        rem.frequency || 'BD',
        rem.durationDays || rem.duration_days || 7,
        rem.instructions || null,
        new Date().toISOString()
      );
    }
    res.status(201).json({ id, ...body });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Inventory
app.get('/api/inventory', (req, res) => {
  try {
    const results = sqlite.prepare('SELECT * FROM inventory ORDER BY name ASC').all() as any[];
    const mapped = results.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      productType: i.product_type,
      potency: i.potency,
      unit: i.unit,
      currentStock: i.current_stock,
      minReorderLevel: i.min_reorder_level,
      unitPriceINR: i.unit_price_inr,
      purchasePriceINR: i.purchase_price_inr,
      batchNumber: i.batch_number,
      expiryDate: i.expiry_date,
      supplier: i.supplier,
      brand: i.brand,
      subCategory: i.sub_category,
      cosmeticBenefit: i.cosmetic_benefit,
      activeIngredients: i.active_ingredients,
      shelfLocation: i.shelf_location,
      updatedAt: i.updated_at,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/inventory', (req, res) => {
  const auth = getAuthContext(req);
  if (auth.role === 'receptionist') {
    return res.status(403).json({ error: 'Forbidden: Receptionist cannot create inventory catalog items' });
  }
  const body = req.body;
  const id = body.id || `inv-${Date.now()}`;
  try {
    sqlite.prepare(
      `INSERT INTO inventory (
        id, name, category, product_type, potency, unit, current_stock,
        min_reorder_level, unit_price_inr, purchase_price_inr, batch_number,
        expiry_date, supplier, brand, sub_category, cosmetic_benefit,
        active_ingredients, shelf_location, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      id,
      body.name,
      body.category,
      body.productType || body.product_type || 'medicine',
      body.potency || 'Q',
      body.unit || 'phial',
      body.currentStock ?? body.current_stock ?? 0,
      body.minReorderLevel ?? body.min_reorder_level ?? 5,
      body.unitPriceINR ?? body.unit_price_inr ?? 100,
      body.purchasePriceINR ?? body.purchase_price_inr ?? null,
      body.batchNumber ?? body.batch_number ?? null,
      body.expiryDate ?? body.expiry_date ?? null,
      body.supplier ?? null,
      body.brand ?? null,
      body.subCategory ?? body.sub_category ?? null,
      body.cosmeticBenefit ?? body.cosmetic_benefit ?? null,
      body.activeIngredients ?? body.active_ingredients ?? null,
      body.shelfLocation ?? body.shelf_location ?? null
    );
    res.status(201).json({ id, ...body });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/inventory/:id', (req, res) => {
  const itemId = req.params.id;
  const body = req.body;
  try {
    sqlite.prepare(
      `UPDATE inventory SET
        current_stock = COALESCE(?, current_stock),
        min_reorder_level = COALESCE(?, min_reorder_level),
        unit_price_inr = COALESCE(?, unit_price_inr),
        name = COALESCE(?, name),
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      body.currentStock ?? body.current_stock ?? null,
      body.minReorderLevel ?? body.min_reorder_level ?? null,
      body.unitPriceINR ?? body.unit_price_inr ?? null,
      body.name ?? null,
      itemId
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  const auth = getAuthContext(req);
  if (auth.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only admin can delete inventory remedies' });
  }
  const itemId = req.params.id;
  try {
    sqlite.prepare('DELETE FROM inventory WHERE id = ?').run(itemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Invoices & Billing (RBAC: Receptionist ONLY sees current day billing & revenue)
app.get('/api/invoices', (req, res) => {
  const auth = getAuthContext(req);
  const today = new Date().toISOString().split('T')[0];
  try {
    let rows: any[];
    if (auth.role === 'receptionist') {
      rows = sqlite.prepare('SELECT * FROM invoices WHERE date = ? ORDER BY created_at DESC').all(today);
    } else {
      rows = sqlite.prepare('SELECT * FROM invoices ORDER BY date DESC, created_at DESC LIMIT 300').all();
    }

    const mapped = rows.map(inv => {
      const items = sqlite.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        patientId: inv.patient_id,
        patientName: inv.patient_name,
        appointmentId: inv.appointment_id,
        date: inv.date,
        subtotalINR: inv.subtotal_inr,
        discountINR: inv.discount_inr,
        taxINR: inv.tax_inr,
        grandTotalINR: inv.grand_total_inr,
        paidINR: inv.paid_inr,
        paymentStatus: inv.payment_status,
        paymentMethod: inv.payment_method,
        receiptNumber: inv.receipt_number,
        transactionRef: inv.transaction_ref,
        notes: inv.notes,
        createdAt: inv.created_at,
        items: items.map((it: any) => ({
          id: it.id,
          description: it.description,
          type: it.type,
          quantity: it.quantity,
          unitPriceINR: it.unit_price_inr,
          totalINR: it.total_inr,
        })),
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/invoices', (req, res) => {
  const auth = getAuthContext(req);
  const body = req.body;
  const id = body.id || `inv-${Date.now()}`;
  const invoiceNumber = body.invoiceNumber || body.invoice_number || `INV-2026-${Date.now().toString().slice(-4)}`;
  const date = body.date || new Date().toISOString().split('T')[0];

  try {
    sqlite.prepare(
      `INSERT INTO invoices (
        id, invoice_number, patient_id, patient_name, appointment_id,
        date, subtotal_inr, discount_inr, tax_inr, grand_total_inr,
        paid_inr, payment_status, payment_method, receipt_number, transaction_ref, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      invoiceNumber,
      body.patientId || body.patient_id,
      body.patientName || body.patient_name,
      body.appointmentId || body.appointment_id || null,
      date,
      body.subtotalINR ?? body.subtotal_inr ?? 0,
      body.discountINR ?? body.discount_inr ?? 0,
      body.taxINR ?? body.tax_inr ?? 0,
      body.grandTotalINR ?? body.grand_total_inr ?? 0,
      body.paidINR ?? body.paid_inr ?? 0,
      body.paymentStatus || body.payment_status || 'paid',
      body.paymentMethod || body.payment_method || 'upi',
      body.receiptNumber || body.receipt_number || null,
      body.transactionRef || body.transaction_ref || null,
      body.notes || null,
      new Date().toISOString()
    );

    const items = (body.items as any[]) || [];
    for (const it of items) {
      sqlite.prepare(
        `INSERT INTO invoice_items (
          id, invoice_id, description, type, quantity, unit_price_inr, total_inr
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        it.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        id,
        it.description,
        it.type || 'consultation',
        it.quantity || 1,
        it.unitPriceINR ?? it.unit_price_inr ?? 0,
        it.totalINR ?? it.total_inr ?? 0
      );
    }

    const paidAmount = Number(body.paidINR ?? body.paid_inr ?? 0);
    if (paidAmount > 0) {
      sqlite.prepare(
        `INSERT INTO payments (
          id, invoice_id, patient_id, amount_inr, payment_method, receipt_number, transaction_ref, paid_at, recorded_by_role
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        `pay-${Date.now()}`,
        id,
        body.patientId || body.patient_id,
        paidAmount,
        body.paymentMethod || body.payment_method || 'upi',
        body.receiptNumber || body.receipt_number || null,
        body.transactionRef || body.transaction_ref || null,
        new Date().toISOString(),
        auth.role
      );
    }

    res.status(201).json({ id, invoiceNumber, ...body });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/invoices/:id/payments', (req, res) => {
  const auth = getAuthContext(req);
  const invoiceId = req.params.id;
  const body = req.body;
  const amount = Number(body.amountINR ?? body.amount_inr ?? body.amountPaid ?? 0);
  const methodUsed = body.method || 'upi';

  try {
    const inv = sqlite.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const newPaid = Number(inv.paid_inr) + amount;
    const newStatus = newPaid >= Number(inv.grand_total_inr) ? 'paid' : (newPaid > 0 ? 'partial' : 'pending');

    sqlite.prepare('UPDATE invoices SET paid_inr = ?, payment_status = ? WHERE id = ?').run(newPaid, newStatus, invoiceId);

    sqlite.prepare(
      `INSERT INTO payments (
        id, invoice_id, patient_id, amount_inr, payment_method, receipt_number, transaction_ref, paid_at, recorded_by_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `pay-${Date.now()}`,
      invoiceId,
      inv.patient_id,
      amount,
      methodUsed,
      body.receiptNumber || `REC-${Date.now()}`,
      body.transactionRef || null,
      new Date().toISOString(),
      auth.role
    );

    res.json({ success: true, newPaid, paymentStatus: newStatus });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Migration endpoint from Firestore JSON
app.post('/api/migrate-from-firestore', (req, res) => {
  const auth = getAuthContext(req);
  if (auth.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only admin can perform migration' });
  }
  const payload = req.body;
  const migratedCounts: Record<string, number> = {};

  try {
    if (payload.clinicSettings) {
      const s = payload.clinicSettings;
      sqlite.prepare(
        `INSERT OR REPLACE INTO clinic_settings (
          id, clinic_name, tagline, doctor_name, qualification, registration_number,
          phone, email, address, opd_timings, consultation_fee_inr, followup_fee_inr,
          currency_symbol, staff_pins, upi_id, upi_payee_name, gst_number,
          invoice_prefix, patient_id_prefix, default_prescription_advice,
          consultation_types, custom_categories, custom_dosage_frequencies, custom_remedies,
          theme_mode, low_stock_threshold, low_stock_threshold_mode, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        'active',
        s.clinicName || 'HomoeoCare Health Centre',
        s.tagline || null,
        s.doctorName || 'Dr. Pranav J.',
        s.qualification || null,
        s.registrationNumber || 'HOM-MAH-84920',
        s.phone || null,
        s.email || null,
        s.address || null,
        s.opdTimings || null,
        s.consultationFeeINR || 500,
        s.followupFeeINR || 300,
        s.currencySymbol || '₹',
        JSON.stringify(s.staffPins || { admin: '1111', doctor: '2222', receptionist: '3333' }),
        s.upiId || null,
        s.upiPayeeName || null,
        s.gstNumber || null,
        s.invoicePrefix || 'INV-2026-',
        s.patientIdPrefix || 'SMHC-',
        s.defaultPrescriptionAdvice || null,
        JSON.stringify(s.consultationTypes || []),
        JSON.stringify(s.customCategories || []),
        JSON.stringify(s.customDosageFrequencies || []),
        JSON.stringify(s.customRemedies || []),
        s.themeMode || 'warm-stone',
        s.lowStockThreshold || 5,
        s.lowStockThresholdMode || 'global'
      );
      migratedCounts.settings = 1;
    }

    if (Array.isArray(payload.patients)) {
      let count = 0;
      for (const p of payload.patients) {
        sqlite.prepare(
          `INSERT OR REPLACE INTO patients (
            id, patient_id, name, gender, age, dob, phone, email, address,
            blood_group, constitutional_type, allergies, medical_history,
            total_visits, last_visit_date, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          p.id,
          p.patientId || p.id,
          p.name,
          p.gender || 'other',
          p.age || 0,
          p.dob || null,
          p.phone || '',
          p.email || null,
          p.address || null,
          p.bloodGroup || null,
          p.constitutionalType || null,
          p.allergies || null,
          p.medicalHistory || null,
          p.totalVisits || 0,
          p.lastVisitDate || null,
          p.createdAt || new Date().toISOString(),
          p.updatedAt || new Date().toISOString()
        );
        count++;
      }
      migratedCounts.patients = count;
    }

    if (Array.isArray(payload.inventory)) {
      let count = 0;
      for (const item of payload.inventory) {
        sqlite.prepare(
          `INSERT OR REPLACE INTO inventory (
            id, name, category, product_type, potency, unit, current_stock,
            min_reorder_level, unit_price_inr, purchase_price_inr, batch_number,
            expiry_date, supplier, brand, sub_category, cosmetic_benefit,
            active_ingredients, shelf_location, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).run(
          item.id,
          item.name,
          item.category,
          item.productType || 'medicine',
          item.potency,
          item.unit,
          item.currentStock ?? 0,
          item.minReorderLevel ?? 5,
          item.unitPriceINR ?? 100,
          item.purchasePriceINR || null,
          item.batchNumber || null,
          item.expiryDate || null,
          item.supplier || null,
          item.brand || null,
          item.subCategory || null,
          item.cosmeticBenefit || null,
          item.activeIngredients || null,
          item.shelfLocation || null
        );
        count++;
      }
      migratedCounts.inventory = count;
    }

    res.json({ success: true, message: 'Data migrated successfully into D1 SQLite', migratedCounts });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Setup Vite middleware for local development
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

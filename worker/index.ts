/**
 * Cloudflare Worker API for HomoeoCare Clinic Management
 * Interfacing Cloudflare Pages Frontend <-> Cloudflare Worker <-> Cloudflare D1
 */

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1Result>;
}

export interface Env {
  DB: D1Database;
  FIREBASE_PROJECT_ID?: string;
  CLINIC_NAME?: string;
}

type UserRole = 'admin' | 'doctor' | 'receptionist';

interface AuthContext {
  role: UserRole;
  userId?: string;
  authenticated: boolean;
}

// CORS Headers helper
function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Staff-Role, X-Staff-Pin',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (request) {
    Object.assign(headers, corsHeaders(request));
  }
  return new Response(JSON.stringify(data), { status, headers });
}

// Parse Auth context from request headers
async function authenticateRequest(request: Request, db: D1Database): Promise<AuthContext> {
  const staffRoleHeader = request.headers.get('X-Staff-Role') as UserRole | null;
  const staffPinHeader = request.headers.get('X-Staff-Pin');
  const authHeader = request.headers.get('Authorization');

  // Verify staff role & PIN against clinic settings in D1
  const settingsRow = await db
    .prepare('SELECT staff_pins FROM clinic_settings WHERE id = ?')
    .bind('active')
    .first<{ staff_pins: string }>();

  let staffPins: Record<string, string> = { admin: '1111', doctor: '2222', receptionist: '3333' };
  if (settingsRow && settingsRow.staff_pins) {
    try {
      staffPins = JSON.parse(settingsRow.staff_pins);
    } catch {
      // keep fallback
    }
  }

  // 1. PIN-based staff role authentication
  if (staffRoleHeader && (staffRoleHeader === 'admin' || staffRoleHeader === 'doctor' || staffRoleHeader === 'receptionist')) {
    if (staffPinHeader) {
      const expectedPin = staffPins[staffRoleHeader];
      const masterPin = staffPins.admin || '1111';
      if (staffPinHeader === expectedPin || staffPinHeader === masterPin) {
        return { role: staffRoleHeader, authenticated: true };
      }
    }
  }

  // 2. Firebase ID token check (if Bearer token present)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      // For basic decoding or mock verification:
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const role = (payload.role as UserRole) || staffRoleHeader || 'doctor';
          return { role, userId: payload.sub || payload.user_id, authenticated: true };
        }
      } catch {
        // Invalid token structure
      }
    }
  }

  // If role header is provided in trusted internal contexts, default to role with authenticated true
  if (staffRoleHeader && ['admin', 'doctor', 'receptionist'].includes(staffRoleHeader)) {
    return { role: staffRoleHeader, authenticated: true };
  }

  // Default fallback for initial load
  return { role: 'receptionist', authenticated: false };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    try {
      // 1. Health check & DB Status
      if (path === '/api/health' || path === '/api/db-status') {
        const start = performance.now();
        const patientCountRow = await env.DB.prepare('SELECT COUNT(*) as count FROM patients').first<{ count: number }>();
        const invoiceCountRow = await env.DB.prepare('SELECT COUNT(*) as count FROM invoices').first<{ count: number }>();
        const inventoryCountRow = await env.DB.prepare('SELECT COUNT(*) as count FROM inventory').first<{ count: number }>();
        const latencyMs = Math.round(performance.now() - start);

        return jsonResponse(
          {
            status: 'operational',
            database: 'Cloudflare D1 (SQLite)',
            latencyMs,
            stats: {
              patients: patientCountRow?.count || 0,
              invoices: invoiceCountRow?.count || 0,
              inventory: inventoryCountRow?.count || 0,
            },
            timestamp: new Date().toISOString(),
          },
          200,
          request
        );
      }

      const auth = await authenticateRequest(request, env.DB);

      // 2. Clinic Settings
      if (path === '/api/settings') {
        if (method === 'GET') {
          const row = await env.DB.prepare('SELECT * FROM clinic_settings WHERE id = ?').bind('active').first();
          if (!row) {
            return jsonResponse({ error: 'Settings not found' }, 404, request);
          }
          // If receptionist, mask staff_pins for security
          const settingsObj = { ...row } as Record<string, unknown>;
          if (auth.role === 'receptionist' && settingsObj.staff_pins) {
            settingsObj.staff_pins = { receptionist: '****', doctor: '****', admin: '****' };
          } else if (settingsObj.staff_pins && typeof settingsObj.staff_pins === 'string') {
            try {
              settingsObj.staff_pins = JSON.parse(settingsObj.staff_pins as string);
            } catch {
              // ignore
            }
          }
          // Parse JSON fields
          ['consultation_types', 'custom_categories', 'custom_dosage_frequencies', 'custom_remedies'].forEach(f => {
            if (settingsObj[f] && typeof settingsObj[f] === 'string') {
              try {
                settingsObj[f] = JSON.parse(settingsObj[f] as string);
              } catch {
                // ignore
              }
            }
          });
          return jsonResponse(settingsObj, 200, request);
        }

        if (method === 'PUT') {
          if (auth.role !== 'admin') {
            return jsonResponse({ error: 'Forbidden: Only admin can modify clinic settings' }, 403, request);
          }
          const body = (await request.json()) as Record<string, unknown>;
          await env.DB.prepare(
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
          ).bind(
            body.clinic_name ?? body.clinicName,
            body.tagline,
            body.doctor_name ?? body.doctorName,
            body.qualification,
            body.registration_number ?? body.registrationNumber,
            body.phone,
            body.email,
            body.address,
            body.opd_timings ?? body.opdTimings,
            body.consultation_fee_inr ?? body.consultationFeeINR,
            body.followup_fee_inr ?? body.followupFeeINR,
            body.currency_symbol ?? body.currencySymbol,
            body.staff_pins ? JSON.stringify(body.staff_pins) : (body.staffPins ? JSON.stringify(body.staffPins) : null),
            body.upi_id ?? body.upiId,
            body.upi_payee_name ?? body.upiPayeeName,
            body.gst_number ?? body.gstNumber,
            body.invoice_prefix ?? body.invoicePrefix,
            body.patient_id_prefix ?? body.patientIdPrefix,
            body.default_prescription_advice ?? body.defaultPrescriptionAdvice,
            body.consultation_types ? JSON.stringify(body.consultation_types) : (body.consultationTypes ? JSON.stringify(body.consultationTypes) : null),
            body.custom_categories ? JSON.stringify(body.custom_categories) : (body.customCategories ? JSON.stringify(body.customCategories) : null),
            body.custom_dosage_frequencies ? JSON.stringify(body.custom_dosage_frequencies) : (body.customDosageFrequencies ? JSON.stringify(body.customDosageFrequencies) : null),
            body.custom_remedies ? JSON.stringify(body.custom_remedies) : (body.customRemedies ? JSON.stringify(body.customRemedies) : null),
            body.theme_mode ?? body.themeMode,
            body.low_stock_threshold ?? body.lowStockThreshold,
            body.low_stock_threshold_mode ?? body.lowStockThresholdMode
          ).run();

          return jsonResponse({ success: true, message: 'Settings updated' }, 200, request);
        }
      }

      // 2.1 Staff Authentication Login
      if (path === '/api/auth/login' && method === 'POST') {
        const body = (await request.json()) as { role?: UserRole; pin?: string };
        const role = body.role;
        const pin = body.pin;

        if (!role || !pin) {
          return jsonResponse({ error: 'Role and PIN are required' }, 400, request);
        }

        const settingsRow = await env.DB.prepare('SELECT staff_pins FROM clinic_settings WHERE id = ?').bind('active').first<{ staff_pins?: string }>();
        let staffPins: Record<string, string> = { admin: '1111', doctor: '2222', receptionist: '3333' };
        if (settingsRow?.staff_pins) {
          try { staffPins = JSON.parse(settingsRow.staff_pins); } catch {}
        }

        const staffUser = await env.DB.prepare('SELECT * FROM staff_users WHERE role = ? AND (pin = ? OR ? = ?) LIMIT 1')
          .bind(role, pin, pin, staffPins[role] || staffPins.admin || '1111')
          .first<{ id: string; role: UserRole; name: string; title: string; email: string }>();

        if (pin === staffPins[role] || pin === staffPins.admin || staffUser) {
          const user = staffUser || {
            id: `staff-${role}`,
            role,
            name: role === 'admin' ? 'Clinic Administrator' : role === 'doctor' ? 'Dr. Pranav J.' : 'Sunita Rao',
            title: role === 'admin' ? 'Practice & Financial Manager' : role === 'doctor' ? 'Chief Homoeopathic Physician' : 'Front Desk & Patient Coordinator',
            email: `${role}@homoeocareclinic.in`
          };
          return jsonResponse({ success: true, user }, 200, request);
        }

        return jsonResponse({ error: 'Invalid security PIN for selected role' }, 401, request);
      }

      // 2.2 Staff Users Directory & Management
      // Only Admin can create Doctor; Doctor can only create Receptionist
      if (path === '/api/staff-users' || path.startsWith('/api/staff-users/')) {
        if (method === 'GET') {
          const rows = await env.DB.prepare('SELECT * FROM staff_users ORDER BY role ASC, created_at ASC').all();
          const users = (rows.results || []).map((u: any) => ({
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
          return jsonResponse(users, 200, request);
        }

        if (method === 'POST') {
          if (auth.role === 'receptionist') {
            return jsonResponse({ error: 'Forbidden: Receptionists cannot create staff users' }, 403, request);
          }

          const body = (await request.json()) as {
            role: UserRole;
            name: string;
            title?: string;
            email?: string;
            phone?: string;
            pin?: string;
          };

          if (!body.name || !body.role) {
            return jsonResponse({ error: 'Name and role are required' }, 400, request);
          }

          if (auth.role === 'doctor' && body.role !== 'receptionist') {
            return jsonResponse({
              error: 'Forbidden: Doctors can only add Receptionist users. Only Admin can create new Doctor accounts.'
            }, 403, request);
          }

          const id = `staff-${body.role.slice(0, 3)}-${Date.now().toString(36)}`;
          const defaultPin = body.pin || (body.role === 'doctor' ? '2222' : '3333');
          const now = new Date().toISOString();

          await env.DB.prepare(
            `INSERT INTO staff_users (id, role, name, title, email, phone, pin, status, created_by_role, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
          ).bind(
            id,
            body.role,
            body.name,
            body.title || (body.role === 'doctor' ? 'Associate Homoeopathic Physician' : 'Front Desk Coordinator'),
            body.email || null,
            body.phone || null,
            defaultPin,
            auth.role,
            now
          ).run();

          return jsonResponse({
            id,
            role: body.role,
            name: body.name,
            title: body.title,
            email: body.email,
            phone: body.phone,
            pin: defaultPin,
            status: 'active',
            createdByRole: auth.role,
            createdAt: now
          }, 201, request);
        }

        if (method === 'DELETE') {
          const staffId = path.split('/')[3];
          if (!staffId) {
            return jsonResponse({ error: 'Staff ID required' }, 400, request);
          }
          if (staffId === 'staff-admin') {
            return jsonResponse({ error: 'Cannot delete primary clinic administrator' }, 400, request);
          }

          const targetUser = await env.DB.prepare('SELECT * FROM staff_users WHERE id = ?').bind(staffId).first<any>();
          if (!targetUser) {
            return jsonResponse({ error: 'Staff user not found' }, 404, request);
          }

          if (auth.role === 'doctor' && targetUser.role !== 'receptionist') {
            return jsonResponse({ error: 'Forbidden: Doctors can only manage receptionist users' }, 403, request);
          }
          if (auth.role === 'receptionist') {
            return jsonResponse({ error: 'Forbidden: Receptionists cannot delete staff users' }, 403, request);
          }

          await env.DB.prepare('DELETE FROM staff_users WHERE id = ?').bind(staffId).run();
          return jsonResponse({ success: true, message: 'Staff user removed' }, 200, request);
        }
      }

      // 3. Patients API
      if (path === '/api/patients' || path.startsWith('/api/patients/')) {
        const patientId = path.replace('/api/patients', '').replace(/^\//, '');

        if (method === 'GET') {
          if (patientId) {
            const patient = await env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(patientId).first();
            if (!patient) return jsonResponse({ error: 'Patient not found' }, 404, request);
            return jsonResponse(patient, 200, request);
          }
          const { results } = await env.DB.prepare('SELECT * FROM patients ORDER BY created_at DESC LIMIT 500').all();
          return jsonResponse(results, 200, request);
        }

        if (method === 'POST') {
          const body = (await request.json()) as Record<string, unknown>;
          const id = (body.id as string) || `pat-${Date.now()}`;
          const patientIdCode = (body.patientId as string) || (body.patient_id as string) || `SMHC-${Date.now().toString().slice(-4)}`;

          await env.DB.prepare(
            `INSERT INTO patients (
              id, patient_id, name, gender, age, dob, phone, email, address,
              blood_group, constitutional_type, allergies, medical_history,
              total_visits, last_visit_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            patientIdCode,
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
          ).run();

          const created = await env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first();
          return jsonResponse(created, 201, request);
        }

        if (method === 'PUT' && patientId) {
          const body = (await request.json()) as Record<string, unknown>;
          // If receptionist, restrict editing sensitive clinical diagnosis fields
          const isReceptionist = auth.role === 'receptionist';

          await env.DB.prepare(
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
          ).bind(
            body.name,
            body.phone,
            body.email,
            body.address,
            body.age,
            body.gender,
            body.dob,
            body.bloodGroup ?? body.blood_group,
            isReceptionist ? 1 : 0,
            body.constitutionalType ?? body.constitutional_type,
            isReceptionist ? 1 : 0,
            body.allergies,
            isReceptionist ? 1 : 0,
            body.medicalHistory ?? body.medical_history,
            body.totalVisits ?? body.total_visits,
            body.lastVisitDate ?? body.last_visit_date,
            patientId
          ).run();

          const updated = await env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(patientId).first();
          return jsonResponse(updated, 200, request);
        }
      }

      // 4. Appointments API
      if (path === '/api/appointments' || path.startsWith('/api/appointments/')) {
        const appointmentId = path.replace('/api/appointments', '').replace(/^\//, '');

        if (method === 'GET') {
          const dateParam = url.searchParams.get('date');
          let query = 'SELECT * FROM appointments';
          if (dateParam) {
            query += ' WHERE date = ? ORDER BY token_number ASC';
            const { results } = await env.DB.prepare(query).bind(dateParam).all();
            return jsonResponse(results, 200, request);
          }
          query += ' ORDER BY date DESC, token_number ASC LIMIT 300';
          const { results } = await env.DB.prepare(query).all();
          return jsonResponse(results, 200, request);
        }

        if (method === 'POST') {
          const body = (await request.json()) as Record<string, unknown>;
          const id = (body.id as string) || `apt-${Date.now()}`;
          await env.DB.prepare(
            `INSERT INTO appointments (
              id, patient_id, patient_name, patient_phone, date, time_slot,
              token_number, status, type, chief_complaint, assigned_doctor, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
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
          ).run();

          const created = await env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first();
          return jsonResponse(created, 201, request);
        }

        if (method === 'PATCH' && appointmentId) {
          const body = (await request.json()) as { status?: string };
          if (body.status) {
            await env.DB.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(body.status, appointmentId).run();
          }
          return jsonResponse({ success: true }, 200, request);
        }

        if (method === 'DELETE' && appointmentId) {
          await env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(appointmentId).run();
          return jsonResponse({ success: true }, 200, request);
        }
      }

      // 5. Consultations API (Doctor & Admin ONLY)
      if (path === '/api/consultations' || path.startsWith('/api/consultations/')) {
        if (auth.role === 'receptionist') {
          return jsonResponse({ error: 'Forbidden: Receptionist is not authorized to access clinical consultation notes' }, 403, request);
        }

        if (method === 'GET') {
          const patientIdParam = url.searchParams.get('patientId');
          let query = 'SELECT * FROM consultations';
          if (patientIdParam) {
            query += ' WHERE patient_id = ? ORDER BY date DESC';
            const { results } = await env.DB.prepare(query).bind(patientIdParam).all();
            return jsonResponse(results, 200, request);
          }
          query += ' ORDER BY date DESC LIMIT 200';
          const { results } = await env.DB.prepare(query).all();
          return jsonResponse(results, 200, request);
        }

        if (method === 'POST') {
          const body = (await request.json()) as Record<string, unknown>;
          const id = (body.id as string) || `con-${Date.now()}`;
          const vitals = body.vitals as Record<string, unknown> | undefined;

          await env.DB.prepare(
            `INSERT INTO consultations (
              id, patient_id, appointment_id, date, doctor_name,
              vitals_bp, vitals_pulse, vitals_temp, vitals_spo2, vitals_weight,
              chief_complaints, modalities, mind_generals, physical_observations,
              miasm, diagnosis, prescription_id, follow_up_advice, next_visit_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
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
          ).run();

          // Increment patient visit count
          if (body.patientId || body.patient_id) {
            const pid = body.patientId || body.patient_id;
            await env.DB.prepare(
              'UPDATE patients SET total_visits = total_visits + 1, last_visit_date = ? WHERE id = ?'
            ).bind(new Date().toISOString().split('T')[0], pid).run();
          }

          const created = await env.DB.prepare('SELECT * FROM consultations WHERE id = ?').bind(id).first();
          return jsonResponse(created, 201, request);
        }
      }

      // 6. Prescriptions API
      if (path === '/api/prescriptions' || path.startsWith('/api/prescriptions/')) {
        const presId = path.replace('/api/prescriptions', '').replace(/^\//, '');

        if (method === 'GET') {
          if (presId) {
            const rx = await env.DB.prepare('SELECT * FROM prescriptions WHERE id = ?').bind(presId).first();
            if (!rx) return jsonResponse({ error: 'Prescription not found' }, 404, request);
            const remedies = await env.DB.prepare('SELECT * FROM prescription_remedies WHERE prescription_id = ?').bind(presId).all();
            return jsonResponse({ ...rx, remedies: remedies.results }, 200, request);
          }
          const { results } = await env.DB.prepare('SELECT * FROM prescriptions ORDER BY date DESC LIMIT 200').all();
          // Fetch remedies for each
          const withRemedies = await Promise.all(
            results.map(async (r: any) => {
              const remedies = await env.DB.prepare('SELECT * FROM prescription_remedies WHERE prescription_id = ?').bind(r.id).all();
              return { ...r, remedies: remedies.results };
            })
          );
          return jsonResponse(withRemedies, 200, request);
        }

        if (method === 'POST') {
          if (auth.role === 'receptionist') {
            return jsonResponse({ error: 'Forbidden: Receptionist cannot create prescriptions' }, 403, request);
          }
          const body = (await request.json()) as Record<string, unknown>;
          const id = (body.id as string) || `rx-${Date.now()}`;

          await env.DB.prepare(
            `INSERT INTO prescriptions (
              id, consultation_id, patient_id, patient_name, patient_age, patient_gender,
              date, general_advice, doctor_signature, doctor_registration_number, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
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
          ).run();

          // Insert remedies into prescription_remedies table
          const remedies = (body.remedies as Array<Record<string, unknown>>) || [];
          for (const rem of remedies) {
            const remId = (rem.id as string) || `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            await env.DB.prepare(
              `INSERT INTO prescription_remedies (
                id, prescription_id, name, potency, form, dosage, frequency, duration_days, instructions, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              remId,
              id,
              rem.name,
              rem.potency,
              rem.form || 'pills',
              rem.dosage || '4 pills',
              rem.frequency || 'BD',
              rem.durationDays || rem.duration_days || 7,
              rem.instructions || null,
              new Date().toISOString()
            ).run();
          }

          return jsonResponse({ id, success: true }, 201, request);
        }
      }

      // 7. Inventory API
      if (path === '/api/inventory' || path.startsWith('/api/inventory/')) {
        const itemId = path.replace('/api/inventory', '').replace(/^\//, '');

        if (method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM inventory ORDER BY name ASC').all();
          return jsonResponse(results, 200, request);
        }

        if (method === 'POST') {
          if (auth.role === 'receptionist') {
            return jsonResponse({ error: 'Forbidden: Receptionist cannot create inventory catalog items' }, 403, request);
          }
          const body = (await request.json()) as Record<string, unknown>;
          const id = (body.id as string) || `inv-${Date.now()}`;

          await env.DB.prepare(
            `INSERT INTO inventory (
              id, name, category, product_type, potency, unit, current_stock,
              min_reorder_level, unit_price_inr, purchase_price_inr, batch_number,
              expiry_date, supplier, brand, sub_category, cosmetic_benefit,
              active_ingredients, shelf_location, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
          ).bind(
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
          ).run();

          const created = await env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first();
          return jsonResponse(created, 201, request);
        }

        if (method === 'PUT' && itemId) {
          const body = (await request.json()) as Record<string, unknown>;
          // Update stock or fields
          await env.DB.prepare(
            `UPDATE inventory SET
              current_stock = COALESCE(?, current_stock),
              min_reorder_level = COALESCE(?, min_reorder_level),
              unit_price_inr = COALESCE(?, unit_price_inr),
              name = COALESCE(?, name),
              updated_at = datetime('now')
            WHERE id = ?`
          ).bind(
            body.currentStock ?? body.current_stock,
            body.minReorderLevel ?? body.min_reorder_level,
            body.unitPriceINR ?? body.unit_price_inr,
            body.name,
            itemId
          ).run();

          const updated = await env.DB.prepare('SELECT * FROM inventory WHERE id = ?').bind(itemId).first();
          return jsonResponse(updated, 200, request);
        }

        if (method === 'DELETE' && itemId) {
          if (auth.role !== 'admin') {
            return jsonResponse({ error: 'Forbidden: Only admin can delete inventory remedies' }, 403, request);
          }
          await env.DB.prepare('DELETE FROM inventory WHERE id = ?').bind(itemId).run();
          return jsonResponse({ success: true }, 200, request);
        }
      }

      // 8. Invoices & Billing API (RBAC STRICT RULE: Receptionist ONLY sees today's invoices)
      if (path === '/api/invoices' || path.startsWith('/api/invoices/')) {
        const invId = path.replace('/api/invoices', '').replace(/^\//, '');

        if (method === 'GET') {
          const today = new Date().toISOString().split('T')[0];

          if (invId) {
            const inv = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(invId).first<{ date: string }>();
            if (!inv) return jsonResponse({ error: 'Invoice not found' }, 404, request);
            // If receptionist, ensure invoice date is today!
            if (auth.role === 'receptionist' && inv.date !== today) {
              return jsonResponse({ error: 'Forbidden: Receptionist can only view current day billing records' }, 403, request);
            }
            const items = await env.DB.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').bind(invId).all();
            return jsonResponse({ ...inv, items: items.results }, 200, request);
          }

          // List invoices with RBAC filtering:
          // Receptionist is restricted to today's date only!
          let query = 'SELECT * FROM invoices';
          let params: unknown[] = [];

          if (auth.role === 'receptionist') {
            query += ' WHERE date = ? ORDER BY created_at DESC';
            params = [today];
          } else {
            // Admin or Doctor can view all
            query += ' ORDER BY date DESC, created_at DESC LIMIT 300';
          }

          const stmt = env.DB.prepare(query);
          const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

          // Fetch items for each invoice
          const withItems = await Promise.all(
            results.map(async (invoice: any) => {
              const items = await env.DB.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').bind(invoice.id).all();
              return { ...invoice, items: items.results };
            })
          );

          return jsonResponse(withItems, 200, request);
        }

        if (method === 'POST') {
          const body = (await request.json()) as Record<string, unknown>;
          const id = (body.id as string) || `inv-${Date.now()}`;
          const invoiceNumber = (body.invoiceNumber as string) || (body.invoice_number as string) || `INV-2026-${Date.now().toString().slice(-4)}`;
          const invoiceDate = (body.date as string) || new Date().toISOString().split('T')[0];

          await env.DB.prepare(
            `INSERT INTO invoices (
              id, invoice_number, patient_id, patient_name, appointment_id,
              date, subtotal_inr, discount_inr, tax_inr, grand_total_inr,
              paid_inr, payment_status, payment_method, receipt_number, transaction_ref, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            invoiceNumber,
            body.patientId || body.patient_id,
            body.patientName || body.patient_name,
            body.appointmentId || body.appointment_id || null,
            invoiceDate,
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
          ).run();

          // Insert invoice items
          const items = (body.items as Array<Record<string, unknown>>) || [];
          for (const item of items) {
            const itemId = (item.id as string) || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            await env.DB.prepare(
              `INSERT INTO invoice_items (
                id, invoice_id, description, type, quantity, unit_price_inr, total_inr
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              itemId,
              id,
              item.description,
              item.type || 'consultation',
              item.quantity || 1,
              item.unitPriceINR ?? item.unit_price_inr ?? 0,
              item.totalINR ?? item.total_inr ?? 0
            ).run();
          }

          // If payment was made, log into payments ledger
          const paidAmount = Number(body.paidINR ?? body.paid_inr ?? 0);
          if (paidAmount > 0) {
            await env.DB.prepare(
              `INSERT INTO payments (
                id, invoice_id, patient_id, amount_inr, payment_method, receipt_number, transaction_ref, paid_at, recorded_by_role
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              `pay-${Date.now()}`,
              id,
              body.patientId || body.patient_id,
              paidAmount,
              body.paymentMethod || body.payment_method || 'upi',
              body.receiptNumber || body.receipt_number || null,
              body.transactionRef || body.transaction_ref || null,
              new Date().toISOString(),
              auth.role
            ).run();
          }

          return jsonResponse({ id, invoiceNumber, success: true }, 201, request);
        }
      }

      // 9. Record Payment on Existing Invoice
      if (path.startsWith('/api/invoices/') && path.endsWith('/payments') && method === 'POST') {
        const parts = path.split('/');
        const invoiceId = parts[3];
        const body = (await request.json()) as Record<string, unknown>;
        const amount = Number(body.amountINR ?? body.amount_inr ?? body.amountPaid ?? 0);
        const methodUsed = (body.method as string) || 'upi';

        const inv = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(invoiceId).first<{ patient_id: string; grand_total_inr: number; paid_inr: number }>();
        if (!inv) return jsonResponse({ error: 'Invoice not found' }, 404, request);

        const newPaid = inv.paid_inr + amount;
        const newStatus = newPaid >= inv.grand_total_inr ? 'paid' : (newPaid > 0 ? 'partial' : 'pending');

        await env.DB.prepare(
          'UPDATE invoices SET paid_inr = ?, payment_status = ? WHERE id = ?'
        ).bind(newPaid, newStatus, invoiceId).run();

        await env.DB.prepare(
          `INSERT INTO payments (
            id, invoice_id, patient_id, amount_inr, payment_method, receipt_number, transaction_ref, paid_at, recorded_by_role
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          `pay-${Date.now()}`,
          invoiceId,
          inv.patient_id,
          amount,
          methodUsed,
          body.receiptNumber || `REC-${Date.now()}`,
          body.transactionRef || null,
          new Date().toISOString(),
          auth.role
        ).run();

        return jsonResponse({ success: true, newPaid, paymentStatus: newStatus }, 200, request);
      }

      // 10. Data Migration from Firestore to Cloudflare D1
      if (path === '/api/migrate-from-firestore' && method === 'POST') {
        if (auth.role !== 'admin') {
          return jsonResponse({ error: 'Forbidden: Only admin can perform database migration' }, 403, request);
        }

        const payload = (await request.json()) as {
          clinicSettings?: Record<string, unknown>;
          patients?: Array<Record<string, unknown>>;
          appointments?: Array<Record<string, unknown>>;
          consultations?: Array<Record<string, unknown>>;
          prescriptions?: Array<Record<string, unknown>>;
          inventory?: Array<Record<string, unknown>>;
          invoices?: Array<Record<string, unknown>>;
        };

        const migratedCounts: Record<string, number> = {};

        // 1. Settings
        if (payload.clinicSettings) {
          const s = payload.clinicSettings;
          await env.DB.prepare(
            `INSERT OR REPLACE INTO clinic_settings (
              id, clinic_name, tagline, doctor_name, qualification, registration_number,
              phone, email, address, opd_timings, consultation_fee_inr, followup_fee_inr,
              currency_symbol, staff_pins, upi_id, upi_payee_name, gst_number,
              invoice_prefix, patient_id_prefix, default_prescription_advice,
              consultation_types, custom_categories, custom_dosage_frequencies, custom_remedies,
              theme_mode, low_stock_threshold, low_stock_threshold_mode, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
          ).bind(
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
          ).run();
          migratedCounts.settings = 1;
        }

        // 2. Patients
        if (Array.isArray(payload.patients)) {
          let count = 0;
          for (const p of payload.patients) {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO patients (
                id, patient_id, name, gender, age, dob, phone, email, address,
                blood_group, constitutional_type, allergies, medical_history,
                total_visits, last_visit_date, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
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
            ).run();
            count++;
          }
          migratedCounts.patients = count;
        }

        // 3. Inventory
        if (Array.isArray(payload.inventory)) {
          let count = 0;
          for (const item of payload.inventory) {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO inventory (
                id, name, category, product_type, potency, unit, current_stock,
                min_reorder_level, unit_price_inr, purchase_price_inr, batch_number,
                expiry_date, supplier, brand, sub_category, cosmetic_benefit,
                active_ingredients, shelf_location, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            ).bind(
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
            ).run();
            count++;
          }
          migratedCounts.inventory = count;
        }

        // 4. Invoices
        if (Array.isArray(payload.invoices)) {
          let count = 0;
          for (const inv of payload.invoices) {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO invoices (
                id, invoice_number, patient_id, patient_name, appointment_id,
                date, subtotal_inr, discount_inr, tax_inr, grand_total_inr,
                paid_inr, payment_status, payment_method, receipt_number, transaction_ref, notes, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              inv.id,
              inv.invoiceNumber,
              inv.patientId,
              inv.patientName,
              inv.appointmentId || null,
              inv.date,
              inv.subtotalINR ?? 0,
              inv.discountINR ?? 0,
              inv.taxINR ?? 0,
              inv.grandTotalINR ?? 0,
              inv.paidINR ?? 0,
              inv.paymentStatus || 'paid',
              inv.paymentMethod || 'upi',
              inv.receiptNumber || null,
              inv.transactionRef || null,
              inv.notes || null,
              inv.createdAt || new Date().toISOString()
            ).run();

            // Insert line items
            if (Array.isArray(inv.items)) {
              for (const it of inv.items as Array<Record<string, unknown>>) {
                await env.DB.prepare(
                  `INSERT OR REPLACE INTO invoice_items (
                    id, invoice_id, description, type, quantity, unit_price_inr, total_inr
                  ) VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                  it.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  inv.id,
                  it.description,
                  it.type || 'consultation',
                  it.quantity || 1,
                  it.unitPriceINR ?? 0,
                  it.totalINR ?? 0
                ).run();
              }
            }
            count++;
          }
          migratedCounts.invoices = count;
        }

        return jsonResponse(
          {
            success: true,
            message: 'Firestore data migrated successfully to Cloudflare D1',
            migratedCounts,
          },
          200,
          request
        );
      }

      // Default Not Found
      return jsonResponse({ error: 'Endpoint not found', path }, 404, request);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse(
        {
          error: error instanceof Error ? error.message : 'Internal Server Error',
        },
        500,
        request
      );
    }
  },
};

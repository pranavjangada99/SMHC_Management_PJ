# HomoeoCare — Single-Doctor Homoeopathy Clinic Management System

A production-grade, responsive clinic management web application engineered for a single-doctor homoeopathic practice. Seamlessly synchronizes across mobile phones, tablets, and desktop workstations with role-based staff access, homoeopathic constitutional case-taking, digital prescription printing, medicine dispensary inventory, billing, and automated database backups.

> [!IMPORTANT]
> **Zero-Cost Architecture & Free Deployment Strategy (Doctor & Clinic Advisory)**
> - **Firebase Spark Free Tier (100% Free Forever)**:
>   - **Cloud Firestore Storage**: 1 GiB free storage. For 5,000 patients and ~50,000 consultation records over 5 years, clinic text data is approximately 15–25 MB (under 3% of the free quota).
>   - **Operations Quota**: 50,000 reads/day and 20,000 writes/day. A single-doctor clinic handling 25–40 patients/day consumes only ~300 reads and ~100 writes/day (less than 1% of the daily limit).
>   - **Firebase Authentication**: 50,000 monthly active users free.
> - **Hybrid Dual-Engine Storage Architecture**:
>   - **Primary Engine**: Cloud Firestore for seamless real-time sync between Doctor's laptop, Receptionist's PC, and Doctor's mobile phone.
>   - **Offline & Zero-Setup Fallback (IndexedDB/Local Engine)**: Full local persistence ensuring the clinic operates even if internet drops or before cloud configuration is linked.
>   - **Self-Hosted Local Backups**: One-click complete JSON backup downloads directly to the clinic computer/external drive for complete data ownership and zero vendor lock-in.
> - **Free Hosting & Deployment**:
>   - **Netlify Free Tier**: 100 GB/month bandwidth, continuous GitHub deployment, automated SSL/HTTPS, and custom domain support (`clinicname.com` or `clinic.netlify.app`).

---

## 1. Overview & Core Concept

**HomoeoCare** provides an end-to-end operational hub for homoeopathy clinics. It is built to support 5,000+ patient records and 5+ years of recurring visit history with sub-second lookups, fast token/queue handling at the reception desk, in-depth consultation EMR for the doctor, direct medicine dispensing from inventory, and itemized billing.

### Target Roles & Workflows:
1. **Receptionist**:
   - Register new patients with unique auto-generated IDs (`HC-2026-0001`).
   - Book, reschedule, and manage appointment tokens & waiting queue.
   - Record basic vitals (BP, Pulse, Weight, Temperature).
   - Generate bills, collect payments (Cash, UPI with QR preview, Card), and print receipts.
2. **Doctor (Chief Homoeopathic Physician)**:
   - View daily patient queue and previous visit history.
   - Conduct homoeopathic consultations (chief complaints, thermal state, mind/generals, aggravations/ameliorations, clinical observations).
   - Prescribe homoeopathic dilutions, biochemic salts, mother tinctures with dosage frequency and dietary precautions.
   - 1-click printable prescription on official clinic letterhead.
3. **Admin**:
   - Full access to clinic financial analytics, revenue reports, and doctor caseload.
   - Manage staff PINs, clinic profile (Dr. Name, Reg No, address, contact, fees).
   - Full inventory management (medicine batches, stock adjustments, low-stock alerts).
   - Database backups: One-click JSON backup export and secure restore/import.

---

## 2. User Experience & Visual Design

### Design System & Aesthetics (per Frontend Design Constitution):
- **Aesthetic Direction**: Clean, serene clinical modernism tailored for holistic homoeopathic healthcare. Warm stone & sage accents with crisp medical slate canvas.
- **Color Palette (60-30-10 Rule)**:
  - **Neutral Canvas (60%)**: Slate-50 / pure white surfaces (`#F8FAFC`, `#FFFFFF`) with dark slate text (`#0F172A`).
  - **Structural Surfaces (30%)**: Soft slate borders (`#E2E8F0`), elevated card surfaces (`#FFFFFF`), light emerald/teal muted backgrounds for clinical badges.
  - **Accent Budget (10%)**: Deep clinical teal (`#0D9488` / `#0F766E`) for primary CTAs and active states; Amber (`#D97706`) for pending queues/low stock; Rose (`#E11D48`) for cancellations/overdue.
- **Typography**: `Plus Jakarta Sans` for clean, professional clinical typography; `JetBrains Mono` / `tabular-nums` for patient IDs, bill amounts, dosages, and stock counts.
- **Zero-Pill Discipline**: No static candy pills or badge sandwiches. Clean metadata text with subtle typographic separators (`·` or `/`). Functional segmented controls for status filters (`All`, `Waiting`, `In Consultation`, `Completed`).
- **Responsive Layout**:
  - **Desktop (1440px baseline)**: Fixed 260px collapsible sidebar navigation, breadcrumb top bar with active staff badge indicator and quick lock button, spacious data tables and 2-column EMR consultation views.
  - **Mobile (<768px)**: Bottom navigation bar for core daily flows (Queue, Patients, New Rx, Billing, Menu), touch-optimized action targets ($\ge 44$px), sticky summary action strips.

---

## 3. Key Product Decisions & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HomoeoCare Web App                            │
├────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│ │   Role & PIN Auth    │  │       Top Bar & Staff Badge Switcher     │ │
│ │ (Admin/Doctor/Recep) │  │   (Dr. Pranav · Reception · Cloud Sync)  │ │
│ └──────────┬───────────┘  └────────────────────┬─────────────────────┘ │
│            │                                   │                       │
│ ┌──────────▼───────────────────────────────────▼─────────────────────┐ │
│ │                       Feature Modules                              │ │
│ │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │ │
│ │  │ Appointments │  │   Patients   │  │ Consultation │  │ Billing │ │ │
│ │  │   & Queue    │  │   & EMR      │  │  & Rx Print  │  │  & INR  │ │ │
│ │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │ │
│ │         │                 │                 │               │      │ │
│ │  ┌──────▼─────────────────▼─────────────────▼───────────────▼────┐ │ │
│ │  │            Inventory (Homoeopathic Remedies & Stock)          │ │ │
│ │  └──────────────────────────────┬────────────────────────────────┘ │ │
│ └─────────────────────────────────┼──────────────────────────────────┘ │
│                                   │                                    │
│ ┌─────────────────────────────────▼──────────────────────────────────┐ │
│ │          Hybrid Zero-Cost Storage: Cloud Firestore + Local Cache   │ │
│ │  - Patients (HC-YYYY-XXXX)      - Prescriptions (Rx)               │ │
│ │  - Appointments & Queue         - Inventory & Stock Movement       │ │
│ │  - Consultations & Modalities   - Invoices & Payment Ledger        │ │
│ │  - Clinic Settings & Staff PINs - Database JSON Backup/Restore     │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Firestore Architecture:
1. **`patients`**:
   - `id`, `patientId` (e.g. `HC-2026-0001`), `name`, `gender`, `dob`, `age`, `phone`, `email`, `address`, `bloodGroup`, `constitutionalType`, `allergies`, `createdAt`, `updatedAt`, `totalVisits`, `lastVisitDate`.
2. **`appointments`**:
   - `id`, `patientId`, `patientName`, `patientPhone`, `date`, `timeSlot`, `tokenNumber`, `status` (`scheduled`, `waiting`, `in-consultation`, `completed`, `cancelled`, `no-show`), `type` (`new`, `follow-up`, `emergency`), `chiefComplaint`, `assignedDoctor`, `createdAt`.
3. **`consultations`**:
   - `id`, `patientId`, `appointmentId`, `date`, `doctorName`, `vitals` (bp, pulse, temp, spo2, weight), `chiefComplaints` (complaint, duration, severity), `modalities` (aggravation, amelioration), `mindGenerals` (temperament, sleep, appetite, thirst, thermalReaction: `chilly` | `hot` | `ambithermal`), `physicalObservations`, `miasm` (`psora`, `sycosis`, `syphilis`, `tubercular`), `diagnosis`, `prescriptionId`, `followUpAdvice`, `nextVisitDate`.
4. **`prescriptions`**:
   - `id`, `consultationId`, `patientId`, `patientName`, `date`, `remedies`: Array of `{ name, potency (e.g. 30C, 200C, 1M, Q), form (pills, dilution, biochemic, mother-tincture), dosage, frequency (e.g. 4 pills TDS / BD / OD / SOS), durationDays, instructions }`, `generalAdvice` (e.g. "Avoid raw onions, garlic, coffee 30 mins before/after dose"), `doctorSignature`.
5. **`inventory`**:
   - `id`, `name` (e.g., "Arnica Montana 200C", "Nux Vomica 30C", "Belladonna 1M", "Five Phos 6X"), `category` (`dilution`, `mother-tincture`, `biochemic`, `trituration`, `globules`, `bottle`), `potency`, `unit` (`ml`, `grams`, `phials`, `tablets`), `currentStock`, `minReorderLevel`, `unitPriceINR`, `batchNumber`, `expiryDate`, `supplier`, `updatedAt`.
6. **`invoices`**:
   - `id`, `invoiceNumber` (`INV-2026-0001`), `patientId`, `patientName`, `appointmentId`, `date`, `items`: Array of `{ description, type: 'consultation' | 'medicine' | 'test', quantity, unitPriceINR, totalINR }`, `subtotalINR`, `discountINR`, `taxINR`, `grandTotalINR`, `paidINR`, `paymentStatus` (`paid`, `partial`, `pending`), `paymentMethod` (`cash`, `upi`, `card`, `bank-transfer`), `receiptNumber`.
7. **`clinic_settings`**:
   - `clinicName`: "HomoeoCare Health Centre", `tagline`: "Holistic & Individualized Healing", `doctorName`: "Dr. Pranav J., B.H.M.S, M.D. (Hom)", `registrationNumber`: "HOM-IND-84920", `phone`, `email`, `address`, `consultationFeeINR`: 500, `followupFeeINR`: 300, `staffPins`: `{ admin: '1111', doctor: '2222', receptionist: '3333' }`.

---

## 4. Key Implementation Steps

1. **Firebase Setup & Configuration**:
   - Provision Firebase Firestore and Authentication.
   - Configure `firebase-blueprint.json` and generate hardened `firestore.rules`.
   - Setup Firestore client initialization with error handler and offline fallback mock-sync for resilience.
2. **Authentication & PIN Lock Modal**:
   - Fast staff switch with PIN verification (Admin, Doctor, Receptionist).
   - Session retention in secure storage with easy Quick-Lock action in the header.
3. **Patient Management & Queue (Reception Flow)**:
   - Registration form with automatic Patient ID generator, search by Name/Phone/ID.
   - Appointment scheduler with token number assignment and visual waiting room queue.
   - Vitals recorder for incoming visits.
4. **Doctor Consultation & Digital Prescription (Doctor Flow)**:
   - Dedicated Homoeopathic EMR workspace: Chief complaints, modalities (heat/cold/motion), constitutional thermal type, miasm analysis, diagnosis.
   - Smart remedy search with quick potencies (6C, 30C, 200C, 1M, 10M, Q, 6X, 12X).
   - High-fidelity printable Prescription view with clinic letterhead, doctor registration, Rx layout, and homoeopathic dietary guidelines.
5. **Medicine Dispensary & Inventory (Admin / Pharmacy Flow)**:
   - Stock tracking with reorder indicators and batch/expiry monitoring.
   - Auto-stock deduction when prescription items are billed or dispensed.
   - Quick restock and inventory audit log.
6. **Billing & Invoices (Receptionist / Admin Flow)**:
   - Automated bill generation pulling consultation fee and prescribed remedies.
   - Multiple payment methods (Cash, UPI with QR preview, Card).
   - Printable thermal / A4 receipt with tax/GST breakdown and clinic details.
7. **Clinic Analytics Dashboard & Database Backup/Restore**:
   - Daily/weekly patient traffic, revenue totals, top prescribed remedies, low stock alerts.
   - JSON database backup export with date-timestamped filename and complete collection dump.
   - Local database restore parser with validation and preview before import.
8. **Deployment Readiness**:
   - Add Netlify `_redirects` file for clean SPA client-side routing.
   - Netlify `netlify.toml` build configuration for zero-cost static hosting.
   - Strict TypeScript compilation and responsive testing.

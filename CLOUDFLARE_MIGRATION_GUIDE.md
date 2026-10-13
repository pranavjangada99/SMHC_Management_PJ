# Cloudflare Pages, Workers & D1 Architecture & Deployment Guide

This document describes the migrated architecture, database schema, and deployment procedure for the **HomoeoCare Clinic Management System**.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────┐
│     Cloudflare Pages (React SPA)       │
│  - Static assets (HTML, JS, CSS)       │
│  - Firebase Auth Client SDK            │
│  - Role UI & PIN Session State         │
└───────────────────┬────────────────────┘
                    │  HTTPS /api/* (with X-Staff-Role & Bearer token)
                    ▼
┌────────────────────────────────────────┐
│   Cloudflare Worker (Secure API Layer) │
│  - Token / PIN authentication          │
│  - Role-Based Access Control (RBAC)    │
│  - Receptionist daily revenue filter   │
│  - Data validation & audit logging     │
└───────────────────┬────────────────────┘
                    │  Native D1 Binding (env.DB)
                    ▼
┌────────────────────────────────────────┐
│     Cloudflare D1 (SQLite Database)    │
│  - Relational schema with foreign keys │
│  - 10+ normalized tables & indexes     │
│  - Scalable to 10,000+ patients        │
└────────────────────────────────────────┘
```

---

## 2. Cloudflare D1 Database Schema

The database consists of 11 relational tables defined in `migrations/0001_initial_schema.sql`:

1. **`clinic_settings`**: Clinic metadata, doctor info, medical registration, consultation fees, staff PINs, remedies, and low stock thresholds.
2. **`staff_users`**: Staff profiles, roles (`admin`, `doctor`, `receptionist`), and credentials.
3. **`patients`**: Patient registry with unique `patient_id`, demographics, constitutional remedies, and indexes on `phone`, `name`, and `patient_id`.
4. **`appointments`**: Patient queue, tokens, visit dates, and statuses (`scheduled`, `waiting`, `in-consultation`, `completed`, `cancelled`).
5. **`consultations`**: Doctor clinical case records, vitals (BP, pulse, temp, SpO2, weight), symptom rubrics, modalities, mind generals, miasm, and diagnoses.
6. **`prescriptions`**: Digital prescriptions linked to consultations and patients.
7. **`prescription_remedies`**: Normalized line items for prescribed remedies, potencies, dosages, frequencies, and duration.
8. **`inventory`**: Dispensary remedies, dilutions, mother tinctures, biochemic salts, cosmetic shelf products, stock levels, reorder thresholds, and batches.
9. **`invoices`**: Financial invoices with subtotals, tax, discounts, paid amount, and payment status (`paid`, `partial`, `pending`).
10. **`invoice_items`**: Itemized lines for each invoice (consultation fees, medicines dispensed, cosmetic products).
11. **`payments`**: Payment ledger recording every payment receipt, transaction reference, timestamp, and the staff role that recorded it.

---

## 3. Role-Based Access Control (RBAC) Rules

The Cloudflare Worker API strictly enforces authorization at the backend:

| Entity / Action | Admin | Doctor | Receptionist |
|---|:---:|:---:|:---:|
| **Patient Registration & Contact** | Full Access | Full Access | Full Access |
| **Patient Clinical Notes / Remedy** | Full Access | Full Access | Read-Only (Cannot edit diagnosis) |
| **Appointments & Queue Tokens** | Full Access | Full Access | Full Access |
| **Consultations (Case Taking)** | Full Access | Full Access | **403 Forbidden** |
| **Prescriptions Creation** | Full Access | Full Access | **403 Forbidden** (Print/dispense only) |
| **Inventory Stock Management** | Full Access | Add/Adjust Stock | Read-Only (Cannot delete or alter pricing) |
| **Billing: Current Day Invoices** | Full Access | Full Access | Full Access (Can create & take payment) |
| **Billing: Historical Reports & Revenue** | Full Access | Full Access | **403 Forbidden** (Strictly filtered to today) |
| **Clinic Settings & Staff PINs** | Full Access | Read-Only | Read-Only (PINs masked) |
| **Database Migration & Backups** | Full Access | Read-Only | **403 Forbidden** |

---

## 4. Local Development

To run the full-stack development environment locally (using native SQLite to simulate Cloudflare D1):

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start full-stack development server on port 3000
npm run dev
```

The server automatically applies migrations in `migrations/` and boots the local SQLite database at `./data/clinic.sqlite`.

---

## 5. Cloudflare Deployment Steps

### Step 1: Install Wrangler CLI & Authenticate
```bash
npm install -g wrangler
wrangler login
```

### Step 2: Create Cloudflare D1 Database
```bash
wrangler d1 create homoeocare-clinic-d1
```
Note the database ID output (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "homoeocare-clinic-d1"
database_id = "your-actual-database-uuid-from-cloudflare"
```

### Step 3: Run Database Migrations on Cloudflare D1
```bash
# Apply schema and initial seed migrations to remote D1:
wrangler d1 migrations apply homoeocare-clinic-d1 --remote
```

### Step 4: Deploy the Cloudflare Worker API
```bash
npm run deploy:worker
```

### Step 5: Build and Deploy Frontend to Cloudflare Pages
```bash
# Build production bundle
npm run build

# Deploy dist directory to Cloudflare Pages
wrangler pages deploy dist --project-name homoeocare-clinic
```

---

## 6. Fresh Database Setup (No Firestore Migration Required)

As the current database only contained temporary testing data, **no migration of legacy Firestore data is needed**.

When setting up your Cloudflare D1 database:
1. `migrations/0001_initial_schema.sql` automatically establishes all relational tables and indexes.
2. `migrations/0002_seed_initial_data.sql` initializes fresh clinic settings, doctor details, and initial dispensary stock.
3. You start immediately with a clean, high-performance database ready for real clinical operations.

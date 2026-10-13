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

// Seed realistic sample data
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    patientId: 'SMHC-2026-0001',
    name: 'Aarav Sharma',
    gender: 'male',
    age: 34,
    dob: '1992-05-14',
    phone: '+91 98234 11223',
    email: 'aarav.sharma@gmail.com',
    address: 'Flat 302, Green Glen Towers, Baner, Pune',
    bloodGroup: 'B+',
    constitutionalType: 'Nux Vomica (Sedentary, stressed, irritable)',
    allergies: 'None reported',
    medicalHistory: 'Chronic acidity, episodic dyspepsia, work stress',
    totalVisits: 4,
    lastVisitDate: '2026-10-08',
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-10-08T11:30:00Z',
  },
  {
    id: 'pat-2',
    patientId: 'SMHC-2026-0002',
    name: 'Priyanka Desai',
    gender: 'female',
    age: 28,
    dob: '1998-11-20',
    phone: '+91 98110 44556',
    email: 'priyanka.desai@outlook.com',
    address: 'B-14, Shreeram Residency, Kothrud, Pune',
    bloodGroup: 'O+',
    constitutionalType: 'Pulsatilla (Mild, weeping easily, thirstless, seeks open air)',
    allergies: 'Penicillin, Dust mites',
    medicalHistory: 'Irregular menses, chronic allergic rhinitis',
    totalVisits: 3,
    lastVisitDate: '2026-10-09',
    createdAt: '2026-08-20T09:30:00Z',
    updatedAt: '2026-10-09T16:00:00Z',
  },
  {
    id: 'pat-3',
    patientId: 'SMHC-2026-0003',
    name: 'Rameshwar Patil',
    gender: 'male',
    age: 58,
    dob: '1968-03-02',
    phone: '+91 97654 88990',
    address: 'House 12, Sinhagad Road, Pune',
    bloodGroup: 'A+',
    constitutionalType: 'Rhus Toxicodendron / Bryonia',
    allergies: 'None',
    medicalHistory: 'Osteoarthritis bilateral knees, morning stiffness',
    totalVisits: 6,
    lastVisitDate: '2026-10-05',
    createdAt: '2026-07-01T14:15:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'pat-4',
    patientId: 'SMHC-2026-0004',
    name: 'Meera Iyer',
    gender: 'female',
    age: 12,
    dob: '2014-07-19',
    phone: '+91 99220 33112',
    address: 'Sector 4, Aundh, Pune',
    bloodGroup: 'AB+',
    constitutionalType: 'Calcarea Carbonica (Chilly, profuse perspiration on head, slow development)',
    allergies: 'Egg albumen',
    medicalHistory: 'Recurrent tonsillitis, cold sensitivity',
    totalVisits: 2,
    lastVisitDate: '2026-10-02',
    createdAt: '2026-09-15T11:00:00Z',
    updatedAt: '2026-10-02T10:30:00Z',
  },
  {
    id: 'pat-5',
    patientId: 'SMHC-2026-0005',
    name: 'Vikramaditya Rao',
    gender: 'male',
    age: 45,
    dob: '1981-09-08',
    phone: '+91 98451 99221',
    email: 'v.rao@techfirm.co.in',
    address: '704, Marvel Vista, Viman Nagar, Pune',
    bloodGroup: 'O-',
    constitutionalType: 'Lycopodium Clavatum (Right sided complaints, bloating, craves sweets)',
    allergies: 'Sulfa drugs',
    medicalHistory: 'Flatulence, elevated uric acid, fatty liver grade 1',
    totalVisits: 1,
    lastVisitDate: '2026-10-10',
    createdAt: '2026-10-10T08:30:00Z',
    updatedAt: '2026-10-10T08:30:00Z',
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'pat-5',
    patientName: 'Vikramaditya Rao',
    patientPhone: '+91 98451 99221',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    tokenNumber: 1,
    status: 'in-consultation',
    type: 'new',
    chiefComplaint: 'Post-prandial abdominal distension, sour eructations, right hypochondriac heaviness',
    assignedDoctor: 'Dr. Pranav J.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-2',
    patientId: 'pat-1',
    patientName: 'Aarav Sharma',
    patientPhone: '+91 98234 11223',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:30 AM',
    tokenNumber: 2,
    status: 'waiting',
    type: 'follow-up',
    chiefComplaint: 'Follow-up on gastro-esophageal reflux and sleep quality',
    assignedDoctor: 'Dr. Pranav J.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-3',
    patientId: 'pat-2',
    patientName: 'Priyanka Desai',
    patientPhone: '+91 98110 44556',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '11:15 AM',
    tokenNumber: 3,
    status: 'scheduled',
    type: 'follow-up',
    chiefComplaint: 'Review for seasonal sneezing and menstrual cycle tracking',
    assignedDoctor: 'Dr. Pranav J.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-4',
    patientId: 'pat-3',
    patientName: 'Rameshwar Patil',
    patientPhone: '+91 97654 88990',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '12:00 PM',
    tokenNumber: 4,
    status: 'scheduled',
    type: 'follow-up',
    chiefComplaint: 'Bilateral knee pain reassessment after Rhus Tox 200',
    assignedDoctor: 'Dr. Pranav J.',
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Arnica Montana',
    category: 'dilution',
    potency: '200C',
    unit: 'ml (30ml phials)',
    currentStock: 18,
    minReorderLevel: 5,
    unitPriceINR: 120,
    batchNumber: 'ARN-24B-01',
    expiryDate: '2028-12',
    supplier: 'SBL Sharda Boiron Labs',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    name: 'Nux Vomica',
    category: 'dilution',
    potency: '30C',
    unit: 'ml (30ml phials)',
    currentStock: 22,
    minReorderLevel: 6,
    unitPriceINR: 110,
    batchNumber: 'NUX-24A-09',
    expiryDate: '2028-10',
    supplier: 'Dr. Reckeweg & Co',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-3',
    name: 'Lycopodium Clavatum',
    category: 'dilution',
    potency: '200C',
    unit: 'ml (30ml phials)',
    currentStock: 14,
    minReorderLevel: 5,
    unitPriceINR: 125,
    batchNumber: 'LYC-24C-04',
    expiryDate: '2029-01',
    supplier: 'Schwabe India',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-4',
    name: 'Pulsatilla Nigricans',
    category: 'dilution',
    potency: '200C',
    unit: 'ml (30ml phials)',
    currentStock: 16,
    minReorderLevel: 5,
    unitPriceINR: 120,
    batchNumber: 'PUL-24B-11',
    expiryDate: '2028-11',
    supplier: 'SBL Labs',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-5',
    name: 'Five Phos 6X',
    category: 'biochemic',
    potency: '6X',
    unit: 'tablets (25g bottle)',
    currentStock: 4, // Below reorder level!
    minReorderLevel: 8,
    unitPriceINR: 160,
    batchNumber: '5PH-24D-02',
    expiryDate: '2027-08',
    supplier: 'Schwabe India',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-6',
    name: 'Crataegus Oxyacantha',
    category: 'mother-tincture',
    potency: 'Q',
    unit: 'ml (100ml bottle)',
    currentStock: 3, // Low stock
    minReorderLevel: 4,
    unitPriceINR: 280,
    batchNumber: 'CRA-23E-01',
    expiryDate: '2027-05',
    supplier: 'Dr. Reckeweg',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-7',
    name: 'Rhus Toxicodendron',
    category: 'dilution',
    potency: '200C',
    unit: 'ml (30ml phials)',
    currentStock: 25,
    minReorderLevel: 5,
    unitPriceINR: 120,
    batchNumber: 'RHU-24C-08',
    expiryDate: '2029-03',
    supplier: 'SBL Labs',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-8',
    name: 'Belladonna',
    category: 'dilution',
    potency: '30C',
    unit: 'ml (30ml phials)',
    currentStock: 19,
    minReorderLevel: 5,
    unitPriceINR: 110,
    batchNumber: 'BEL-24A-03',
    expiryDate: '2028-09',
    supplier: 'SBL Labs',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-9',
    name: 'Sugar Globules (No. 30)',
    category: 'globules',
    potency: 'Neutral',
    unit: 'grams (450g pack)',
    currentStock: 8,
    minReorderLevel: 3,
    unitPriceINR: 220,
    batchNumber: 'GLO-30-24',
    expiryDate: '2029-12',
    supplier: 'B. Jain Pharmaceuticals',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-10',
    name: 'Empty Dispensing Phials 1/2 Dram',
    category: 'bottle',
    potency: 'Neutral',
    unit: 'gross (144 pcs)',
    currentStock: 6,
    minReorderLevel: 2,
    unitPriceINR: 350,
    batchNumber: 'PHI-05-24',
    expiryDate: '2035-01',
    supplier: 'Standard Glassware',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-11',
    name: 'Berberis Aquifolium Skin Glow Cream',
    category: 'cosmetic',
    subCategory: 'Face Cream',
    potency: 'Topical Herbal Ointment',
    unit: '50g jar',
    currentStock: 12,
    minReorderLevel: 4,
    unitPriceINR: 240,
    purchasePriceINR: 165,
    batchNumber: 'BER-24K-02',
    expiryDate: '2028-06',
    supplier: 'SBL Sharda Boiron Labs',
    brand: 'SBL Labs',
    cosmeticBenefit: 'Clears acne blemishes, dark spots & enhances radiant skin tone',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-12',
    name: 'Arnica Montana Hair Vitalizer Oil',
    category: 'cosmetic',
    subCategory: 'Hair Oil',
    potency: 'Enriched Herbal Tincture',
    unit: '100ml bottle',
    currentStock: 16,
    minReorderLevel: 5,
    unitPriceINR: 280,
    purchasePriceINR: 195,
    batchNumber: 'ARN-24L-08',
    expiryDate: '2028-09',
    supplier: 'Dr. Reckeweg & Co',
    brand: 'Dr. Reckeweg',
    cosmeticBenefit: 'Rejuvenates hair follicles, curbs hair thinning and scalp dandruff',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-13',
    name: 'Calendula Antiseptic Healing Cream',
    category: 'skincare',
    subCategory: 'Soothing Cream',
    potency: 'Topical Cream',
    unit: '30g tube',
    currentStock: 14,
    minReorderLevel: 4,
    unitPriceINR: 140,
    purchasePriceINR: 95,
    batchNumber: 'CAL-24M-03',
    expiryDate: '2028-11',
    supplier: 'Schwabe India',
    brand: 'Schwabe India',
    cosmeticBenefit: 'Rapid healing for dry chapped skin, superficial irritation & redness',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-14',
    name: 'Sunny Herbal Aloevera & Papaya Face Wash',
    category: 'cosmetic',
    subCategory: 'Face Wash',
    potency: 'Botanical Cleanser',
    unit: '100ml pump bottle',
    currentStock: 9,
    minReorderLevel: 3,
    unitPriceINR: 190,
    purchasePriceINR: 130,
    batchNumber: 'BAK-24H-01',
    expiryDate: '2027-10',
    supplier: 'Bakson Homeopathy',
    brand: 'Bakson Homeopathy',
    cosmeticBenefit: 'Natural enzyme deep pore wash, maintains skin pH and hydration',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-15',
    name: 'Silk & Stay Berberis & Calendula Bathing Bar',
    category: 'cosmetic',
    subCategory: 'Bathing Bar',
    potency: 'Glycerin Cleansing Bar',
    unit: '75g soap bar',
    currentStock: 22,
    minReorderLevel: 6,
    unitPriceINR: 95,
    purchasePriceINR: 65,
    batchNumber: 'SIL-24P-05',
    expiryDate: '2029-04',
    supplier: 'SBL Labs',
    brand: 'SBL Labs',
    cosmeticBenefit: 'Non-drying herbal moisturizing soap for delicate facial skin',
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_CONSULTATIONS: Consultation[] = [
  {
    id: 'con-1',
    patientId: 'pat-1',
    appointmentId: 'apt-old-1',
    date: '2026-10-08T11:00:00Z',
    doctorName: 'Dr. Pranav J.',
    vitals: {
      bp: '124/82',
      pulse: 74,
      temperature: 98.4,
      spo2: 99,
      weight: 71,
    },
    chiefComplaints: [
      {
        complaint: 'Heartburn with acidic regurgitation after late-night meals',
        duration: '6 months',
        sensation: 'Burning behind sternum, sour burps',
        severity: 'moderate',
      },
      {
        complaint: 'Early morning waking at 3:00 AM with work anxiety',
        duration: '3 months',
        severity: 'mild',
      }
    ],
    modalities: {
      aggravation: 'Late night eating, coffee, spicy rich food, mental exertion',
      amelioration: 'Warm drinks, short nap, passing stool',
    },
    mindGenerals: {
      temperament: 'Fastidious, impatient, prone to sudden anger when interrupted',
      thermalReaction: 'chilly',
      appetite: 'Ravenous at noon, craves pungent and fatty foods',
      thirst: 'Normal, prefers hot water',
      sleep: 'Disturbed, wakes 3 to 4 AM, falls asleep again around 6 AM',
    },
    physicalObservations: 'Tongue coated white at posterior half. Epigastric tenderness on deep palpation.',
    miasm: 'psora',
    diagnosis: 'Gastro-esophageal reflux disease (GERD) with constitutional dysthymia',
    followUpAdvice: 'Avoid coffee and heavy stimulants after 6 PM. Take light dinner by 8:30 PM. Walk 20 minutes.',
    nextVisitDate: '2026-10-22',
    prescriptionId: 'rx-1',
    createdAt: '2026-10-08T11:20:00Z',
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1',
    consultationId: 'con-1',
    patientId: 'pat-1',
    patientName: 'Aarav Sharma',
    patientAge: 34,
    patientGender: 'male',
    date: '2026-10-08',
    remedies: [
      {
        id: 'rem-1',
        name: 'Nux Vomica',
        potency: '200C',
        form: 'pills',
        dosage: '4 pills (Globules #30)',
        frequency: 'At bedtime only (HS)',
        durationDays: 14,
        instructions: 'Dissolve on clean dry tongue at night. Do not swallow with water.',
      },
      {
        id: 'rem-2',
        name: 'Robinia Pseudacacia',
        potency: '30C',
        form: 'dilution',
        dosage: '5 drops in two spoons of water',
        frequency: 'Morning & Evening before meals (BD)',
        durationDays: 14,
        instructions: 'For hyperchlorhydria and acid eructations.',
      }
    ],
    generalAdvice: 'Do not consume raw onions, garlic, asafoetida (hing), mint, or coffee within 30 minutes of taking homoeopathic remedies. Store phials away from strong sunlight and camphor.',
    doctorSignature: 'Dr. Pranav J., M.D. (Hom.)',
    doctorRegistrationNumber: 'HOM-MAH-84920',
    createdAt: '2026-10-08T11:25:00Z',
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-rec-1',
    invoiceNumber: 'INV-2026-0001',
    patientId: 'pat-1',
    patientName: 'Aarav Sharma',
    date: '2026-10-08',
    items: [
      {
        id: 'item-1',
        description: 'Doctor Consultation (Follow-up Visit)',
        type: 'consultation',
        quantity: 1,
        unitPriceINR: 300,
        totalINR: 300,
      },
      {
        id: 'item-2',
        description: 'Homoeopathic Remedies Dispensed (14 Days Course)',
        type: 'medicine',
        quantity: 1,
        unitPriceINR: 250,
        totalINR: 250,
      }
    ],
    subtotalINR: 550,
    discountINR: 0,
    taxINR: 0,
    grandTotalINR: 550,
    paidINR: 550,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    receiptNumber: 'REC-2026-0001',
    notes: 'Paid via Google Pay UPI',
    createdAt: '2026-10-08T11:35:00Z',
  },
  {
    id: 'inv-rec-2',
    invoiceNumber: 'INV-2026-0002',
    patientId: 'pat-2',
    patientName: 'Priyanka Desai',
    date: '2026-10-09',
    items: [
      {
        id: 'item-201',
        description: 'Follow-up Consultation (Skin Review)',
        type: 'consultation',
        quantity: 1,
        unitPriceINR: 300,
        totalINR: 300,
      },
      {
        id: 'item-202',
        description: 'Berberis Aquifolium Skin Glow Cream (50g)',
        type: 'cosmetic',
        quantity: 1,
        unitPriceINR: 240,
        totalINR: 240,
      },
      {
        id: 'item-203',
        description: 'Arnica Montana Hair Vitalizer Oil (100ml)',
        type: 'cosmetic',
        quantity: 1,
        unitPriceINR: 280,
        totalINR: 280,
      }
    ],
    subtotalINR: 820,
    discountINR: 20,
    taxINR: 0,
    grandTotalINR: 800,
    paidINR: 800,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    receiptNumber: 'REC-2026-0002',
    notes: 'Prescribed cosmetic skincare and hair care bundle',
    createdAt: '2026-10-09T16:15:00Z',
  },
  {
    id: 'inv-rec-3',
    invoiceNumber: 'INV-2026-0003',
    patientId: 'pat-5',
    patientName: 'Vikramaditya Rao',
    date: new Date().toISOString().split('T')[0],
    items: [
      {
        id: 'item-301',
        description: 'New Patient Consultation (Dr. Pranav J.)',
        type: 'consultation',
        quantity: 1,
        unitPriceINR: 500,
        totalINR: 500,
      },
      {
        id: 'item-302',
        description: 'Homoeopathic Remedies Dispensed (14 Days Pack)',
        type: 'medicine',
        quantity: 1,
        unitPriceINR: 250,
        totalINR: 250,
      }
    ],
    subtotalINR: 750,
    discountINR: 0,
    taxINR: 0,
    grandTotalINR: 750,
    paidINR: 0,
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    notes: 'Payment collection pending at counter',
    createdAt: new Date().toISOString(),
  }
];

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
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) || 'doctor';
  },
  setActiveRole(role: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
  },
  getIsLocked(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.IS_LOCKED);
    return val ? val === 'true' : false;
  },
  setIsLocked(locked: boolean) {
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, String(locked));
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

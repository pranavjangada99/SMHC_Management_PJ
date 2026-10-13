import React, { useState, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { checkFirestoreConnection, FirestoreConnectionCheck } from '../../lib/firebase';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  KeyRound, 
  Building2, 
  Save,
  HardDriveDownload,
  FileCheck,
  ExternalLink,
  Activity,
  Copy,
  Check,
  Globe2,
  HardDrive
} from 'lucide-react';

export const BackupRestoreView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    updateStaffPins, 
    patients, 
    appointments, 
    consultations, 
    prescriptions, 
    inventory, 
    invoices, 
    syncStatus, 
    lastSyncTime, 
    triggerCloudSync, 
    exportBackupFile, 
    importBackupFile 
  } = useClinic();

  // Settings form state
  const [clinicName, setClinicName] = useState(settings.clinicName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [doctorName, setDoctorName] = useState(settings.doctorName);
  const [qualification, setQualification] = useState(settings.qualification);
  const [registrationNumber, setRegistrationNumber] = useState(settings.registrationNumber);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [consultationFeeINR, setConsultationFeeINR] = useState(settings.consultationFeeINR);
  const [followupFeeINR, setFollowupFeeINR] = useState(settings.followupFeeINR);
  const [upiId, setUpiId] = useState(settings.upiId || 'homoeocare@icici');

  // Staff PINs form state
  const [adminPin, setAdminPin] = useState(settings.staffPins?.admin || '1111');
  const [doctorPin, setDoctorPin] = useState(settings.staffPins?.doctor || '2222');
  const [receptionistPin, setReceptionistPin] = useState(settings.staffPins?.receptionist || '3333');

  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);
  const [pinsSavedAlert, setPinsSavedAlert] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string; counts?: Record<string, number> } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [dbCheckResult, setDbCheckResult] = useState<FirestoreConnectionCheck | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Test live Firestore connectivity
  const handlePingDatabase = async () => {
    setIsCheckingDb(true);
    try {
      const res = await checkFirestoreConnection();
      setDbCheckResult(res);
    } catch (err) {
      setDbCheckResult({
        success: false,
        latencyMs: 0,
        message: err instanceof Error ? err.message : 'Database check failed',
        projectId: 'sacred-question-mv4kj',
        databaseId: 'ai-studio-f723f466-a02b-47d1-a698-8e490c652a5d'
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Handle Backup Export
  const handleExportBackup = async () => {
    try {
      const { filename, jsonContent } = await exportBackupFile();
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error creating backup file: ' + err);
    }
  };

  // Handle File Upload Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const result = importBackupFile(content);
        setRestoreStatus(result);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clinicName,
      tagline,
      doctorName,
      qualification,
      registrationNumber,
      phone,
      email,
      address,
      consultationFeeINR: Number(consultationFeeINR),
      followupFeeINR: Number(followupFeeINR),
      upiId,
    });
    setSettingsSavedAlert(true);
    setTimeout(() => setSettingsSavedAlert(false), 3000);
  };

  // Save PINs
  const handleSavePins = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaffPins({
      admin: adminPin,
      doctor: doctorPin,
      receptionist: receptionistPin,
    });
    setPinsSavedAlert(true);
    setTimeout(() => setPinsSavedAlert(false), 3000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerCloudSync();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Database Management, Backups & Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            1-Click offline local database exports, file restores, Cloud Firestore synchronization, and staff security PIN controls.
          </p>
        </div>
      </div>

      {/* Database Backup & Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Backup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 mb-4 shadow-2xs">
              <HardDriveDownload className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Download Local Database Backup (.json)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export an encrypted, complete snapshot of all clinic records to your computer or external hard drive. Ideal for compliance, offline archiving, and zero-risk peace of mind.
            </p>

            {/* Current Snapshot Breakdown */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Current Records to be Exported:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono text-[11px]">
                <div>• Patients: <strong>{patients.length}</strong></div>
                <div>• Appointments: <strong>{appointments.length}</strong></div>
                <div>• Consultations: <strong>{consultations.length}</strong></div>
                <div>• Prescriptions: <strong>{prescriptions.length}</strong></div>
                <div>• Medicines: <strong>{inventory.length}</strong></div>
                <div>• Invoices: <strong>{invoices.length}</strong></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-700" />
              <span>Download Complete Backup File</span>
            </button>
          </div>
        </div>

        {/* Restore Backup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-4 shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Restore / Recover from Local Backup File
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload a previously exported <code className="text-slate-800 font-mono font-semibold">HomoeoCare_Backup_*.json</code> file to safely restore your entire patient registry, clinical history, and stock records.
            </p>

            <div className="mt-4 p-4 bg-blue-50/60 rounded-xl border border-blue-200/70 text-xs text-blue-950">
              <p className="font-semibold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Automatic Integrity Validation</span>
              </p>
              <p className="text-[11px] text-blue-800 mt-1">
                The system verifies JSON schema integrity before applying updates to protect existing patient records from corruption.
              </p>
            </div>

            {restoreStatus && (
              <div className={`mt-3 p-3 rounded-xl border text-xs ${
                restoreStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <p className="font-bold">{restoreStatus.message}</p>
                {restoreStatus.counts && (
                  <p className="text-[11px] mt-1 font-mono">
                    Restored: {restoreStatus.counts.patients} patients, {restoreStatus.counts.consultations} consultations, {restoreStatus.counts.inventory} stock items.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Select Backup File to Restore</span>
            </button>
          </div>
        </div>

      </div>

      {/* Database Location, Architecture & Live Cloud Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shadow-2xs">
              <Database className="w-5 h-5 text-stone-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Database Location & Cloud Inspector</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  syncStatus === 'synced' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {syncStatus === 'synced' ? 'Online Synced' : 'Local Storage Engine Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dual-tier architecture: Google Cloud Firestore (remote persistent repository) & local browser storage (offline zero-latency OPD caching).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePingDatabase}
              disabled={isCheckingDb}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 text-emerald-600 ${isCheckingDb ? 'animate-spin' : ''}`} />
              <span>{isCheckingDb ? 'Testing Connection...' : 'Test Cloud Connection'}</span>
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now to Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Live Connectivity Test Result Banner (if run) */}
        {dbCheckResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition-all ${
            dbCheckResult.success 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${dbCheckResult.success ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold">
                  {dbCheckResult.success ? 'Cloud Firestore Connection Verified' : 'Connection Alert'}
                </span>
                {dbCheckResult.latencyMs > 0 && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/70 border border-emerald-200/60 font-semibold">
                    Latency: {dbCheckResult.latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">{dbCheckResult.message}</p>
            </div>
          </div>
        )}

        {/* 2-Column Storage Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Cloud Firestore Info Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900">Cloud Database (Google Cloud Firestore)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold uppercase">
                  Remote Host
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Centralized cloud database storing real-time backups, syncing multiple clinic counters, and securing records off-premises.
              </p>

              {/* Parameters List */}
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80">
                  <div className="truncate mr-2">
                    <span className="text-slate-400 text-[10px] uppercase block">Google Cloud Project ID</span>
                    <span className="text-slate-800 font-semibold text-[11px]">sacred-question-mv4kj</span>
                  </div>
                  <button
                    onClick={() => handleCopy('sacred-question-mv4kj', 'proj')}
                    title="Copy Project ID"
                    className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                  >
                    {copiedKey === 'proj' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80">
                  <div className="truncate mr-2">
                    <span className="text-slate-400 text-[10px] uppercase block">Firestore Database ID</span>
                    <span className="text-slate-800 font-semibold text-[11px]">ai-studio-f723f466-a02b-47d1-a698-8e490c652a5d</span>
                  </div>
                  <button
                    onClick={() => handleCopy('ai-studio-f723f466-a02b-47d1-a698-8e490c652a5d', 'dbid')}
                    title="Copy Database ID"
                    className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                  >
                    {copiedKey === 'dbid' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://console.firebase.google.com/project/sacred-question-mv4kj/firestore/databases/ai-studio-f723f466-a02b-47d1-a698-8e490c652a5d/data"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 rounded-xl transition border border-sky-200 cursor-pointer shadow-2xs"
              >
                <span>Open in Google Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5 text-sky-700" />
              </a>
            </div>
          </div>

          {/* Local Browser Engine Info Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-900">Local Cache Engine (Browser Storage)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Zero Latency
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Persistent local storage directly inside your browser so consultations, prescription generation, and billing work instantly with zero delay, even without active internet.
              </p>

              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                  <span className="text-slate-400 text-[10px] uppercase block">Storage Keys in Browser</span>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px] font-mono text-slate-700">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">homoeocare_patients</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">homoeocare_prescriptions</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">homoeocare_consultations</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">homoeocare_invoices</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">homoeocare_inventory</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Last Sync Timestamp:</span>
                  <span className="font-mono font-semibold text-slate-800 text-[11px]">{lastSyncTime || 'Just now'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExportBackup}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition border border-emerald-200 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Download Local Raw JSON Dump</span>
              </button>
            </div>
          </div>

        </div>

        {/* Database Collections Inventory Breakdown */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Active Database Collections & Document Counts
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Synced across Cloud & Local Store
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 font-mono block">patients</span>
              <span className="text-base font-bold text-slate-800 font-mono">{patients.length}</span>
              <span className="text-[9px] text-slate-500 block">Records</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 font-mono block">appointments</span>
              <span className="text-base font-bold text-slate-800 font-mono">{appointments.length}</span>
              <span className="text-[9px] text-slate-500 block">Queue visits</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 font-mono block">consultations</span>
              <span className="text-base font-bold text-slate-800 font-mono">{consultations.length}</span>
              <span className="text-[9px] text-slate-500 block">Cases</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 font-mono block">prescriptions</span>
              <span className="text-base font-bold text-slate-800 font-mono">{prescriptions.length}</span>
              <span className="text-[9px] text-slate-500 block">Rx issued</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 font-mono block">inventory</span>
              <span className="text-base font-bold text-slate-800 font-mono">{inventory.length}</span>
              <span className="text-[9px] text-slate-500 block">Remedies</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 font-mono block">invoices</span>
              <span className="text-base font-bold text-slate-800 font-mono">{invoices.length}</span>
              <span className="text-[9px] text-slate-500 block">Receipts</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 font-mono block">clinic_settings</span>
              <span className="text-base font-bold text-emerald-600 font-mono">1</span>
              <span className="text-[9px] text-slate-500 block">Active Config</span>
            </div>
          </div>
        </div>

      </div>

      {/* Clinic Settings & Staff PINs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Clinic Details & Doctor Credentials Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinic Profile & Doctor Credentials</h3>
              <p className="text-xs text-slate-500">Appears on official prescriptions, receipts, and letterhead.</p>
            </div>
            {settingsSavedAlert && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Motto</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification Titles</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Council Reg. No.</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={consultationFeeINR}
                  onChange={e => setConsultationFeeINR(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Fee (₹)</label>
                <input
                  type="number"
                  value={followupFeeINR}
                  onChange={e => setFollowupFeeINR(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UPI VPA for QR</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-indigo-700" />
                <span>Save Clinic Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Staff Security PINs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Staff Station Security PINs</h3>
              <p className="text-xs text-slate-500">Configure access PINs for role switching.</p>
            </div>
            {pinsSavedAlert && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSavePins} className="space-y-4">
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
              <label className="block text-xs font-bold text-amber-900 mb-1">Admin Station PIN</label>
              <input
                type="text"
                maxLength={6}
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                className="w-full text-sm font-mono font-bold px-3 py-1.5 rounded-lg border border-amber-300 bg-white"
              />
              <span className="text-[10px] text-amber-800 mt-0.5 block">Full administrative access</span>
            </div>

            <div className="p-3 bg-stone-100/80 rounded-xl border border-stone-200">
              <label className="block text-xs font-bold text-stone-900 mb-1">Doctor Station PIN</label>
              <input
                type="text"
                maxLength={6}
                value={doctorPin}
                onChange={e => setDoctorPin(e.target.value)}
                className="w-full text-sm font-mono font-bold px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              />
              <span className="text-[10px] text-stone-700 mt-0.5 block">Clinical EMR & Rx access</span>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60">
              <label className="block text-xs font-bold text-blue-900 mb-1">Receptionist Desk PIN</label>
              <input
                type="text"
                maxLength={6}
                value={receptionistPin}
                onChange={e => setReceptionistPin(e.target.value)}
                className="w-full text-sm font-mono font-bold px-3 py-1.5 rounded-lg border border-blue-300 bg-white"
              />
              <span className="text-[10px] text-blue-800 mt-0.5 block">Queue tokens, patients & billing</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-indigo-700" />
              <span>Update Staff Security PINs</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

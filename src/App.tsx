/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { DashboardView } from './components/dashboard/DashboardView';
import { AppointmentQueueView } from './components/queue/AppointmentQueueView';
import { PatientListView } from './components/patients/PatientListView';
import { ConsultationWorkspace } from './components/consultation/ConsultationWorkspace';
import { PrescriptionsListView } from './components/prescription/PrescriptionsListView';
import { InventoryView } from './components/inventory/InventoryView';
import { BillingView } from './components/billing/BillingView';
import { PracticeSettingsView } from './components/settings/PracticeSettingsView';
import { BackupRestoreView } from './components/backup/BackupRestoreView';

import { LoginScreen } from './components/auth/LoginScreen';
import { PrescriptionPrintModal } from './components/prescription/PrescriptionPrintModal';
import { InvoiceReceiptPrintModal } from './components/billing/InvoiceReceiptPrintModal';
import { NewPatientModal } from './components/patients/NewPatientModal';
import { BookAppointmentModal } from './components/queue/BookAppointmentModal';
import { StaffManagementModal } from './components/settings/StaffManagementModal';

import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  Stethoscope, 
  CreditCard, 
  Menu 
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, role, isLocked } = useClinic();

  // If unauthenticated or locked, show the dedicated full-screen Login Screen
  if (isLocked) {
    return <LoginScreen />;
  }
  
  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global action modal states
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [newPatientInitialName, setNewPatientInitialName] = useState<string | undefined>();
  const [isBookAppointmentModalOpen, setIsBookAppointmentModalOpen] = useState(false);
  const [preSelectedPatientIdForApt, setPreSelectedPatientIdForApt] = useState<string | undefined>();

  // Global Keyboard Shortcut: Cmd/Ctrl + K opens Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenBookAppointmentModal = (patientId?: string) => {
    setPreSelectedPatientIdForApt(patientId);
    setIsBookAppointmentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50/60 flex flex-col font-sans">
      
      {/* Top Application Header */}
      <Header 
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          isMobileOpen={isMobileMenuOpen} 
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Main Clinical Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
              onOpenBookAppointmentModal={() => handleOpenBookAppointmentModal()}
            />
          )}

          {activeTab === 'queue' && (
            <AppointmentQueueView
              onOpenBookAppointmentModal={() => handleOpenBookAppointmentModal()}
            />
          )}

          {activeTab === 'patients' && (
            <PatientListView
              onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
              onOpenBookAppointmentModal={id => handleOpenBookAppointmentModal(id)}
            />
          )}

          {activeTab === 'consultation' && (
            <ConsultationWorkspace />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsListView />
          )}

          {activeTab === 'inventory' && (
            <InventoryView />
          )}

          {activeTab === 'billing' && (
            <BillingView />
          )}

          {activeTab === 'settings' && (
            <PracticeSettingsView />
          )}

          {activeTab === 'backup' && (
            <BackupRestoreView />
          )}
        </main>

      </div>

      {/* Mobile Sticky Quick Navigation Strip (<1024px) */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200/80 py-1.5 px-2 z-30 shadow-lg flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-700 bg-indigo-50 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'queue' ? 'text-indigo-700 bg-indigo-50 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'patients' ? 'text-indigo-700 bg-indigo-50 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patients</span>
        </button>

        {(role === 'doctor' || role === 'admin') && (
          <button
            onClick={() => setActiveTab('consultation')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'consultation' ? 'text-indigo-700 bg-indigo-50 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>EMR Rx</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'billing' ? 'text-indigo-700 bg-indigo-50 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold text-stone-500 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Global Modals & Overlays */}
      <PrescriptionPrintModal />
      <InvoiceReceiptPrintModal />
      
      {/* Global Keyboard Shortcut (Cmd/Ctrl + K) Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewPatientModal={(initialName) => {
          setNewPatientInitialName(initialName);
          setIsNewPatientModalOpen(true);
        }}
        onOpenBookAppointmentModal={(patientId) => {
          handleOpenBookAppointmentModal(patientId);
        }}
      />

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => {
          setIsNewPatientModalOpen(false);
          setNewPatientInitialName(undefined);
        }}
        initialName={newPatientInitialName}
      />

      <BookAppointmentModal
        isOpen={isBookAppointmentModalOpen}
        onClose={() => {
          setIsBookAppointmentModalOpen(false);
          setPreSelectedPatientIdForApt(undefined);
        }}
        preSelectedPatientId={preSelectedPatientIdForApt}
      />

      {/* Global Staff Accounts & Access Management Modal */}
      <StaffManagementModal />

    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <AppContent />
    </ClinicProvider>
  );
}

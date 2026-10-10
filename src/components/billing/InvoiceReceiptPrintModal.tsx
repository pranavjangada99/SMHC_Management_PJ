import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Printer, 
  X, 
  Receipt, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';

export const InvoiceReceiptPrintModal: React.FC = () => {
  const { 
    activeInvoiceToPrint, 
    closeInvoicePrint, 
    settings, 
    patients 
  } = useClinic();

  if (!activeInvoiceToPrint) return null;

  const patient = patients.find(p => p.id === activeInvoiceToPrint.patientId);

  const handlePrint = () => {
    window.print();
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
      
      {/* Floating Action Controls */}
      <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>

        <button
          onClick={closeInvoicePrint}
          className="p-2 text-slate-700 bg-white hover:bg-slate-100 rounded-xl shadow-lg transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Printable Receipt Paper - Aesthetic Styling */}
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-xl w-full p-8 my-8 print:m-0 print:p-6 print:border-none print:shadow-none print:w-full">
        
        {/* Receipt Header */}
        <div className="text-center border-b-2 border-emerald-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold flex items-center justify-center mx-auto mb-2 text-sm">
            {settings.clinicName ? settings.clinicName.substring(0, 2).toUpperCase() : 'HC'}
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
            {settings.clinicName}
          </h1>
          <p className="text-xs font-semibold text-slate-600">
            {settings.tagline}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {settings.address} · Phone: {settings.phone}
          </p>
          {settings.gstNumber && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              GSTIN: {settings.gstNumber}
            </p>
          )}
          <div className="mt-2 inline-block bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-900 uppercase tracking-wider">
            Official Payment Receipt
          </div>
        </div>

        {/* Invoice & Receipt Metadata */}
        <div className="my-4 py-3 bg-stone-50 rounded-xl border border-stone-200 text-xs px-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-stone-500 block text-[10px]">RECEIPT / INVOICE NO:</span>
              <span className="font-mono font-bold text-stone-900">{activeInvoiceToPrint.invoiceNumber}</span>
              {activeInvoiceToPrint.receiptNumber && (
                <span className="block text-[10px] text-stone-600 font-mono">Ref: {activeInvoiceToPrint.receiptNumber}</span>
              )}
            </div>

            <div className="text-right">
              <span className="text-stone-500 block text-[10px]">DATE & TIME:</span>
              <span className="font-mono text-stone-800">{activeInvoiceToPrint.date}</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-stone-200 flex justify-between items-center">
            <div>
              <span className="text-stone-500 block text-[10px]">PATIENT NAME:</span>
              <span className="font-bold text-stone-900">{activeInvoiceToPrint.patientName}</span>
            </div>

            <div className="text-right">
              <span className="text-stone-500 block text-[10px]">PATIENT ID:</span>
              <span className="font-mono font-bold text-stone-800">{patient?.patientId || 'HC-Walkin'}</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-stone-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-2 px-3">Item / Service Description</th>
                <th className="py-2 px-3 text-center w-12">Qty</th>
                <th className="py-2 px-3 text-right">Rate ({currency})</th>
                <th className="py-2 px-3 text-right">Amount ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {activeInvoiceToPrint.items.map(item => (
                <tr key={item.id}>
                  <td className="py-2.5 px-3 font-medium text-stone-900">{item.description}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-600">{currency}{item.unitPriceINR}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">{currency}{item.totalINR}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="space-y-1.5 text-xs border-t border-stone-200 pt-3">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal:</span>
            <span className="font-mono">{currency}{activeInvoiceToPrint.subtotalINR}</span>
          </div>

          {activeInvoiceToPrint.discountINR > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Concession / Discount:</span>
              <span className="font-mono">- {currency}{activeInvoiceToPrint.discountINR}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
            <span>Total Amount:</span>
            <span className="font-mono">{currency}{activeInvoiceToPrint.grandTotalINR}</span>
          </div>

          <div className="flex justify-between text-xs text-stone-800 font-semibold pt-1">
            <span>Amount Paid:</span>
            <span className="font-mono">{currency}{activeInvoiceToPrint.paidINR}</span>
          </div>

          {activeInvoiceToPrint.grandTotalINR - activeInvoiceToPrint.paidINR > 0 && (
            <div className="flex justify-between text-xs text-rose-600 font-bold">
              <span>Balance Due:</span>
              <span className="font-mono">{currency}{activeInvoiceToPrint.grandTotalINR - activeInvoiceToPrint.paidINR}</span>
            </div>
          )}

          <div className="pt-2 flex justify-between text-[11px] text-stone-500 font-mono">
            <span>Payment Tender: <strong className="text-stone-900 uppercase">{activeInvoiceToPrint.paymentMethod}</strong></span>
            <span>Status: <strong className="text-stone-900 uppercase">{activeInvoiceToPrint.paymentStatus}</strong></span>
          </div>
        </div>

        {/* Receipt Verification Footer */}
        <div className="mt-8 pt-4 border-t border-dashed border-stone-300 flex items-end justify-between text-[11px]">
          <div>
            <p className="text-stone-400">Doctor / Examining Practitioner:</p>
            <p className="font-bold text-stone-800">{settings.doctorName}, {settings.qualification}</p>
            <p className="text-[10px] text-stone-400 font-mono">Reg: {settings.registrationNumber}</p>
          </div>

          <div className="text-right">
            <div className="inline-block border-b border-stone-300 pb-1 mb-1 px-6">
              <span className="text-[10px] text-stone-400 block">Authorized Cashier Seal</span>
            </div>
            <p className="text-[10px] text-stone-500">Thank you for visiting {settings.clinicName}</p>
          </div>
        </div>

      </div>

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Invoice, 
  InvoiceItem, 
  PaymentMethod, 
  PaymentStatus 
} from '../../types/clinic';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Printer, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  Receipt,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  Percent,
  Wallet,
  ArrowUpRight,
  Filter,
  Package,
  Stethoscope,
  X,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { 
    invoices, 
    patients, 
    inventory,
    settings, 
    createInvoice, 
    recordPayment, 
    openInvoicePrint,
    role
  } = useClinic();

  const isReceptionist = role === 'receptionist';
  const currency = settings.currencySymbol || '₹';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'cosmetic' | 'consultation' | 'medicine'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  // New Invoice Form
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: `Doctor Consultation (${settings.doctorName})`,
      type: 'consultation',
      quantity: 1,
      unitPriceINR: settings.consultationFeeINR || 500,
      totalINR: settings.consultationFeeINR || 500,
    }
  ]);
  const [discountINR, setDiscountINR] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [initialPaymentStatus, setInitialPaymentStatus] = useState<PaymentStatus>('paid');

  // Quick Payment Modal
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [paymentTransactionRef, setPaymentTransactionRef] = useState('');

  // Quick item picker for new invoice
  const [selectedInventoryToAdd, setSelectedInventoryToAdd] = useState('');

  // Dates
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split('T')[0];

  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgoDate.toISOString().split('T')[0];

  // Effective date range filter (Receptionist is strictly restricted to current day)
  const activeDateFilter = isReceptionist ? 'today' : dateRangeFilter;

  // Invoices filtered by date
  const dateFilteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (activeDateFilter === 'today') return inv.date === todayStr;
      if (activeDateFilter === 'yesterday') return inv.date === yesterdayStr;
      if (activeDateFilter === 'week') return inv.date >= sevenDaysAgoStr;
      if (activeDateFilter === 'month') return inv.date >= thirtyDaysAgoStr;
      if (activeDateFilter === 'custom') {
        if (customStartDate && inv.date < customStartDate) return false;
        if (customEndDate && inv.date > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [invoices, activeDateFilter, todayStr, yesterdayStr, sevenDaysAgoStr, thirtyDaysAgoStr, customStartDate, customEndDate]);

  // Final table list with all filters applied
  const filteredInvoices = useMemo(() => {
    return dateFilteredInvoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(q) ||
                            inv.patientName.toLowerCase().includes(q) ||
                            (inv.receiptNumber && inv.receiptNumber.toLowerCase().includes(q)) ||
                            (inv.transactionRef && inv.transactionRef.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
      const matchesMethod = methodFilter === 'all' || inv.paymentMethod === methodFilter;

      const matchesItemType = itemTypeFilter === 'all' || 
                              inv.items.some(item => item.type === itemTypeFilter);

      return matchesSearch && matchesStatus && matchesMethod && matchesItemType;
    });
  }, [dateFilteredInvoices, searchQuery, statusFilter, methodFilter, itemTypeFilter]);

  // Complete Financial Dashboard Metrics
  const financialSummary = useMemo(() => {
    const totalBilled = dateFilteredInvoices.reduce((sum, i) => sum + i.grandTotalINR, 0);
    const totalCollected = dateFilteredInvoices.reduce((sum, i) => sum + i.paidINR, 0);
    const totalPending = dateFilteredInvoices
      .filter(i => i.paymentStatus !== 'paid')
      .reduce((sum, i) => sum + (i.grandTotalINR - i.paidINR), 0);
    
    const count = dateFilteredInvoices.length;
    const pendingCount = dateFilteredInvoices.filter(i => i.paymentStatus !== 'paid').length;
    const avgTicket = count > 0 ? Math.round(totalCollected / (dateFilteredInvoices.filter(i => i.paidINR > 0).length || 1)) : 0;
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

    // Payment method breakdown
    let upiTotal = 0;
    let upiCount = 0;
    let cashTotal = 0;
    let cashCount = 0;
    let cardTotal = 0;
    let cardCount = 0;
    let bankTotal = 0;
    let bankCount = 0;

    // Category breakdown
    let consultationRevenue = 0;
    let medicineRevenue = 0;
    let cosmeticRevenue = 0;
    let otherRevenue = 0;

    // Item sales counts for top items
    const itemSales: Record<string, { name: string; revenue: number; qty: number; type: string }> = {};

    dateFilteredInvoices.forEach(inv => {
      if (inv.paidINR > 0) {
        if (inv.paymentMethod === 'upi') {
          upiTotal += inv.paidINR;
          upiCount += 1;
        } else if (inv.paymentMethod === 'cash') {
          cashTotal += inv.paidINR;
          cashCount += 1;
        } else if (inv.paymentMethod === 'card') {
          cardTotal += inv.paidINR;
          cardCount += 1;
        } else {
          bankTotal += inv.paidINR;
          bankCount += 1;
        }
      }

      // Check item categories
      inv.items.forEach(item => {
        if (item.type === 'consultation') consultationRevenue += item.totalINR;
        else if (item.type === 'medicine') medicineRevenue += item.totalINR;
        else if (item.type === 'cosmetic') cosmeticRevenue += item.totalINR;
        else otherRevenue += item.totalINR;

        // Tally item
        const key = item.description;
        if (!itemSales[key]) {
          itemSales[key] = { name: item.description, revenue: 0, qty: 0, type: item.type };
        }
        itemSales[key].revenue += item.totalINR;
        itemSales[key].qty += item.quantity;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Today specific quick metric
    const todayInvoicesList = invoices.filter(i => i.date === todayStr);
    const todayCollected = todayInvoicesList.reduce((sum, i) => sum + i.paidINR, 0);

    return {
      totalBilled,
      totalCollected,
      totalPending,
      pendingCount,
      count,
      avgTicket,
      collectionRate,
      todayCollected,
      upiTotal,
      upiCount,
      cashTotal,
      cashCount,
      cardTotal,
      cardCount,
      bankTotal,
      bankCount,
      consultationRevenue,
      medicineRevenue,
      cosmeticRevenue,
      otherRevenue,
      topItems
    };
  }, [dateFilteredInvoices, invoices, todayStr]);

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Receipt Number', 'Date', 'Patient Name', `Total (${currency})`, `Paid (${currency})`, `Balance Due (${currency})`, 'Status', 'Payment Method', 'Items Summary'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.receiptNumber || 'N/A',
      inv.date,
      `"${inv.patientName}"`,
      inv.grandTotalINR,
      inv.paidINR,
      inv.grandTotalINR - inv.paidINR,
      inv.paymentStatus,
      inv.paymentMethod,
      `"${inv.items.map(i => `${i.description} (x${i.quantity})`).join('; ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileTag = isReceptionist ? 'Today' : dateRangeFilter;
    link.setAttribute('download', `Clinic_Billing_Report_${fileTag}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Invoice calculations
  const calculateSubtotal = () => invoiceItems.reduce((sum, item) => sum + item.totalINR, 0);
  const calculateGrandTotal = () => Math.max(0, calculateSubtotal() - discountINR);

  const handleAddItem = (type: InvoiceItem['type'] = 'medicine') => {
    setInvoiceItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: type === 'cosmetic' 
          ? 'Berberis Aquifolium Skin Glow Cream (50g)' 
          : 'Homoeopathic Remedies Dispensed (14 Days Pack)',
        type,
        quantity: 1,
        unitPriceINR: type === 'cosmetic' ? 240 : 200,
        totalINR: type === 'cosmetic' ? 240 : 200,
      }
    ]);
  };

  const handleAddInventoryItemDirect = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    setInvoiceItems(prev => [
      ...prev,
      {
        id: `item-inv-${Date.now()}`,
        description: `${item.name} ${item.potency !== 'Neutral' ? item.potency : ''} (${item.unit})`.trim(),
        type: item.category === 'cosmetic' || item.category === 'skincare' ? 'cosmetic' : 'medicine',
        quantity: 1,
        unitPriceINR: item.unitPriceINR,
        totalINR: item.unitPriceINR,
      }
    ]);
    setSelectedInventoryToAdd('');
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      if (field === 'quantity' || field === 'unitPriceINR') {
        item.totalINR = Number(item.quantity) * Number(item.unitPriceINR);
      }
      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const subtotal = calculateSubtotal();
    const grandTotal = calculateGrandTotal();
    const paid = initialPaymentStatus === 'paid' ? grandTotal : 0;

    createInvoice({
      patientId: patient.id,
      patientName: patient.name,
      date: todayStr,
      items: invoiceItems,
      subtotalINR: subtotal,
      discountINR: Number(discountINR),
      taxINR: 0,
      grandTotalINR: grandTotal,
      paidINR: paid,
      paymentStatus: initialPaymentStatus,
      paymentMethod,
      notes: 'Generated at Clinic Counter',
    });

    setIsCreateModalOpen(false);
  };

  const handleOpenPaymentModal = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    const balanceDue = inv.grandTotalINR - inv.paidINR;
    setPaymentAmount(balanceDue);
    setPayMethod('upi');
    setPaymentTransactionRef('');
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoiceForPayment) return;
    recordPayment(selectedInvoiceForPayment.id, Number(paymentAmount), payMethod);
    setSelectedInvoiceForPayment(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Aesthetic Header */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                {isReceptionist ? "Today's Billing & Counter Collections" : "Billing & Revenue Intelligence"}
              </h2>
              {isReceptionist ? (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  Receptionist · Current Day Only
                </span>
              ) : (
                <span className="text-xs font-mono font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                  Complete Ledger ({currency})
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {isReceptionist
                ? "Current day register, invoice generation, patient receipts, and day-end closing. Complete historical & multi-month revenue reports are restricted to Doctor & Admin."
                : "Complete payment reports, tender breakdown, cosmetic sales tracking, and tax receipts."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsDailyReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              title="Print formal daily collection closing sheet"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Day-End Summary</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
              title={isReceptionist ? "Download today's payment ledger as CSV" : "Download payment ledger as spreadsheet CSV"}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isReceptionist ? "Export Today's CSV" : "Export CSV"}</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-700" />
              <span>Create New Bill</span>
            </button>
          </div>
        </div>

        {/* Date Filter Segmented Controls */}
        {isReceptionist ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                Current Day Only ({todayStr})
              </span>
              <span className="text-[11px] text-stone-500 hidden sm:inline">
                🔒 Historical reports (yesterday, weekly, monthly, lifetime) restricted to Doctor & Admin
              </span>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              Showing {filteredInvoices.length} transactions today
            </span>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100">
            <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1 rounded-xl">
              {(['today', 'yesterday', 'week', 'month', 'all', 'custom'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRangeFilter(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer ${
                    dateRangeFilter === range
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : range}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            {dateRangeFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-xl border border-stone-200 text-xs">
                <span className="text-[11px] text-stone-500 font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="text-xs px-2 py-0.5 rounded bg-white border border-stone-200 font-mono"
                />
                <span className="text-[11px] text-stone-500 font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="text-xs px-2 py-0.5 rounded bg-white border border-stone-200 font-mono"
                />
              </div>
            )}

            <span className="text-xs text-stone-400 font-mono">
              Showing {filteredInvoices.length} transactions
            </span>
          </div>
        )}
      </div>

      {/* Receptionist Access Policy Notice */}
      {isReceptionist && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
              🔒
            </div>
            <div>
              <span className="font-semibold text-amber-950">Receptionist Permission Policy:</span>
              <span className="text-amber-800 ml-1">
                You have active access to current day ({todayStr}) billing, payments, and day-end closing. Complete historical & lifetime revenue reports require Doctor or Admin authorization.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Complete Financial Overview Dashboard (Requirement #4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Realized Collections */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              {isReceptionist ? "Today's Collections" : "Realized Collections"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold font-mono">
              {currency}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs text-stone-400">{currency}</span>
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
              {financialSummary.totalCollected.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Realization Rate: <span className="font-semibold text-stone-800">{financialSummary.collectionRate}%</span>
          </p>
        </div>

        {/* Metric 2: Gross Invoiced Total */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              {isReceptionist ? "Today's Invoiced Total" : "Gross Invoiced Total"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs text-stone-400">{currency}</span>
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
              {financialSummary.totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Avg Bill: <span className="font-mono font-semibold">{currency}{financialSummary.avgTicket}</span> ({financialSummary.count} bills)
          </p>
        </div>

        {/* Metric 3: Pending Receivables */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              {isReceptionist ? "Today's Pending Due" : "Pending Receivables"}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              financialSummary.totalPending > 0 ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-stone-100 text-stone-500 border-stone-200/60'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs text-stone-400">{currency}</span>
            <span className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${financialSummary.totalPending > 0 ? 'text-amber-800' : 'text-stone-900'}`}>
              {financialSummary.totalPending.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            {financialSummary.pendingCount} unpaid patient balances
          </p>
        </div>

        {/* Metric 4: Cosmetic & Skincare Sales Ratio */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">
              {isReceptionist ? "Today's Cosmetics" : "Cosmetics & Skincare"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs text-stone-400">{currency}</span>
            <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tabular-nums">
              {financialSummary.cosmeticRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Creams, face washes & hair oils
          </p>
        </div>

      </div>

      {/* Payment Channel Breakdown & Service Category Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Channel Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                {isReceptionist ? "Today's Tender Mode" : "Payment Mode Tender"}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {isReceptionist ? "Today's collection by tender" : "Revenue collected by tender"}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-stone-800">
              {currency}{financialSummary.totalCollected.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* UPI */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>UPI / QR ({financialSummary.upiCount} txns)</span>
                </span>
                <span className="font-mono font-bold text-stone-900">
                  {currency}{financialSummary.upiTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all" 
                  style={{ width: `${financialSummary.totalCollected > 0 ? (financialSummary.upiTotal / financialSummary.totalCollected) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-500" />
                  <span>Cash in Register ({financialSummary.cashCount} txns)</span>
                </span>
                <span className="font-mono font-bold text-stone-900">
                  {currency}{financialSummary.cashTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-stone-500 h-full rounded-full transition-all" 
                  style={{ width: `${financialSummary.totalCollected > 0 ? (financialSummary.cashTotal / financialSummary.totalCollected) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cards */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-400" />
                  <span>Debit / Credit Cards ({financialSummary.cardCount} txns)</span>
                </span>
                <span className="font-mono font-bold text-stone-900">
                  {currency}{financialSummary.cardTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-stone-400 h-full rounded-full transition-all" 
                  style={{ width: `${financialSummary.totalCollected > 0 ? (financialSummary.cardTotal / financialSummary.totalCollected) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Service & Product Revenue Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                {isReceptionist ? "Today's Revenue by Category" : "Revenue by Category"}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {isReceptionist ? "Consultation, medicine & cosmetic split today" : "Consultations vs Medicines vs Cosmetics"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-600 mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-stone-700" />
                <span className="text-[11px] font-semibold">Doctor Fees</span>
              </div>
              <p className="text-base font-bold font-mono text-stone-900">
                {currency}{financialSummary.consultationRevenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-600 mb-1">
                <Package className="w-3.5 h-3.5 text-stone-700" />
                <span className="text-[11px] font-semibold">Medicines Dispensed</span>
              </div>
              <p className="text-base font-bold font-mono text-stone-900">
                {currency}{financialSummary.medicineRevenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-700 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-stone-700" />
                <span className="text-[11px] font-semibold">Cosmetic Products</span>
              </div>
              <p className="text-base font-bold font-mono text-stone-900">
                {currency}{financialSummary.cosmeticRevenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-600 mb-1">
                <Receipt className="w-3.5 h-3.5 text-stone-700" />
                <span className="text-[11px] font-semibold">Procedures / Other</span>
              </div>
              <p className="text-base font-bold font-mono text-stone-900">
                {currency}{financialSummary.otherRevenue.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Top 5 Revenue Contributing Items */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                {isReceptionist ? "Today's Top Items" : "Top Revenue Items"}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {isReceptionist ? "Highest value items billed today" : "Best performing services & products"}
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-stone-400" />
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {financialSummary.topItems.length === 0 ? (
              <p className="py-6 text-center text-stone-400 text-xs">No items billed in this period.</p>
            ) : (
              financialSummary.topItems.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div className="max-w-[160px] truncate">
                    <span className="font-semibold text-stone-800 truncate block">{item.name}</span>
                    <span className="text-[10px] text-stone-400 capitalize">{item.type} · {item.qty} units</span>
                  </div>
                  <span className="font-mono font-bold text-stone-900">
                    {currency}{item.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Invoices & Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
        
        {/* Table Filters Strip */}
        <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
              {(['all', 'paid', 'pending', 'partial'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
              {(['all', 'upi', 'cash', 'card'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setMethodFilter(method)}
                  className={`px-2.5 py-1 rounded-lg uppercase transition-colors cursor-pointer ${
                    methodFilter === method
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Item Type Filter */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setItemTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  itemTypeFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setItemTypeFilter('cosmetic')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  itemTypeFilter === 'cosmetic'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-stone-500" />
                <span>Cosmetics</span>
              </button>
              <button
                onClick={() => setItemTypeFilter('consultation')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  itemTypeFilter === 'consultation'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Consultations
              </button>
            </div>

          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice # or patient..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Ledger Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice & Ref</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Itemized Breakdown</th>
                <th className="py-3 px-4 text-right">Total ({currency})</th>
                <th className="py-3 px-4 text-right">Paid ({currency})</th>
                <th className="py-3 px-4">Status & Tender</th>
                <th className="py-3 px-4 text-right">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    No billing ledger records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const balanceDue = inv.grandTotalINR - inv.paidINR;
                  const hasCosmetic = inv.items.some(i => i.type === 'cosmetic');

                  return (
                    <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                      
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {inv.invoiceNumber}
                        {inv.receiptNumber && (
                          <span className="block text-[10px] text-stone-400 font-normal">{inv.receiptNumber}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {inv.patientName}
                      </td>

                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                        {inv.date}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-stone-600 max-w-xs">
                        <div className="flex items-center gap-1 flex-wrap">
                          {hasCosmetic && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-stone-100 text-stone-800">
                              <Sparkles className="w-2.5 h-2.5 text-stone-600" />
                              <span>Cosmetic</span>
                            </span>
                          )}
                          <span className="truncate">{inv.items.map(item => `${item.description} (x${item.quantity})`).join(', ')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 text-right">
                        {currency}{inv.grandTotalINR}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 text-right">
                        {currency}{inv.paidINR}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          inv.paymentStatus === 'paid' ? 'bg-stone-100 text-stone-800 border border-stone-200' :
                          inv.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                        {inv.paymentMethod && (
                          <span className="block text-[10px] text-stone-400 uppercase mt-0.5 font-mono">
                            {inv.paymentMethod}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="px-2.5 py-1 text-[11px] font-bold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200/90 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3 text-indigo-700" />
                              <span>Collect {currency}{balanceDue}</span>
                            </button>
                          )}

                          <button
                            onClick={() => openInvoicePrint(inv)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title="Print Formal Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Collection & Live UPI QR Modal */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-base font-bold text-stone-900">Receive Payment</h3>
              <button
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Patient: <span className="font-bold text-stone-800">{selectedInvoiceForPayment.patientName}</span> · {selectedInvoiceForPayment.invoiceNumber}
            </p>

            <div className="my-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-xs text-stone-600 block">Balance Payable:</span>
              <span className="text-3xl font-bold font-mono text-stone-900">
                {currency}{selectedInvoiceForPayment.grandTotalINR - selectedInvoiceForPayment.paidINR}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['upi', 'cash', 'card'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`py-2 text-xs font-semibold rounded-xl border uppercase transition-all cursor-pointer ${
                    payMethod === m
                      ? 'border-indigo-400 bg-indigo-100 text-indigo-950 font-bold shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* UPI QR Display */}
            {payMethod === 'upi' && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 my-4 text-center">
                <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto border border-stone-200 shadow-2xs flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId || 'homoeocare@icici'}&pn=${encodeURIComponent(settings.upiPayeeName || settings.clinicName)}&am=${paymentAmount}&cu=INR`)}`}
                    alt="UPI Payment QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] font-mono text-stone-600 mt-2">
                  VPA: <span className="font-bold text-stone-900">{settings.upiId || 'homoeocare@icici'}</span>
                </p>
                <p className="text-[10px] text-stone-400">Scan via GPay, PhonePe, Paytm or BHIM</p>
              </div>
            )}

            {/* Amount input */}
            <div className="text-left mb-3">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tender Amount Received ({currency}):</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl border border-stone-200 bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-2.5 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl shadow-2xs cursor-pointer"
              >
                Confirm & Issue Receipt
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create New Bill Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-2xl w-full p-6 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">Create Patient Bill & Invoice</h3>
                <p className="text-xs text-stone-500">Consultation fees, medicines & cosmetic products</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientId}) · {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Add from Inventory (Cosmetic / Medicine) */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Quick Pick from Dispensary / Cosmetics Shelf:
                  </label>
                  <select
                    value={selectedInventoryToAdd}
                    onChange={e => setSelectedInventoryToAdd(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="">-- Choose medicine or cosmetic product --</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        [{item.category.toUpperCase()}] {item.name} {item.potency !== 'Neutral' ? item.potency : ''} - {currency}{item.unitPriceINR} (Stock: {item.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!selectedInventoryToAdd}
                  onClick={() => handleAddInventoryItemDirect(selectedInventoryToAdd)}
                  className="w-full sm:w-auto mt-4 sm:mt-4 px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 disabled:opacity-40 rounded-lg cursor-pointer"
                >
                  + Add to Bill
                </button>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Bill Line Items</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem('medicine')}
                      className="text-xs text-stone-700 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Medicine</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('cosmetic')}
                      className="text-xs text-stone-700 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                      <span>+ Cosmetic Product</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {invoiceItems.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2">
                      <select
                        value={item.type}
                        onChange={e => handleUpdateItem(idx, 'type', e.target.value)}
                        className="text-[10px] font-semibold uppercase px-2 py-1.5 rounded-lg border border-stone-200 bg-white"
                      >
                        <option value="consultation">Consult</option>
                        <option value="medicine">Medicine</option>
                        <option value="cosmetic">Cosmetic</option>
                        <option value="other">Other</option>
                      </select>

                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                        placeholder="Item description..."
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                        className="w-12 text-xs font-mono px-2 py-1.5 rounded-lg border border-stone-200 bg-white text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        value={item.unitPriceINR}
                        onChange={e => handleUpdateItem(idx, 'unitPriceINR', Number(e.target.value))}
                        placeholder="Price"
                        className="w-18 text-xs font-mono font-bold px-2 py-1.5 rounded-lg border border-stone-200 bg-white text-right"
                      />
                      <span className="text-xs font-mono font-bold text-stone-900 w-16 text-right">
                        {currency}{item.totalINR}
                      </span>
                      {invoiceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-stone-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount & Totals */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="font-mono font-bold text-stone-900">{currency}{calculateSubtotal()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Concession / Discount ({currency}):</span>
                  <input
                    type="number"
                    min="0"
                    value={discountINR}
                    onChange={e => setDiscountINR(Number(e.target.value))}
                    className="w-24 text-xs font-mono px-2 py-1 rounded-lg border border-stone-200 bg-white text-right"
                  />
                </div>

                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                  <span>Grand Total Payable:</span>
                  <span className="font-mono text-stone-900">{currency}{calculateGrandTotal()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Status</label>
                  <select
                    value={initialPaymentStatus}
                    onChange={e => setInitialPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 capitalize"
                  >
                    <option value="paid">Paid (Collected in Full)</option>
                    <option value="pending">Pending (Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 capitalize"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="bank-transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl shadow-2xs cursor-pointer"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day-End Summary Printable Report Modal */}
      {isDailyReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full p-8 my-8 print:m-0 print:p-6 print:border-none print:shadow-none print:w-full">
            
            <div className="no-print flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-850">Day-End Financial Collection Report</h3>
                <p className="text-xs text-slate-500">Official cash register and UPI settlement reconciliation</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={() => setIsDailyReportOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Header */}
            <div className="text-center pb-5 border-b-2 border-indigo-200">
              <h2 className="text-xl font-black text-slate-800">{settings.clinicName}</h2>
              <p className="text-xs text-slate-500">{settings.address} · Phone: {settings.phone}</p>
              <div className="mt-2 inline-block bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold text-indigo-900">
                DAILY FINANCIAL SETTLEMENT SUMMARY — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-3 my-5 text-center">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 block uppercase">Cash in Register</span>
                <span className="text-lg font-bold font-mono text-stone-900">
                  {currency}{financialSummary.cashTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">{financialSummary.cashCount} transactions</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 block uppercase">UPI Realized</span>
                <span className="text-lg font-bold font-mono text-stone-900">
                  {currency}{financialSummary.upiTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">{financialSummary.upiCount} transactions</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 block uppercase">Total Collections</span>
                <span className="text-lg font-bold font-mono text-stone-900">
                  {currency}{financialSummary.totalCollected.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">{financialSummary.count} total bills</span>
              </div>
            </div>

            {/* Category Revenue Breakdown */}
            <div className="mb-5 text-xs">
              <h4 className="font-bold text-stone-900 uppercase text-[11px] mb-2">Category Breakdown</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-stone-50 rounded-lg">
                  <span className="text-stone-500 block">Consultations:</span>
                  <span className="font-mono font-bold text-stone-900">{currency}{financialSummary.consultationRevenue}</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg">
                  <span className="text-stone-500 block">Medicines Dispensed:</span>
                  <span className="font-mono font-bold text-stone-900">{currency}{financialSummary.medicineRevenue}</span>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg">
                  <span className="text-stone-500 block">Cosmetics & Skincare:</span>
                  <span className="font-mono font-bold text-stone-900">{currency}{financialSummary.cosmeticRevenue}</span>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="border border-stone-200 rounded-xl overflow-hidden mb-6 text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Invoice #</th>
                    <th className="p-2">Patient</th>
                    <th className="p-2">Tender</th>
                    <th className="p-2 text-right">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredInvoices.slice(0, 10).map(inv => (
                    <tr key={inv.id}>
                      <td className="p-2 font-mono">{inv.invoiceNumber}</td>
                      <td className="p-2 font-medium">{inv.patientName}</td>
                      <td className="p-2 uppercase font-mono text-[10px]">{inv.paymentMethod}</td>
                      <td className="p-2 text-right font-mono font-bold">{currency}{inv.paidINR}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sign-off box */}
            <div className="pt-6 border-t border-dashed border-stone-300 flex justify-between text-xs">
              <div>
                <p className="text-stone-400 text-[10px]">Prepared by Cashier / Reception:</p>
                <div className="w-40 border-b border-stone-300 mt-4 mb-1" />
                <p className="text-stone-600 text-[11px]">Reception Staff</p>
              </div>

              <div className="text-right">
                <p className="text-stone-400 text-[10px]">Verified & Settled by Doctor:</p>
                <div className="w-40 border-b border-stone-300 mt-4 mb-1 ml-auto" />
                <p className="font-bold text-stone-800 text-[11px]">{settings.doctorName}</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

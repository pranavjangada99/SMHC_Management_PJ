import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { InventoryItem, MedicineCategory } from '../../types/clinic';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  CheckCircle2,
  IndianRupee, 
  Sparkles,
  Filter, 
  Edit3, 
  Layers,
  Heart,
  Tag,
  ArrowRight,
  TrendingUp,
  X,
  Bell,
  BellRing,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { 
    inventory, 
    addInventoryItem, 
    adjustInventory, 
    updateInventoryStock, 
    settings,
    updateSettings,
    addCustomCategory,
    createInvoice,
    patients 
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOtcSaleModalOpen, setIsOtcSaleModalOpen] = useState(false);
  const [otcItemToSell, setOtcItemToSell] = useState<InventoryItem | null>(null);
  const [otcQuantity, setOtcQuantity] = useState<number>(1);
  const [otcPatientId, setOtcPatientId] = useState<string>(patients[0]?.id || '');
  const [otcPaymentMethod, setOtcPaymentMethod] = useState<'cash' | 'upi' | 'card'>('upi');

  // Configurable Low Stock Alert Threshold State
  const [threshold, setThreshold] = useState<number>(settings.lowStockThreshold ?? 5);
  const [thresholdMode, setThresholdMode] = useState<'global' | 'item-specific' | 'combined'>(settings.lowStockThresholdMode || 'global');
  const [isThresholdConfigOpen, setIsThresholdConfigOpen] = useState(false);
  const [savedThresholdNotice, setSavedThresholdNotice] = useState<string | null>(null);
  const [editingStockItemId, setEditingStockItemId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);

  // Helper function to test if an item is considered low on stock based on configurable threshold
  const isItemLowStock = (item: InventoryItem) => {
    if (thresholdMode === 'item-specific') {
      return item.currentStock <= item.minReorderLevel;
    }
    if (thresholdMode === 'combined') {
      return item.currentStock <= threshold || item.currentStock <= item.minReorderLevel;
    }
    return item.currentStock <= threshold;
  };

  // Items currently running low
  const lowStockItems = inventory.filter(isItemLowStock);
  const lowStockCount = lowStockItems.length;

  // Save configurable threshold to persistent clinic settings
  const handleSaveThresholdAsDefault = () => {
    updateSettings({
      lowStockThreshold: threshold,
      lowStockThresholdMode: thresholdMode,
    });
    setSavedThresholdNotice(`Threshold (≤ ${thresholdMode === 'item-specific' ? 'Reorder Level' : `${threshold} units`}) saved as clinic default!`);
    setTimeout(() => setSavedThresholdNotice(null), 3000);
  };

  // Quick inline stock updater
  const handleQuickStockSave = (itemId: string) => {
    if (editingStockValue >= 0) {
      updateInventoryStock(itemId, editingStockValue);
    }
    setEditingStockItemId(null);
  };

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MedicineCategory>('cosmetic');
  const [newItemSubCategory, setNewItemSubCategory] = useState('Face Cream');
  const [newItemPotency, setNewItemPotency] = useState('Herbal Formulation');
  const [newItemUnit, setNewItemUnit] = useState('50g jar');
  const [newItemStock, setNewItemStock] = useState<number>(15);
  const [newItemReorder, setNewItemReorder] = useState<number>(4);
  const [newItemPrice, setNewItemPrice] = useState<number>(240);
  const [newItemCostPrice, setNewItemCostPrice] = useState<number>(160);
  const [newItemBatch, setNewItemBatch] = useState('COS-2026-01');
  const [newItemExpiry, setNewItemExpiry] = useState('2028-12');
  const [newItemSupplier, setNewItemSupplier] = useState('SBL Sharda Boiron Labs');
  const [newItemBrand, setNewItemBrand] = useState('SBL Labs');
  const [newItemCosmeticBenefit, setNewItemCosmeticBenefit] = useState('Natural complexion glow, reduces dark spots and blemishes');

  // Custom new category inline
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState('');
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);

  // Filter items
  const filteredInventory = inventory.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(q) ||
                          item.potency.toLowerCase().includes(q) ||
                          (item.supplier && item.supplier.toLowerCase().includes(q)) ||
                          (item.brand && item.brand.toLowerCase().includes(q)) ||
                          (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
                          (item.cosmeticBenefit && item.cosmeticBenefit.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'all' || 
                            item.category === categoryFilter ||
                            (categoryFilter === 'cosmetics-only' && (item.category === 'cosmetic' || item.category === 'skincare'));

    const matchesLowStock = !showLowStockOnly || isItemLowStock(item);

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const totalValuationINR = inventory.reduce((sum, i) => sum + (i.currentStock * i.unitPriceINR), 0);
  const cosmeticItems = inventory.filter(i => i.category === 'cosmetic' || i.category === 'skincare');
  const cosmeticValuationINR = cosmeticItems.reduce((sum, i) => sum + (i.currentStock * i.unitPriceINR), 0);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addInventoryItem({
      name: newItemName.trim(),
      category: newItemCategory,
      subCategory: newItemSubCategory.trim() || undefined,
      potency: newItemPotency.trim(),
      unit: newItemUnit.trim(),
      currentStock: Number(newItemStock),
      minReorderLevel: Number(newItemReorder),
      unitPriceINR: Number(newItemPrice),
      purchasePriceINR: Number(newItemCostPrice) || undefined,
      batchNumber: newItemBatch.trim() || undefined,
      expiryDate: newItemExpiry.trim() || undefined,
      supplier: newItemSupplier.trim() || undefined,
      brand: newItemBrand.trim() || undefined,
      cosmeticBenefit: newItemCosmeticBenefit.trim() || undefined,
    });

    // Reset and close
    setNewItemName('');
    setIsAddModalOpen(false);
  };

  const handleAddCategorySubmit = () => {
    if (newCustomCategoryInput.trim()) {
      addCustomCategory(newCustomCategoryInput.trim());
      setNewCustomCategoryInput('');
      setShowAddCategoryInline(false);
    }
  };

  const handleQuickOtcSell = (item: InventoryItem) => {
    setOtcItemToSell(item);
    setOtcQuantity(1);
    setIsOtcSaleModalOpen(true);
  };

  const handleConfirmOtcSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otcItemToSell) return;

    const patient = patients.find(p => p.id === otcPatientId) || patients[0];
    const qty = Math.min(otcItemToSell.currentStock, Math.max(1, Number(otcQuantity)));
    const total = qty * otcItemToSell.unitPriceINR;

    // Deduct stock
    adjustInventory(otcItemToSell.id, -qty);

    // Create bill
    createInvoice({
      patientId: patient?.id || 'otc',
      patientName: patient?.name || 'Walk-in Counter Customer',
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          id: `otc-${Date.now()}`,
          description: `${otcItemToSell.name} (${otcItemToSell.unit})`,
          type: otcItemToSell.category === 'cosmetic' || otcItemToSell.category === 'skincare' ? 'cosmetic' : 'medicine',
          quantity: qty,
          unitPriceINR: otcItemToSell.unitPriceINR,
          totalINR: total,
        }
      ],
      subtotalINR: total,
      discountINR: 0,
      taxINR: 0,
      grandTotalINR: total,
      paidINR: total,
      paymentStatus: 'paid',
      paymentMethod: otcPaymentMethod,
      notes: 'OTC Counter Product Sale',
    });

    setIsOtcSaleModalOpen(false);
    setOtcItemToSell(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Aesthetic Header */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">Dispensary & Cosmetic Shelf</h2>
              <span className="text-xs font-mono font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                {inventory.length} total items
              </span>

              {/* Dynamic Low Stock Notification Badge in Header */}
              {lowStockCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                    showLowStockOnly
                      ? 'bg-rose-700 text-white border-rose-800 ring-2 ring-rose-200 shadow-xs'
                      : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  }`}
                  title="Click to toggle filter for low stock medicines"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                  <BellRing className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>
                    {lowStockCount} Low Stock Alert (≤ {thresholdMode === 'item-specific' ? 'Reorder Level' : `${threshold} units`})
                  </span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stock Optimal (Threshold: ≤ {threshold})</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Homoeopathic remedies, herbal cosmetic skincare, hair oils, and clinical supplies inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Configurable Threshold Toggle Button */}
            <button
              type="button"
              onClick={() => setIsThresholdConfigOpen(!isThresholdConfigOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isThresholdConfigOpen
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-bold'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs'
              }`}
              title="Configure low stock threshold and alert rules"
            >
              <SlidersHorizontal className="w-4 h-4 text-stone-600" />
              <span>Threshold: ≤ {thresholdMode === 'item-specific' ? 'Reorder Level' : `${threshold} units`}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isThresholdConfigOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-700" />
              <span>Add Product / Medicine</span>
            </button>
          </div>
        </div>

        {/* Configurable Threshold Control Panel */}
        {isThresholdConfigOpen && (
          <div className="mt-4 pt-4 border-t border-stone-200 bg-amber-50/40 rounded-xl p-4 border border-amber-200/70 space-y-3.5 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Configurable Low Stock Alert Threshold
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {savedThresholdNotice && (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    {savedThresholdNotice}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsThresholdConfigOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
                  title="Close threshold configuration"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Stepper & Numeric Input */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Alert Quantity Threshold (Units)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setThreshold(prev => Math.max(1, prev - 1))}
                    disabled={threshold <= 1}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={threshold}
                      onChange={e => setThreshold(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full text-center font-mono font-bold text-sm px-2 py-1.5 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setThreshold(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 5, 8, 10, 15, 20].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setThreshold(val)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                        threshold === val
                          ? 'bg-amber-600 text-white shadow-2xs font-bold'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      ≤ {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evaluation Mode */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Threshold Rule Mode
                </label>
                <select
                  value={thresholdMode}
                  onChange={e => setThresholdMode(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white focus:outline-hidden font-medium text-stone-800"
                >
                  <option value="global">Global Limit (Stock ≤ {threshold} units)</option>
                  <option value="item-specific">Item Reorder Level (Item's Own Min)</option>
                  <option value="combined">Combined Rule (Stock ≤ {threshold} OR Reorder Level)</option>
                </select>
              </div>
            </div>

            {/* Live Status & Save Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-900 font-medium">
                  Live Status: <strong className="font-bold text-amber-950 font-mono">{lowStockCount}</strong> of <span className="font-mono">{inventory.length}</span> items currently triggered.
                </span>
                {lowStockCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                    Badge Alert Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveThresholdAsDefault}
                  className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save as Clinic Default</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Valuation & Cosmetic Shelf Overview Strip */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-100">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-stone-500">Total Stock Valuation</p>
              <p className="text-base font-bold text-stone-900 font-mono">₹{totalValuationINR.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>

          <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <p className="text-[11px] font-semibold text-purple-900">Cosmetics & Skincare Shelf</p>
              </div>
              <p className="text-base font-bold text-purple-950 font-mono">
                ₹{cosmeticValuationINR.toLocaleString('en-IN')} <span className="text-xs font-normal text-purple-700">({cosmeticItems.length} products)</span>
              </p>
            </div>
            <button
              onClick={() => setCategoryFilter('cosmetics-only')}
              className="text-[11px] font-semibold text-purple-800 hover:text-purple-950 underline cursor-pointer"
            >
              Filter →
            </button>
          </div>

          <div 
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              lowStockCount > 0 
                ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70' 
                : 'bg-stone-50 border-stone-100 hover:bg-stone-100/80'
            }`}
            title="Click to toggle low stock filter"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] text-stone-500 font-medium">Stock Below Threshold</p>
                <span className="text-[10px] font-mono font-bold text-stone-500 bg-white/80 px-1.5 py-0.2 rounded border border-stone-200">
                  ≤ {thresholdMode === 'item-specific' ? 'Reorder' : `${threshold} units`}
                </span>
              </div>
              <p className={`text-base font-bold font-mono ${lowStockCount > 0 ? 'text-rose-700' : 'text-stone-900'}`}>
                {lowStockCount} items low
              </p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-stone-200 text-stone-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Dynamic Category Filters & Search */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              All Items
            </button>

            <button
              onClick={() => setCategoryFilter('cosmetics-only')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'cosmetics-only'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs font-semibold'
                  : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>Cosmetics & Skincare ({cosmeticItems.length})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('dilution')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                categoryFilter === 'dilution'
                  ? 'bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              Dilutions
            </button>

            <button
              onClick={() => setCategoryFilter('mother-tincture')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                categoryFilter === 'mother-tincture'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              Mother Tinctures
            </button>

            <button
              onClick={() => setCategoryFilter('biochemic')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                categoryFilter === 'biochemic'
                  ? 'bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              Biochemic
            </button>

            {/* Notification Badge Button in Filter Bar */}
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ml-1 cursor-pointer flex items-center gap-1.5 ${
                showLowStockOnly
                  ? 'bg-rose-700 text-white shadow-xs font-bold'
                  : lowStockCount > 0
                    ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-stone-400'}`} />
              <span>Low Stock Alert ({lowStockCount})</span>
              <span className="text-[10px] font-mono opacity-80">
                [≤ {thresholdMode === 'item-specific' ? 'Min' : threshold}]
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, benefit, brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden"
            />
          </div>

        </div>
      </div>

      {/* Prominent Low Stock Alert Banner (Visible when items run low) */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50/60 to-orange-50 border border-rose-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-rose-950">
                    Low Stock Alert: {lowStockCount} {lowStockCount === 1 ? 'medicine is' : 'medicines are'} running low on stock
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 text-rose-900 border border-rose-300">
                    Threshold: ≤ {thresholdMode === 'item-specific' ? 'Item Reorder Level' : `${threshold} units`}
                  </span>
                </div>
                <p className="text-xs text-rose-800/90 mt-0.5">
                  These medicines have reached or fallen below your configured inventory threshold. Replenish promptly to avoid prescription dispensary delays.
                </p>

                {/* Quick Remedy Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[11px] font-semibold text-rose-900 mr-1">Running low:</span>
                  {lowStockItems.slice(0, 5).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSearchQuery(item.name)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white/90 hover:bg-white text-rose-900 border border-rose-200 shadow-2xs cursor-pointer transition-colors"
                      title={`Filter to ${item.name}`}
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="font-mono text-rose-700 font-bold bg-rose-100 px-1 py-0.2 rounded text-[10px]">
                        {item.currentStock} left
                      </span>
                    </button>
                  ))}
                  {lowStockItems.length > 5 && (
                    <span className="text-xs text-rose-700 font-semibold self-center">
                      +{lowStockItems.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs ${
                  showLowStockOnly
                    ? 'bg-rose-700 text-white hover:bg-rose-800 shadow-xs'
                    : 'bg-white text-rose-900 border border-rose-300 hover:bg-rose-50'
                }`}
              >
                {showLowStockOnly ? 'Show All Products' : `Filter Low Stock Only (${lowStockCount})`}
              </button>
              <button
                type="button"
                onClick={() => setIsThresholdConfigOpen(true)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white/80 hover:bg-white text-stone-700 border border-stone-200 transition-colors cursor-pointer"
              >
                Adjust Threshold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Items Grid */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Product / Remedy</th>
                <th className="py-3 px-4">Category & Type</th>
                <th className="py-3 px-4">Unit / Volume</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Selling Price (₹)</th>
                <th className="py-3 px-4">Batch / Expiry</th>
                <th className="py-3 px-4">Benefit / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const isLow = isItemLowStock(item);
                  const isCritical = item.currentStock === 0 || (isLow && item.currentStock <= 2);
                  const isCosmetic = item.category === 'cosmetic' || item.category === 'skincare';
                  const isEditingStock = editingStockItemId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        isCritical
                          ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-600'
                          : isLow
                            ? 'bg-amber-50/40 hover:bg-amber-100/50 border-l-4 border-l-amber-500'
                            : 'hover:bg-stone-50/70'
                      }`}
                    >
                      
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isCosmetic && <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                          <span>{item.name}</span>

                          {/* Highlight notification badges */}
                          {item.currentStock === 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white shadow-2xs">
                              Out of Stock
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Critical Low
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Low Stock
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-stone-400 font-normal mt-0.5">
                          {item.brand ? <span className="font-medium text-stone-600">{item.brand}</span> : item.supplier}
                          {item.potency !== 'Neutral' && item.potency !== 'Herbal Formulation' && ` · ${item.potency}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isCosmetic ? 'bg-purple-50 text-purple-900 border border-purple-200' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {item.subCategory || item.category.replace('-', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600 font-mono">
                        {item.unit}
                      </td>

                      <td className="py-3.5 px-4">
                        {isEditingStock ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={editingStockValue}
                              onChange={e => setEditingStockValue(Number(e.target.value))}
                              className="w-16 px-1.5 py-1 text-xs font-mono font-bold border border-indigo-400 rounded bg-white text-stone-900 focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickStockSave(item.id)}
                              className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                              title="Save stock"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockItemId(null)}
                              className="p-1 rounded bg-stone-200 text-stone-600 hover:bg-stone-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-mono font-bold text-sm ${
                              isCritical 
                                ? 'text-rose-700 font-black' 
                                : isLow 
                                  ? 'text-amber-800' 
                                  : 'text-stone-900'
                            }`}>
                              {item.currentStock}
                            </span>

                            {/* Notification Badge on Stock Cell */}
                            {isLow && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                                isCritical
                                  ? 'text-rose-800 bg-rose-100 border-rose-300'
                                  : 'text-amber-800 bg-amber-100 border-amber-300'
                              }`}>
                                ≤ {thresholdMode === 'item-specific' ? `Min (${item.minReorderLevel})` : `${threshold} units`}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        ₹{item.unitPriceINR}
                        {item.purchasePriceINR && (
                          <span className="block text-[10px] text-stone-400 font-normal">Cost: ₹{item.purchasePriceINR}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-stone-500 font-mono">
                        {item.batchNumber && <div>{item.batchNumber}</div>}
                        {item.expiryDate && <div className="text-stone-400">Exp: {item.expiryDate}</div>}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-stone-600 max-w-xs">
                        {item.cosmeticBenefit ? (
                          <span className="text-purple-950 italic">{item.cosmeticBenefit}</span>
                        ) : (
                          <span className="text-stone-400">Standard dispensary formulation</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* OTC Sell button */}
                          <button
                            onClick={() => handleQuickOtcSell(item)}
                            title="Sell over counter and create bill"
                            className="px-2 py-1 text-[11px] font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Sell OTC
                          </button>

                          {/* Quick inline edit stock toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStockItemId(item.id);
                              setEditingStockValue(item.currentStock);
                            }}
                            title="Set exact stock level"
                            className="w-7 h-7 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => adjustInventory(item.id, -1)}
                            disabled={item.currentStock <= 0}
                            title="Deduct 1 unit"
                            className="w-7 h-7 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            -1
                          </button>

                          <button
                            onClick={() => adjustInventory(item.id, 5)}
                            title="Quick restock +5 units"
                            className={`w-7 h-7 rounded-lg border font-bold flex items-center justify-center transition-colors cursor-pointer text-xs ${
                              isLow
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200 font-black'
                                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            +5
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

      {/* Quick OTC Sell Modal */}
      {isOtcSaleModalOpen && otcItemToSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">Over-the-Counter (OTC) Sale</h3>
                <p className="text-xs text-stone-500">Quick product billing & inventory deduction</p>
              </div>
              <button
                onClick={() => setIsOtcSaleModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOtcSale} className="space-y-4">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <p className="text-xs font-bold text-stone-900">{otcItemToSell.name}</p>
                <p className="text-[11px] text-stone-500">
                  Rate: ₹{otcItemToSell.unitPriceINR} per {otcItemToSell.unit} · Stock Available: {otcItemToSell.currentStock}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Customer / Patient</label>
                <select
                  value={otcPatientId}
                  onChange={e => setOtcPatientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patientId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={otcItemToSell.currentStock}
                    value={otcQuantity}
                    onChange={e => setOtcQuantity(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Payment Tender</label>
                  <select
                    value={otcPaymentMethod}
                    onChange={e => setOtcPaymentMethod(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 uppercase"
                  >
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-stone-100 rounded-xl flex justify-between items-center text-sm font-bold text-stone-900">
                <span>Total Due:</span>
                <span className="font-mono text-base">₹{otcQuantity * otcItemToSell.unitPriceINR}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOtcSaleModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-indigo-950 bg-indigo-100/90 hover:bg-indigo-200/90 border border-indigo-200/90 rounded-xl shadow-2xs cursor-pointer"
                >
                  Confirm & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product / Medicine Modal with Cosmetic Support */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-lg w-full p-6 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">Add Product to Inventory</h3>
                <p className="text-xs text-stone-500">Homoeopathic medicine or cosmetic skincare item</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product / Remedy Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Berberis Aquifolium Skin Glow Cream / Arnica Hair Oil"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value as MedicineCategory)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 capitalize"
                  >
                    <option value="cosmetic">Cosmetic & Aesthetic</option>
                    <option value="skincare">Skincare & Dermatological</option>
                    <option value="dilution">Dilution</option>
                    <option value="mother-tincture">Mother Tincture (Q)</option>
                    <option value="biochemic">Biochemic Salts</option>
                    <option value="supplement">Nutritional Supplement</option>
                    <option value="globules">Sugar Globules</option>
                    <option value="bottle">Dispensing Phials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Sub-Type / Product Form</label>
                  <input
                    type="text"
                    placeholder="e.g. Face Cream, Hair Oil, Face Wash, Serum, Shampoo"
                    value={newItemSubCategory}
                    onChange={e => setNewItemSubCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. SBL, Wheezal, Dr. Reckeweg, Bakson"
                    value={newItemBrand}
                    onChange={e => setNewItemBrand(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Packaging / Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. 50g jar, 100ml bottle, 30ml phial"
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              {/* Cosmetic Benefit Notes */}
              {(newItemCategory === 'cosmetic' || newItemCategory === 'skincare') && (
                <div>
                  <label className="block text-xs font-semibold text-purple-900 mb-1">
                    Skin / Hair Benefit Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clears acne marks, boosts natural glow, anti-dandruff"
                    value={newItemCosmeticBenefit}
                    onChange={e => setNewItemCosmeticBenefit(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-purple-950"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={e => setNewItemStock(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Min Reorder</label>
                  <input
                    type="number"
                    value={newItemReorder}
                    onChange={e => setNewItemReorder(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Selling MRP (₹)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={newItemCostPrice}
                    onChange={e => setNewItemCostPrice(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={newItemBatch}
                    onChange={e => setNewItemBatch(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Expiry (YYYY-MM)</label>
                  <input
                    type="text"
                    value={newItemExpiry}
                    onChange={e => setNewItemExpiry(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-stone-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-xl shadow-2xs cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

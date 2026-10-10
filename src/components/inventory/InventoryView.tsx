import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { InventoryItem, MedicineCategory } from '../../types/clinic';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  IndianRupee, 
  Sparkles,
  Filter, 
  Edit3, 
  Layers,
  Heart,
  Tag,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { 
    inventory, 
    addInventoryItem, 
    adjustInventory, 
    updateInventoryStock, 
    settings,
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

    const matchesLowStock = !showLowStockOnly || item.currentStock <= item.minReorderLevel;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockCount = inventory.filter(i => i.currentStock <= i.minReorderLevel).length;
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">Dispensary & Cosmetic Shelf</h2>
              <span className="text-xs font-mono font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                {inventory.length} total items
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Homoeopathic remedies, herbal cosmetic skincare, hair oils, and clinical supplies inventory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-700" />
              <span>Add Product / Medicine</span>
            </button>
          </div>
        </div>

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

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-stone-500">Below Reorder Level</p>
              <p className={`text-base font-bold font-mono ${lowStockCount > 0 ? 'text-amber-700' : 'text-stone-900'}`}>
                {lowStockCount} items low
              </p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-700'}`}>
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

            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ml-1 cursor-pointer ${
                showLowStockOnly
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Low Stock Alert ({lowStockCount})
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
                  const isLow = item.currentStock <= item.minReorderLevel;
                  const isCosmetic = item.category === 'cosmetic' || item.category === 'skincare';

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        <div className="flex items-center gap-1.5">
                          {isCosmetic && <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-normal">
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
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${isLow ? 'text-rose-600' : 'text-stone-900'}`}>
                            {item.currentStock}
                          </span>
                          {isLow && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Low (Min {item.minReorderLevel})
                            </span>
                          )}
                        </div>
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
                            title="Restock +5 units"
                            className="w-7 h-7 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
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

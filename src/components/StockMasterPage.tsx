import React, { useState } from 'react';
import { Edit2, Plus, Search } from 'lucide-react';
import type { StockItem, User } from '../types/gatepass';
import { formatINR } from '../utils/calculations';

interface StockMasterPageProps {
  stockItems: StockItem[];
  currentUser: User;
  onSaveStockItem: (
    item: Partial<StockItem> & { stockNo: string; description: string }
  ) => Promise<boolean>;
}

export function StockMasterPage({
  stockItems,
  currentUser,
  onSaveStockItem,
}: StockMasterPageProps) {
  const canEdit =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'SUPERVISOR' ||
    currentUser.role === 'OPERATOR';

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [stockNo, setStockNo] = useState('');
  const [description, setDescription] = useState('');
  const [uom, setUom] = useState('NOS');
  const [hsnCode, setHsnCode] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [category, setCategory] = useState('General');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const filtered = stockItems.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.stockNo.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.hsnCode.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setEditingId(undefined);
    setStockNo('');
    setDescription('');
    setUom('NOS');
    setHsnCode('');
    setUnitPrice(0);
    setTaxPercent(18);
    setCategory('General');
    setActive(true);
  };

  const handleEdit = (s: StockItem) => {
    setEditingId(s.id);
    setStockNo(s.stockNo);
    setDescription(s.description);
    setUom(s.uom);
    setHsnCode(s.hsnCode);
    setUnitPrice(s.unitPrice);
    setTaxPercent(s.taxPercent);
    setCategory(s.category);
    setActive(s.active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const ok = await onSaveStockItem({
        id: editingId,
        stockNo,
        description,
        uom,
        hsnCode,
        unitPrice,
        taxPercent,
        category,
        active,
      });
      if (ok) resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1C2130]">Stock / Item Master</h1>
        <p className="text-xs text-[#5A627A] mt-0.5">
          Catalog of reference items for instant auto-population of Description, UOM, HSN Code, and Price/Unit in Gate Passes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form */}
        <div className="lg:col-span-4 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1C2130]">
              {editingId ? 'Edit Stock Item' : 'Add Stock Item'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-[#2B3352] hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#2E354A] mb-1">
                Stock No <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={stockNo}
                onChange={(e) => setStockNo(e.target.value.toUpperCase())}
                placeholder="e.g. NS-HYD-105"
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono uppercase focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">
                Description <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                rows={2}
                required
                disabled={!canEdit}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Item technical specification"
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2E354A] mb-1">UOM</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={uom}
                  onChange={(e) => setUom(e.target.value.toUpperCase())}
                  placeholder="NOS / SET / KG"
                  className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 uppercase focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2E354A] mb-1">HSN Code</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="84812000"
                  className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Price / Unit (Rs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!canEdit}
                value={unitPrice}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono text-right focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Category</label>
              <input
                type="text"
                disabled={!canEdit}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Hydraulics / Electrical / Metrology"
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
            </div>

            <label className="inline-flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-[#2B3352]"
              />
              <span className="font-semibold text-[#1C2130]">Active in Item Autocomplete</span>
            </label>

            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-[#2B3352] py-2 px-4 text-xs font-bold text-white hover:bg-[#1E243B] disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : editingId ? 'Update Stock Item' : 'Add Stock Item'}
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-8 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-2.5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#1C2130]">
              Catalog Items ({filtered.length})
            </h2>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stock no, description, HSN..."
                className="w-full rounded border border-[#BFC5D9] bg-white pl-8 pr-2.5 py-1 text-xs focus:border-[#2B3352] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#F5F6FA] border-b border-[#DFE3F0] text-[#3E455B]">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold">Stock No</th>
                  <th className="px-3 py-2.5 text-left font-bold">Description</th>
                  <th className="px-3 py-2.5 text-center font-bold">UOM</th>
                  <th className="px-3 py-2.5 text-left font-bold">HSN</th>
                  <th className="px-3 py-2.5 text-right font-bold">Price</th>
                  <th className="px-3 py-2.5 text-left font-bold">Status</th>
                  {canEdit && <th className="px-3 py-2.5 text-right font-bold">Edit</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-[#EAEDF5] hover:bg-[#F7F8FC]">
                    <td className="px-3 py-2.5 font-mono font-bold text-[#2B3352] whitespace-nowrap">
                      {item.stockNo}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[#1C2130]">{item.description}</div>
                      <div className="text-[11px] text-[#6B7280]">{item.category}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono">{item.uom}</td>
                    <td className="px-3 py-2.5 font-mono text-[#4A5168]">{item.hsnCode || '-'}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">
                      Rs. {formatINR(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`font-bold text-[11px] ${
                          item.active ? 'text-[#15803D]' : 'text-[#DC2626]'
                        }`}
                      >
                        {item.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2B3352] hover:underline"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

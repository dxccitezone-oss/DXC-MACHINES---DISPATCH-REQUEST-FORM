import React, { useState } from 'react';
import { Edit2, Plus, Search } from 'lucide-react';
import type { StockItem, User } from '../types/gatepass';
import { formatDateShort, formatINR } from '../utils/calculations';

interface StockMasterPageProps {
  stockItems: StockItem[];
  currentUser: User;
  onSaveStockItem: (
    item: Partial<StockItem> & { description: string; vendorName?: string; stockNo?: string }
  ) => Promise<boolean>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(todayIsoDate);
  const [uom, setUom] = useState('NOS');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [quantityInput, setQuantityInput] = useState<string>('0');
  const [unitPriceInput, setUnitPriceInput] = useState<string>('0');
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [receiver, setReceiver] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const filtered = stockItems.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.vendorName || s.stockNo || '').toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.invoiceNo || '').toLowerCase().includes(q) ||
      (s.receiver || '').toLowerCase().includes(q) ||
      (s.entryDate || '').toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setEditingId(undefined);
    setVendorName('');
    setDescription('');
    setEntryDate(todayIsoDate());
    setUom('NOS');
    setInvoiceNo('');
    setQuantityInput('0');
    setUnitPriceInput('0');
    setTaxPercent(18);
    setReceiver('');
    setActive(true);
  };

  const handleEdit = (s: StockItem) => {
    setEditingId(s.id);
    setVendorName(s.vendorName || s.stockNo || '');
    setDescription(s.description);
    setEntryDate(s.entryDate || (s.createdAt ? s.createdAt.slice(0, 10) : todayIsoDate()));
    setUom(s.uom);
    setInvoiceNo(s.invoiceNo || '');
    setQuantityInput(String(s.quantity ?? 0));
    setUnitPriceInput(String(s.unitPrice));
    setTaxPercent(s.taxPercent);
    setReceiver(s.receiver || '');
    setActive(s.active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const parsedQuantity = Math.max(0, Number(quantityInput) || 0);
      const parsedPrice = Math.max(0, Number(unitPriceInput) || 0);
      const ok = await onSaveStockItem({
        id: editingId,
        stockNo: vendorName,
        vendorName,
        description,
        entryDate,
        uom,
        invoiceNo,
        quantity: parsedQuantity,
        unitPrice: parsedPrice,
        taxPercent,
        receiver,
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
          Catalog of reference items with Vendor Name, Description, Date, UOM, Invoice No, Quantity, Price / Unit, and Receiver.
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
                Vendor Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Bharat Hydraulics Pvt. Ltd."
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
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

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Date</label>
              <input
                type="date"
                disabled={!canEdit}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
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
                <label className="block font-bold text-[#2E354A] mb-1">Invoice No</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2E354A] mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={!canEdit}
                  value={quantityInput}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono text-right focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2E354A] mb-1">Price / Unit (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!canEdit}
                  value={unitPriceInput}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setUnitPriceInput(e.target.value)}
                  className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono text-right focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Receiver</label>
              <input
                type="text"
                disabled={!canEdit}
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="Receiver name / person"
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
              <span className="font-semibold text-[#1C2130]">Active</span>
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
                placeholder="Search vendor, description, invoice no, receiver..."
                className="w-full rounded border border-[#BFC5D9] bg-white pl-8 pr-2.5 py-1 text-xs focus:border-[#2B3352] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#F5F6FA] border-b border-[#DFE3F0] text-[#3E455B]">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold">Vendor Name</th>
                  <th className="px-3 py-2.5 text-left font-bold">Description</th>
                  <th className="px-3 py-2.5 text-left font-bold">Date</th>
                  <th className="px-3 py-2.5 text-center font-bold">UOM</th>
                  <th className="px-3 py-2.5 text-left font-bold">Invoice No</th>
                  <th className="px-3 py-2.5 text-right font-bold">Quantity</th>
                  <th className="px-3 py-2.5 text-right font-bold">Price</th>
                  <th className="px-3 py-2.5 text-left font-bold">Receiver</th>
                  <th className="px-3 py-2.5 text-left font-bold">Status</th>
                  {canEdit && <th className="px-3 py-2.5 text-right font-bold">Edit</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEdit ? 10 : 9}
                      className="px-4 py-8 text-center text-[#5A627A]"
                    >
                      No catalog items match your search filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-b border-[#EAEDF5] hover:bg-[#F7F8FC]">
                      <td className="px-3 py-2.5 font-semibold text-[#2B3352] whitespace-nowrap">
                        {item.vendorName || item.stockNo}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-[#1C2130]">{item.description}</div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[#4A5168] whitespace-nowrap">
                        {formatDateShort(item.entryDate || item.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono">{item.uom}</td>
                      <td className="px-3 py-2.5 font-mono text-[#4A5168]">
                        {item.invoiceNo || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">
                        {item.quantity ?? 0}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold whitespace-nowrap">
                        Rs. {formatINR(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-[#1C2130]">
                        {item.receiver || '-'}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

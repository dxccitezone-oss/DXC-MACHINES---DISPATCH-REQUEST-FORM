import { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Lock,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import type {
  CompanySettings,
  GatePass,
  GatePassItem,
  TransactionType,
} from '../types/gatepass';
import {
  calculateGatePassTotals,
  calculateItemRow,
  detectTransactionType,
  formatDateTimeShort,
  formatINR,
} from '../utils/calculations';

interface GatePassEntryFormProps {
  settings: CompanySettings;
  editingGatePass: GatePass | null;
  onSave: (payload: {
    id?: string;
    gpNo?: string;
    fromAddress: string;
    sentTo: string;
    gstNo: string;
    stCode: string;
    wayBillNo: string;
    docRefNo: string;
    departmentId: string;
    departmentName?: string;
    preciousMaterial: boolean;
    returnable: boolean;
    expectedDate: string;
    appValue: number;
    appValueOverridden: boolean;
    despatchThru: string;
    transactionType: TransactionType;
    remarks: string;
    items: GatePassItem[];
  }) => Promise<GatePass | null>;
  onDownloadExcel: () => void;
  onResetToNew: () => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

const DESPATCH_THRU_OPTIONS = ['AIR', 'ROAD', 'HAND CARRY'] as const;

const DESCRIPTION_OPTIONS = [
  'CARAT METER',
  'LIGHT SCOPE',
  'CLARITY VIEWER',
  'MARKING VIEWER',
  'HEART & ARROW',
] as const;

const UOM_OPTIONS = ['NOS', 'SET'] as const;

function createEmptyItem(sNo: number, defaultTax: number): GatePassItem {
  return {
    id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sNo,
    stockNo: '',
    description: '',
    uom: 'NOS',
    hsnCode: '',
    quantity: 1,
    pricePerUnit: 0,
    taxPercent: defaultTax,
    igstValue: 0,
    cgstValue: 0,
    sgstValue: 0,
    taxValue: 0,
    total: 0,
  };
}

export function GatePassEntryForm({
  settings,
  editingGatePass,
  onSave,
  onDownloadExcel,
  onResetToNew,
  onNotify,
}: GatePassEntryFormProps) {
  const defaultFromLine1 = [settings.companyName, settings.companyAddress]
    .filter(Boolean)
    .join(' ')
    .trim();
  const defaultFromAddress = settings.phone
    ? `${defaultFromLine1}${defaultFromLine1 ? '\n' : ''}PH: ${settings.phone}`
    : defaultFromLine1;

  const [gpId, setGpId] = useState<string | undefined>(editingGatePass?.id);
  const [sentTo, setSentTo] = useState<string>(editingGatePass?.sentTo || '');
  const [gstNo, setGstNo] = useState<string>(editingGatePass?.gstNo || '');
  const [status, setStatus] = useState<GatePass['status']>(
    editingGatePass?.status || 'PENDING'
  );
  const [preciousMaterial, setPreciousMaterial] = useState<boolean>(
    editingGatePass ? editingGatePass.preciousMaterial : false
  );
  const [returnable, setReturnable] = useState<boolean>(
    editingGatePass ? editingGatePass.returnable : true
  );
  const [expectedDate, setExpectedDate] = useState<string>(editingGatePass?.expectedDate || '');
  const [despatchThru, setDespatchThru] = useState<string>(editingGatePass?.despatchThru || '');
  const [transactionType, setTransactionType] = useState<TransactionType>(
    editingGatePass?.transactionType || 'INTRA_STATE'
  );
  const initialIsCustomAppValue = editingGatePass
    ? editingGatePass.appValueOverridden ||
      Math.abs(editingGatePass.appValue - editingGatePass.grandTotal) > 0.001
    : false;
  const [appValueOverridden, setAppValueOverridden] = useState<boolean>(initialIsCustomAppValue);
  const [customAppValueInput, setCustomAppValueInput] = useState<string>(
    initialIsCustomAppValue && editingGatePass ? String(editingGatePass.appValue) : ''
  );
  const [remarks, setRemarks] = useState<string>(editingGatePass?.remarks || '');
  const [items, setItems] = useState<GatePassItem[]>(
    editingGatePass && editingGatePass.items.length > 0
      ? editingGatePass.items.map((it, idx) =>
          calculateItemRow({ ...it, sNo: idx + 1 }, editingGatePass.transactionType)
        )
      : [createEmptyItem(1, settings.defaultTaxPercent || 18)]
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [rawNumInputs, setRawNumInputs] = useState<Record<string, string>>({});

  // Sync lifecycle status when an existing Gate Pass is saved, dispatched, or acknowledged
  useEffect(() => {
    if (editingGatePass) {
      setGpId(editingGatePass.id);
      setStatus(editingGatePass.status);
    }
  }, [editingGatePass?.id, editingGatePass?.status]);

  const isLocked = Boolean(gpId && status !== 'PENDING');

  const totals = useMemo(() => calculateGatePassTotals(items), [items]);
  const parsedCustomAppValue = Number(customAppValueInput);
  const effectiveAppValue = appValueOverridden
    ? Number.isFinite(parsedCustomAppValue) && customAppValueInput.trim() !== ''
      ? Math.max(0, parsedCustomAppValue)
      : 0
    : totals.grandTotal;

  const recalculateAllRows = (nextRows: GatePassItem[], nextTx: TransactionType) => {
    return nextRows.map((row, index) =>
      calculateItemRow({ ...row, sNo: index + 1 }, nextTx)
    );
  };

  const handleGstChange = (val: string) => {
    const upper = val.toUpperCase();
    setGstNo(upper);
    if (upper.length >= 2 && /^\d{2}/.test(upper)) {
      const code = upper.slice(0, 2);
      const nextTx = detectTransactionType(upper, code, settings.homeStateCode);
      setTransactionType(nextTx);
      setItems((prev) => recalculateAllRows(prev, nextTx));
    }
  };

  const handleRowFieldChange = (
    index: number,
    field: keyof GatePassItem,
    rawValue: string | number
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };

      if (field === 'quantity' || field === 'taxPercent') {
        const rawStr = String(rawValue);
        if (field === 'quantity') {
          const cellKey = `${current.id}:${field}`;
          setRawNumInputs((r) => ({ ...r, [cellKey]: rawStr }));
        }
        const num = rawStr.trim() === '' ? 0 : Number(rawStr);
        current[field] = Number.isFinite(num) ? Math.max(0, num) : 0;
      } else if (field === 'description' || field === 'uom') {
        current[field] = String(rawValue);
      }

      updated[index] = calculateItemRow(current, transactionType);
      return updated;
    });
  };

  const handleAddRow = () => {
    if (isLocked) return;
    setItems((prev) => [
      ...prev,
      createEmptyItem(prev.length + 1, settings.defaultTaxPercent || 18),
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (isLocked) return;
    setItems((prev) => {
      if (prev.length === 1) {
        return [createEmptyItem(1, settings.defaultTaxPercent || 18)];
      }
      return prev
        .filter((_, idx) => idx !== index)
        .map((r, idx) => calculateItemRow({ ...r, sNo: idx + 1 }, transactionType));
    });
  };

  const validateForm = (forDispatch = false): string | null => {
    if (!sentTo.trim()) {
      return 'Sent To (Company Name & Complete Address) is mandatory.';
    }
    const validRows = items.filter(
      (it) => it.description.trim() !== '' && Number(it.quantity) > 0
    );
    if (validRows.length === 0) {
      return 'Add at least one item row with a valid Description and Quantity > 0.';
    }
    if (forDispatch && !despatchThru.trim()) {
      return 'Despatch Thru (Transport / Courier details) is required before confirming dispatch.';
    }
    return null;
  };

  const buildPayload = () => {
    return {
      id: gpId,
      gpNo: editingGatePass?.gpNo || '',
      fromAddress: defaultFromAddress,
      sentTo: sentTo.trim(),
      gstNo: gstNo.trim().toUpperCase(),
      stCode: '',
      wayBillNo: '',
      docRefNo: '',
      departmentId: editingGatePass?.departmentId || 'dept_hdtn',
      departmentName: editingGatePass?.departmentName || 'HDTN',
      preciousMaterial,
      returnable,
      expectedDate,
      appValue: effectiveAppValue,
      appValueOverridden,
      despatchThru: despatchThru.trim(),
      transactionType,
      remarks: remarks.trim(),
      items: items.filter((it) => it.description.trim() !== '' && Number(it.quantity) > 0),
    };
  };

  const handleSubmitClick = async () => {
    if (isLocked) {
      onNotify(
        'warning',
        'Record Locked',
        `Gate Pass ${editingGatePass?.gpNo || ''} is ${status} and cannot be edited.`
      );
      return;
    }
    const err = validateForm(false);
    if (err) {
      onNotify('error', 'Validation Required', err);
      return;
    }
    setSubmitting(true);
    try {
      const saved = await onSave(buildPayload());
      if (saved) {
        setGpId(saved.id);
        setStatus(saved.status);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Classic ERP Form Shell with Cool Grey-Lavender Canvas */}
      <div className="rounded-md border border-[#B8BFD4] bg-[#E3E6F0] shadow-sm overflow-hidden">
        {/* Form Title Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2B3352] px-4 py-2.5 text-white border-b border-[#1E243B]">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-bold tracking-wide uppercase">
              DXC MACHINES - DISPATCH REQUEST FORM
            </h1>
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#1E243B] border border-white/20 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" />
                Read-Only
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadExcel}
              className="inline-flex items-center gap-1.5 rounded bg-[#15803D] hover:bg-[#166534] px-2.5 py-1 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              title="Download TJD_NON_STOCK_GATEPASS_REGISTER.xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={onResetToNew}
              className="inline-flex items-center gap-1.5 rounded bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
              title="Clear form and start a new Gate Pass"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Entry
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-3">
          {/* HEADER SECTION: LEFT & RIGHT SIDE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded border border-[#C3C9DC] bg-[#ECEEF6] p-3.5">
            {/* LEFT SIDE */}
            <div className="lg:col-span-6 space-y-2.5">
              {/* 1. From Address */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-1.5">
                <label
                  htmlFor="gp-from-address"
                  className="sm:col-span-3 text-xs font-bold text-[#252B3F] pt-1.5"
                >
                  From
                </label>
                <div className="sm:col-span-9">
                  <textarea
                    id="gp-from-address"
                    rows={3}
                    readOnly
                    value={defaultFromAddress}
                    className="w-full rounded-sm border border-[#A8B0C8] bg-[#F5F6FA] px-2.5 py-1.5 text-xs font-medium text-[#1F2937] focus:outline-none cursor-default select-text"
                  />
                </div>
              </div>

              {/* 2. Sent To */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-1.5">
                <label
                  htmlFor="gp-sent-to"
                  className="sm:col-span-3 text-xs font-bold text-[#252B3F] pt-1.5"
                >
                  Sent To <span className="text-[#DC2626]">*</span>
                </label>
                <div className="sm:col-span-9">
                  <textarea
                    id="gp-sent-to"
                    rows={3}
                    disabled={isLocked}
                    value={sentTo}
                    onChange={(e) => setSentTo(e.target.value)}
                    placeholder="Recipient Company Name & Complete Delivery Address"
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6] disabled:text-[#4B5563]"
                  />
                </div>
              </div>

              {/* 2. GST No */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-1.5">
                <label
                  htmlFor="gp-gst-no"
                  className="sm:col-span-3 text-xs font-bold text-[#252B3F]"
                >
                  GST No
                </label>
                <div className="sm:col-span-9">
                  <input
                    id="gp-gst-no"
                    type="text"
                    disabled={isLocked}
                    value={gstNo}
                    onChange={(e) => handleGstChange(e.target.value)}
                    placeholder="e.g. 27AABCT1234F1Z5"
                    maxLength={15}
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs font-mono uppercase text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="lg:col-span-6 space-y-2.5 lg:border-l lg:border-[#C7CDE0] lg:pl-4">

              {/* 3. Precious Material & 4. Returnable */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-1.5">
                <span className="sm:col-span-4 text-xs font-bold text-[#252B3F]">
                  Precious Material
                </span>
                <div className="sm:col-span-3 flex items-center gap-3 text-xs">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="preciousMaterial"
                      disabled={isLocked}
                      checked={preciousMaterial === true}
                      onChange={() => setPreciousMaterial(true)}
                      className="accent-[#2B3352]"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="preciousMaterial"
                      disabled={isLocked}
                      checked={preciousMaterial === false}
                      onChange={() => setPreciousMaterial(false)}
                      className="accent-[#2B3352]"
                    />
                    <span>No</span>
                  </label>
                </div>

                <span className="sm:col-span-2 text-xs font-bold text-[#252B3F] sm:text-right pr-1">
                  Returnable
                </span>
                <div className="sm:col-span-3 flex items-center gap-3 text-xs">
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="returnable"
                      disabled={isLocked}
                      checked={returnable === true}
                      onChange={() => setReturnable(true)}
                      className="accent-[#2B3352]"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="returnable"
                      disabled={isLocked}
                      checked={returnable === false}
                      onChange={() => setReturnable(false)}
                      className="accent-[#2B3352]"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {/* 5. Expected Date */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-1.5">
                <label
                  htmlFor="gp-expected-date"
                  className="sm:col-span-4 text-xs font-bold text-[#252B3F]"
                >
                  Expected Date
                </label>
                <div className="sm:col-span-8">
                  <input
                    id="gp-expected-date"
                    type="date"
                    disabled={isLocked}
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs font-mono text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                  />
                </div>
              </div>

              {/* 6. App. Value in Rs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-1.5">
                <label
                  htmlFor="gp-app-value"
                  className="sm:col-span-4 text-xs font-bold text-[#252B3F]"
                >
                  App. Value in Rs
                </label>
                <div className="sm:col-span-8 flex items-center gap-2">
                  <input
                    id="gp-app-value"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isLocked}
                    value={appValueOverridden ? customAppValueInput : totals.grandTotal}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setAppValueOverridden(true);
                      setCustomAppValueInput(raw);
                    }}
                    placeholder="Enter custom value in Rs."
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-right text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F5F6FA]"
                  />
                  {appValueOverridden && !isLocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppValueOverridden(false);
                        setCustomAppValueInput('');
                      }}
                      className="text-[11px] font-semibold text-[#2B3352] hover:underline whitespace-nowrap shrink-0"
                      title="Reset to calculated items total"
                    >
                      Auto
                    </button>
                  )}
                </div>
              </div>

              {/* 7. Despatch Thru */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-1.5">
                <label
                  htmlFor="gp-despatch-thru"
                  className="sm:col-span-4 text-xs font-bold text-[#252B3F]"
                >
                  Despatch Thru
                </label>
                <div className="sm:col-span-8">
                  <select
                    id="gp-despatch-thru"
                    disabled={isLocked}
                    value={despatchThru}
                    onChange={(e) => setDespatchThru(e.target.value)}
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                  >
                    <option value="">Select Despatch Thru</option>
                    {DESPATCH_THRU_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {despatchThru &&
                      !DESPATCH_THRU_OPTIONS.includes(
                        despatchThru as (typeof DESPATCH_THRU_OPTIONS)[number]
                      ) && <option value={despatchThru}>{despatchThru}</option>}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ITEM DETAILS SECTION */}
          <div className="rounded border border-[#B8BFD4] bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C5CBE0] bg-[#D6DBE9] px-3 py-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-extrabold tracking-wide text-[#1E253B] uppercase">
                  ITEM DETAILS
                </h2>
                <span className="text-[11px] text-[#4A5168]">
                  Select Description, UOM, and enter quantity below
                </span>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1 rounded bg-[#2B3352] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#1F2640] whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              )}
            </div>

            <div className="max-h-[340px] overflow-auto erp-scroll">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-[#ECEEF6] text-[#1F2538] border-b border-[#B8BFD4]">
                  <tr>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-center w-12 font-bold">
                      S.No
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-left min-w-[260px] font-bold">
                      Description
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-center w-24 font-bold">
                      UOM
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-right w-28 font-bold">
                      Quantity
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-right w-32 font-bold">
                      Total
                    </th>
                    {!isLocked && (
                      <th className="px-2 py-2 text-center w-12 font-bold">Del</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#E2E6F2] hover:bg-[#F7F8FC]"
                    >
                      <td className="border-r border-[#E2E6F2] px-2 py-1 text-center font-mono text-[#4A5168]">
                        {row.sNo}
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <select
                          disabled={isLocked}
                          value={row.description}
                          onChange={(e) =>
                            handleRowFieldChange(idx, 'description', e.target.value)
                          }
                          aria-label={`Row ${row.sNo} Description`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        >
                          <option value="">Select Description</option>
                          {DESCRIPTION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          {row.description &&
                            !DESCRIPTION_OPTIONS.includes(
                              row.description as (typeof DESCRIPTION_OPTIONS)[number]
                            ) && <option value={row.description}>{row.description}</option>}
                        </select>
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <select
                          disabled={isLocked}
                          value={row.uom}
                          onChange={(e) =>
                            handleRowFieldChange(idx, 'uom', e.target.value)
                          }
                          aria-label={`Row ${row.sNo} UOM`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs text-center uppercase text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        >
                          {UOM_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                          {row.uom &&
                            !UOM_OPTIONS.includes(row.uom as (typeof UOM_OPTIONS)[number]) && (
                              <option value={row.uom}>{row.uom}</option>
                            )}
                        </select>
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          disabled={isLocked}
                          value={
                            rawNumInputs[`${row.id}:quantity`] !== undefined
                              ? rawNumInputs[`${row.id}:quantity`]
                              : row.quantity
                          }
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => handleRowFieldChange(idx, 'quantity', e.target.value)}
                          onBlur={() =>
                            setRawNumInputs((r) => {
                              const copy = { ...r };
                              delete copy[`${row.id}:quantity`];
                              return copy;
                            })
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Enter' &&
                              idx === items.length - 1 &&
                              !isLocked
                            ) {
                              e.preventDefault();
                              handleAddRow();
                            }
                          }}
                          aria-label={`Row ${row.sNo} Quantity`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs font-mono text-right focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        />
                      </td>
                      <td className="border-r border-[#E2E6F2] px-2 py-1 text-right font-mono font-bold text-[#111827] bg-[#EEF1F8]">
                        {formatINR(row.total)}
                      </td>
                      {!isLocked && (
                        <td className="px-1 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="rounded p-1 text-[#DC2626] hover:bg-[#FEE2E2]"
                            title="Delete row"
                            aria-label={`Delete row ${row.sNo}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-[#E6EAF4] border-t-2 border-[#A8B0C8] font-bold text-[#111827]">
                  <tr>
                    <td colSpan={3} className="border-r border-[#C8CEE0] px-3 py-2 text-right">
                      TOTAL ({items.length} {items.length === 1 ? 'Row' : 'Rows'})
                    </td>
                    <td className="border-r border-[#C8CEE0] px-2 py-2 text-right font-mono">
                      {totals.totalQuantity}
                    </td>
                    <td className="border-r border-[#C8CEE0] px-2 py-2 text-right font-mono">
                      {formatINR(totals.grandTotal)}
                    </td>
                    {!isLocked && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BOTTOM SECTION: REMARKS & TOTALS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded border border-[#C3C9DC] bg-[#ECEEF6] p-3.5">
            <div className="lg:col-span-7 space-y-1">
              <label
                htmlFor="gp-remarks"
                className="block text-xs font-bold text-[#252B3F]"
              >
                Remarks
              </label>
              <textarea
                id="gp-remarks"
                rows={3}
                disabled={isLocked}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for non-stock movement, calibration notes, or special gate security instructions..."
                className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
              {editingGatePass &&
                (editingGatePass.dispatchDetails || editingGatePass.acknowledgementDetails) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-[#4A5168]">
                    {editingGatePass.dispatchDetails && (
                      <span>
                        Dispatched by <strong className="text-[#1F2937]">{editingGatePass.dispatchDetails.dispatchedByName}</strong> ({formatDateTimeShort(editingGatePass.dispatchDetails.dispatchedAt)})
                      </span>
                    )}
                    {editingGatePass.acknowledgementDetails && (
                      <span>
                        Acknowledged by <strong className="text-[#1F2937]">{editingGatePass.acknowledgementDetails.acknowledgedByName}</strong> ({formatDateTimeShort(editingGatePass.acknowledgementDetails.acknowledgedAt)})
                      </span>
                    )}
                  </div>
                )}
            </div>

            <div className="lg:col-span-5 space-y-2 lg:border-l lg:border-[#C7CDE0] lg:pl-4 flex flex-col justify-center">
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-6 text-xs font-bold text-[#252B3F]">
                  Total Quantity
                </label>
                <input
                  type="text"
                  readOnly
                  value={totals.totalQuantity}
                  className="col-span-6 rounded-sm border border-[#A8B0C8] bg-[#F5F6FA] px-2.5 py-1.5 text-xs font-mono font-bold text-right text-[#111827]"
                />
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <label className="col-span-6 text-xs font-extrabold text-[#1E253B]">
                  Grand Total Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Rs. ${formatINR(totals.grandTotal)}`}
                  className="col-span-6 rounded-sm border border-[#2B3352] bg-white px-2.5 py-1.5 text-sm font-mono font-extrabold text-right text-[#1E253B]"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTON BAR */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded border border-[#B8BFD4] bg-[#D7DCEB] px-4 py-3">
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={submitting || isLocked}
              className="inline-flex items-center gap-2 rounded bg-[#2B3352] px-6 py-2 text-xs font-bold tracking-wide text-white hover:bg-[#1E243B] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

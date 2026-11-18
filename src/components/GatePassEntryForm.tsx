import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import type {
  CompanySettings,
  Department,
  GatePass,
  GatePassItem,
  StockItem,
  TransactionType,
  User,
} from '../types/gatepass';
import {
  calculateGatePassTotals,
  calculateItemRow,
  detectTransactionType,
  formatDateTimeShort,
  formatINR,
} from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';

interface GatePassEntryFormProps {
  currentUser: User;
  departments: Department[];
  stockItems: StockItem[];
  settings: CompanySettings;
  editingGatePass: GatePass | null;
  nextGpNo: string;
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
  onDispatch: (
    id: string,
    payload: { vehicleOrCourierRef?: string; dispatchRemarks?: string }
  ) => Promise<GatePass | null>;
  onAcknowledge: (
    id: string,
    payload: { receivedBy: string; remarks?: string }
  ) => Promise<GatePass | null>;
  onCallReport: () => void;
  onPrintInvoice: (gp: GatePass) => void;
  onDownloadExcel: () => void;
  onResetToNew: () => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

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
  currentUser,
  departments,
  stockItems,
  settings,
  editingGatePass,
  nextGpNo,
  onSave,
  onDispatch,
  onAcknowledge,
  onCallReport,
  onPrintInvoice,
  onDownloadExcel,
  onResetToNew,
  onNotify,
}: GatePassEntryFormProps) {
  const activeDepartments = useMemo(
    () => departments.filter((d) => d.active || d.id === editingGatePass?.departmentId),
    [departments, editingGatePass]
  );

  const activeStockItems = useMemo(
    () => stockItems.filter((s) => s.active),
    [stockItems]
  );

  const defaultFromAddress = settings.companyName
    ? `${settings.companyName}${settings.companyAddress ? `\n${settings.companyAddress}` : ''}`
    : settings.companyAddress || '';

  const [gpId, setGpId] = useState<string | undefined>(editingGatePass?.id);
  const [gpNo, setGpNo] = useState<string>(editingGatePass?.gpNo || nextGpNo);
  const [fromAddress, setFromAddress] = useState<string>(
    editingGatePass?.fromAddress ?? defaultFromAddress
  );
  const [sentTo, setSentTo] = useState<string>(editingGatePass?.sentTo || '');
  const [gstNo, setGstNo] = useState<string>(editingGatePass?.gstNo || '');
  const [status, setStatus] = useState<GatePass['status']>(
    editingGatePass?.status || 'PENDING'
  );
  const defaultDepartmentName =
    activeDepartments.find(
      (d) => d.code.toUpperCase() === 'HDTN' || d.name.toUpperCase() === 'HDTN'
    )?.name ||
    activeDepartments[0]?.name ||
    'HDTN';
  const [departmentInput, setDepartmentInput] = useState<string>(
    editingGatePass?.departmentName || defaultDepartmentName
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
  const [dispatchModalOpen, setDispatchModalOpen] = useState<boolean>(false);
  const [ackModalOpen, setAckModalOpen] = useState<boolean>(false);

  const prevAutoGpNoRef = useRef<string>(nextGpNo);
  const prevDefaultFromRef = useRef<string>(defaultFromAddress);

  // Sync async auto-generated G.P. No without overwriting user edits
  useEffect(() => {
    if (!editingGatePass && !gpId && gpNo === prevAutoGpNoRef.current) {
      setGpNo(nextGpNo);
    }
    prevAutoGpNoRef.current = nextGpNo;
  }, [nextGpNo, editingGatePass, gpId, gpNo]);

  // Sync async default From Address without overwriting user edits
  useEffect(() => {
    if (!editingGatePass && !gpId && fromAddress === prevDefaultFromRef.current) {
      setFromAddress(defaultFromAddress);
    }
    prevDefaultFromRef.current = defaultFromAddress;
  }, [defaultFromAddress, editingGatePass, gpId, fromAddress]);

  // Sync default department once departments finish loading on a blank form
  useEffect(() => {
    if (!editingGatePass && !gpId && !departmentInput && defaultDepartmentName) {
      setDepartmentInput(defaultDepartmentName);
    }
  }, [defaultDepartmentName, editingGatePass, gpId, departmentInput]);

  // Sync lifecycle status/details when an existing Gate Pass is saved, dispatched, or acknowledged
  useEffect(() => {
    if (editingGatePass) {
      setGpId(editingGatePass.id);
      setGpNo(editingGatePass.gpNo);
      setStatus(editingGatePass.status);
    }
  }, [editingGatePass?.id, editingGatePass?.gpNo, editingGatePass?.status]);

  const isLocked = Boolean(gpId && status !== 'PENDING');
  const canAcknowledge =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'SUPERVISOR' ||
    currentUser.role === 'SECURITY';

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

      if (field === 'stockNo') {
        const strVal = String(rawValue);
        current.stockNo = strVal;
        const matched = activeStockItems.find(
          (s) => s.stockNo.toLowerCase() === strVal.trim().toLowerCase()
        );
        if (matched) {
          current.stockNo = matched.stockNo;
          current.description = matched.description;
          current.uom = matched.uom;
          current.hsnCode = matched.hsnCode;
          current.pricePerUnit = matched.unitPrice;
          current.taxPercent = matched.taxPercent;
        }
      } else if (field === 'quantity' || field === 'pricePerUnit' || field === 'taxPercent') {
        const num = Number(rawValue);
        current[field] = Number.isFinite(num) ? Math.max(0, num) : 0;
      } else if (field === 'description' || field === 'uom' || field === 'hsnCode') {
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
    if (!gpNo.trim()) {
      return 'G.P. No is mandatory (enter a custom number or click Auto).';
    }
    if (!sentTo.trim()) {
      return 'Sent To (Company Name & Complete Address) is mandatory.';
    }
    if (!departmentInput.trim()) {
      return 'Department is mandatory.';
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

  const resolveDepartment = () => {
    const q = departmentInput.trim().toLowerCase();
    const matched = activeDepartments.find(
      (d) =>
        d.name.toLowerCase() === q ||
        d.code.toLowerCase() === q ||
        `${d.code} - ${d.name}`.toLowerCase() === q
    );
    return {
      departmentId: matched?.id || '',
      departmentName: matched?.name || departmentInput.trim(),
    };
  };

  const buildPayload = () => {
    const resolvedDept = resolveDepartment();
    return {
      id: gpId,
      gpNo: gpNo.trim(),
      fromAddress: fromAddress.trim(),
      sentTo: sentTo.trim(),
      gstNo: gstNo.trim().toUpperCase(),
      stCode: '',
      wayBillNo: '',
      docRefNo: '',
      departmentId: resolvedDept.departmentId,
      departmentName: resolvedDept.departmentName,
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

  const handleSaveClick = async () => {
    if (isLocked) {
      onNotify(
        'warning',
        'Record Locked',
        `Gate Pass ${gpNo} is ${status} and cannot be edited.`
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
        setGpNo(saved.gpNo);
        setStatus(saved.status);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDispatch = async () => {
    if (status !== 'PENDING') {
      onNotify('warning', 'Already Dispatched', `Gate Pass ${gpNo} is already ${status}.`);
      return;
    }
    const err = validateForm(true);
    if (err) {
      onNotify('error', 'Dispatch Validation Failed', err);
      return;
    }
    setDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      // Save latest pending changes first, then dispatch
      const saved = await onSave(buildPayload());
      if (!saved) return;
      const dispatched = await onDispatch(saved.id, {
        vehicleOrCourierRef: values.vehicleOrCourierRef || '',
        dispatchRemarks: values.dispatchRemarks || '',
      });
      if (dispatched) {
        setGpId(dispatched.id);
        setGpNo(dispatched.gpNo);
        setStatus(dispatched.status);
        setDispatchModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAck = () => {
    if (!gpId || status !== 'DISPATCHED') {
      onNotify(
        'warning',
        'Acknowledgement Unavailable',
        'A Gate Pass can only be acknowledged after Dispatch is confirmed.'
      );
      return;
    }
    if (!canAcknowledge) {
      onNotify(
        'error',
        'Unauthorized Action',
        'Only Admin, Supervisor, or Security Gate roles can confirm acknowledgement.'
      );
      return;
    }
    setAckModalOpen(true);
  };

  const handleConfirmAck = async (values: Record<string, string>) => {
    if (!gpId) return;
    setSubmitting(true);
    try {
      const acked = await onAcknowledge(gpId, {
        receivedBy: values.receivedBy || '',
        remarks: values.remarks || '',
      });
      if (acked) {
        setStatus(acked.status);
        setAckModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintClick = () => {
    if (isLocked && editingGatePass && editingGatePass.id === gpId) {
      onPrintInvoice(editingGatePass);
      return;
    }
    // Build preview object from current form state so unsaved edits also print accurately
    const resolvedDept = resolveDepartment();
    const previewGp: GatePass = {
      id: gpId || 'preview',
      gpNo,
      fromAddress: fromAddress.trim(),
      sentTo: sentTo || '-',
      gstNo,
      stCode: '',
      wayBillNo: '',
      status,
      docRefNo: '',
      departmentId: resolvedDept.departmentId,
      departmentName: resolvedDept.departmentName || '-',
      preciousMaterial,
      returnable,
      expectedDate,
      appValue: effectiveAppValue,
      appValueOverridden,
      despatchThru,
      transactionType,
      remarks,
      totalQuantity: totals.totalQuantity,
      totalTaxValue: totals.totalTaxValue,
      grandTotal: totals.grandTotal,
      items: items.filter((it) => it.description.trim() !== ''),
      dispatchDetails: editingGatePass?.dispatchDetails || null,
      acknowledgementDetails: editingGatePass?.acknowledgementDetails || null,
      auditLog: editingGatePass?.auditLog || [],
      createdById: editingGatePass?.createdById || currentUser.id,
      createdByName: editingGatePass?.createdByName || currentUser.fullName,
      createdAt: editingGatePass?.createdAt || new Date().toISOString(),
      modifiedById: currentUser.id,
      modifiedByName: currentUser.fullName,
      modifiedAt: new Date().toISOString(),
    };
    if (previewGp.items.length === 0) {
      onNotify('warning', 'Nothing to Print', 'Enter at least one item row before printing.');
      return;
    }
    onPrintInvoice(previewGp);
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
                    disabled={isLocked}
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    placeholder="Sender Plant / Unit Name & Dispatch Address"
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6] disabled:text-[#4B5563]"
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

            {/* RIGHT SIDE (7 fields) */}
            <div className="lg:col-span-6 space-y-2.5 lg:border-l lg:border-[#C7CDE0] lg:pl-4">
              {/* 1. G.P. No */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-1.5">
                <label
                  htmlFor="gp-number"
                  className="sm:col-span-4 text-xs font-bold text-[#252B3F]"
                >
                  G.P. No <span className="text-[#DC2626]">*</span>
                </label>
                <div className="sm:col-span-8 flex items-center gap-2">
                  <input
                    id="gp-number"
                    type="text"
                    disabled={isLocked}
                    value={gpNo}
                    onChange={(e) => setGpNo(e.target.value)}
                    placeholder="Enter custom G.P. No"
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-[#1F2937] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F5F6FA]"
                  />
                  {!isLocked && gpNo !== (editingGatePass ? editingGatePass.gpNo : nextGpNo) && (
                    <button
                      type="button"
                      onClick={() => setGpNo(editingGatePass ? editingGatePass.gpNo : nextGpNo)}
                      className="text-[11px] font-semibold text-[#2B3352] hover:underline whitespace-nowrap shrink-0"
                      title="Reset to auto-generated G.P. No"
                    >
                      Auto
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Department */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-1.5">
                <label
                  htmlFor="gp-department"
                  className="sm:col-span-4 text-xs font-bold text-[#252B3F]"
                >
                  Department <span className="text-[#DC2626]">*</span>
                </label>
                <div className="sm:col-span-8">
                  <input
                    id="gp-department"
                    type="text"
                    disabled={isLocked}
                    value={departmentInput}
                    onChange={(e) => setDepartmentInput(e.target.value)}
                    placeholder="Enter Department (e.g. HDTN)"
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                  />
                </div>
              </div>

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
                  <input
                    id="gp-despatch-thru"
                    type="text"
                    disabled={isLocked}
                    value={despatchThru}
                    onChange={(e) => setDespatchThru(e.target.value)}
                    placeholder="Transport / Courier / Vehicle Number"
                    className="w-full rounded-sm border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs text-[#111827] focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
                  />
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
                  Select Stock No to auto-populate master data, or type directly for non-stock items
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
              <table className="w-full min-w-[860px] border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-[#ECEEF6] text-[#1F2538] border-b border-[#B8BFD4]">
                  <tr>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-center w-12 font-bold">
                      S.No
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-left w-36 font-bold">
                      Stock No
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-left min-w-[240px] font-bold">
                      Description
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-center w-20 font-bold">
                      UOM
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-left w-28 font-bold">
                      HSN Code
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-right w-24 font-bold">
                      Quantity
                    </th>
                    <th className="border-r border-[#C8CEE0] px-2 py-2 text-right w-28 font-bold">
                      Price / Unit
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
                        <input
                          type="text"
                          disabled={isLocked}
                          value={row.stockNo}
                          onChange={(e) => handleRowFieldChange(idx, 'stockNo', e.target.value)}
                          placeholder="Stock No / NON-STOCK"
                          aria-label={`Row ${row.sNo} Stock No`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        />
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={row.description}
                          onChange={(e) =>
                            handleRowFieldChange(idx, 'description', e.target.value)
                          }
                          placeholder="Item description"
                          aria-label={`Row ${row.sNo} Description`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        />
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={row.uom}
                          onChange={(e) =>
                            handleRowFieldChange(idx, 'uom', e.target.value.toUpperCase())
                          }
                          aria-label={`Row ${row.sNo} UOM`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs text-center uppercase focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        />
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={row.hsnCode}
                          onChange={(e) => handleRowFieldChange(idx, 'hsnCode', e.target.value)}
                          placeholder="HSN"
                          aria-label={`Row ${row.sNo} HSN Code`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        />
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          disabled={isLocked}
                          value={row.quantity}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => handleRowFieldChange(idx, 'quantity', e.target.value)}
                          aria-label={`Row ${row.sNo} Quantity`}
                          className="w-full rounded-sm border border-[#CBD0E0] bg-white px-1.5 py-1 text-xs font-mono text-right focus:border-[#2B3352] focus:outline-none disabled:bg-[#F9FAFB]"
                        />
                      </td>
                      <td className="border-r border-[#E2E6F2] p-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={isLocked}
                          value={row.pricePerUnit}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) =>
                            handleRowFieldChange(idx, 'pricePerUnit', e.target.value)
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
                          aria-label={`Row ${row.sNo} Price Per Unit`}
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
                    <td colSpan={5} className="border-r border-[#C8CEE0] px-3 py-2 text-right">
                      TOTAL ({items.length} {items.length === 1 ? 'Row' : 'Rows'})
                    </td>
                    <td className="border-r border-[#C8CEE0] px-2 py-2 text-right font-mono">
                      {totals.totalQuantity}
                    </td>
                    <td className="border-r border-[#C8CEE0] px-2 py-2 text-right text-[#4A5168]">
                      Grand Total
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
              {editingGatePass && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-[#4A5168]">
                  <span>
                    Created by <strong className="text-[#1F2937]">{editingGatePass.createdByName}</strong> ({formatDateTimeShort(editingGatePass.createdAt)})
                  </span>
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

          {/* ACTION BUTTONS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#B8BFD4] bg-[#D7DCEB] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={submitting || isLocked}
                className="inline-flex items-center gap-1.5 rounded bg-[#2B3352] px-4 py-2 text-xs font-bold tracking-wide text-white hover:bg-[#1E243B] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                SAVE
              </button>

              <button
                type="button"
                onClick={handleOpenDispatch}
                disabled={submitting || status !== 'PENDING'}
                className="inline-flex items-center gap-1.5 rounded bg-[#1D4ED8] px-4 py-2 text-xs font-bold tracking-wide text-white hover:bg-[#1E40AF] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                CONFIRM DESPATCH
              </button>

              <button
                type="button"
                onClick={handleOpenAck}
                disabled={submitting || status !== 'DISPATCHED' || !canAcknowledge}
                title={
                  !canAcknowledge
                    ? 'Only Admin, Supervisor, or Security roles can acknowledge receipt'
                    : status !== 'DISPATCHED'
                      ? 'Gate Pass must be DISPATCHED before acknowledgement'
                      : 'Confirm receipt acknowledgement'
                }
                className="inline-flex items-center gap-1.5 rounded bg-[#15803D] px-4 py-2 text-xs font-bold tracking-wide text-white hover:bg-[#166534] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                ACK CONFIRM
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onCallReport}
                className="inline-flex items-center gap-1.5 rounded border border-[#8E96B2] bg-white px-4 py-2 text-xs font-bold tracking-wide text-[#1F2538] hover:bg-[#F3F5FA] whitespace-nowrap shrink-0 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                CALL REPORT
              </button>

              <button
                type="button"
                onClick={handlePrintClick}
                className="inline-flex items-center gap-1.5 rounded border border-[#2B3352] bg-[#ECEEF6] px-4 py-2 text-xs font-bold tracking-wide text-[#1E253B] hover:bg-white whitespace-nowrap shrink-0 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                PRINT INVOICE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Confirmation Dialog */}
      <ConfirmModal
        open={dispatchModalOpen}
        title={`Confirm Dispatch · ${gpNo}`}
        description="Confirming dispatch will save this Gate Pass, mark its status as DISPATCHED, and lock it from ordinary edits."
        confirmLabel="Confirm Despatch"
        confirmTone="primary"
        loading={submitting}
        fields={[
          {
            key: 'vehicleOrCourierRef',
            label: 'Vehicle No / Courier AWB Reference',
            placeholder: 'e.g. MH14-CX-4410 or AWB 88219402',
            defaultValue: despatchThru,
          },
          {
            key: 'dispatchRemarks',
            label: 'Dispatch Security / Gate Remarks',
            placeholder: 'Optional gate verification notes',
            multiline: true,
          },
        ]}
        onConfirm={handleConfirmDispatch}
        onCancel={() => setDispatchModalOpen(false)}
      />

      {/* Acknowledgement Confirmation Dialog */}
      <ConfirmModal
        open={ackModalOpen}
        title={`Acknowledge Receipt · ${gpNo}`}
        description="Confirm material receipt and record acknowledgement details while preserving original dispatch records."
        confirmLabel="Confirm Acknowledgement"
        confirmTone="success"
        loading={submitting}
        fields={[
          {
            key: 'receivedBy',
            label: 'Received By (Name & Designation)',
            placeholder: 'e.g. R. K. Deshmukh (Maintenance Store)',
            required: true,
          },
          {
            key: 'remarks',
            label: 'Acknowledgement Remarks',
            placeholder: 'Condition of material / return verification notes',
            multiline: true,
          },
        ]}
        onConfirm={handleConfirmAck}
        onCancel={() => setAckModalOpen(false)}
      />
    </div>
  );
}

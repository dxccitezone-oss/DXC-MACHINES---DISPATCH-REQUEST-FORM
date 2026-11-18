import { Download, Printer, X } from 'lucide-react';
import type { CompanySettings, GatePass } from '../types/gatepass';
import {
  calculateGatePassTotals,
  formatDateShort,
  formatDateTimeShort,
  formatINR,
  numberToIndianWords,
} from '../utils/calculations';

interface PrintInvoiceModalProps {
  open: boolean;
  gatePass: GatePass | null;
  settings: CompanySettings;
  onClose: () => void;
}

export function PrintInvoiceModal({
  open,
  gatePass,
  settings,
  onClose,
}: PrintInvoiceModalProps) {
  if (!open || !gatePass) return null;

  const totals = calculateGatePassTotals(gatePass.items);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const el = document.getElementById('tjd-a4-invoice-sheet');
    if (!el) return;
    const safeTitle = gatePass.gpNo
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle} - DXC Machines Dispatch Request Form</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; padding: 16px; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #374151; padding: 4px 6px; }
  th { background: #E5E7EB; font-weight: 700; text-align: left; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .center { text-align: center; }
</style>
</head>
<body>${el.innerHTML}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gatePass.gpNo.replace(/[^\w-]+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 sm:p-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between rounded-md border border-[#C8CEE0] bg-white px-4 py-3 shadow-lg">
        <div>
          <h2 className="text-sm font-bold text-[#1C2130]">
            Print Preview · {gatePass.gpNo}
          </h2>
          <p className="text-xs text-[#5A627A]">
            Formatted for A4 portrait paper. Use Print &rarr; Save as PDF for PDF download.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 rounded border border-[#BFC5D9] bg-white px-3 py-1.5 text-xs font-semibold text-[#2E354A] hover:bg-[#F3F5FA] whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Document
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded bg-[#2F3759] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#232A45] whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#D4D8E8] p-1.5 text-[#5A627A] hover:bg-[#F3F5FA] hover:text-[#1C2130]"
            aria-label="Close print preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* A4 Sheet */}
      <div
        id="tjd-a4-invoice-sheet"
        className="print-only-container mx-auto w-full max-w-[210mm] bg-white p-6 sm:p-8 text-[#111827] shadow-2xl border border-[#CBD0E0] text-[11px] leading-snug"
      >
        {/* Company Letterhead */}
        <div className="border-2 border-[#1F2937]">
          <div className="flex flex-col sm:flex-row justify-between gap-3 border-b-2 border-[#1F2937] bg-[#F3F4F6] px-4 py-3">
            <div className="max-w-[62%]">
              <h1 className="text-base font-extrabold tracking-tight text-[#111827] uppercase">
                {settings.companyName}
              </h1>
              <p className="text-[10.5px] text-[#374151] mt-0.5">{settings.companyAddress}</p>
              <p className="text-[10.5px] text-[#374151] mt-0.5 font-mono">
                GSTIN: <span className="font-semibold">{settings.companyGstin}</span> · State Code:{' '}
                <span className="font-semibold">{settings.homeStateCode}</span>
                {settings.phone ? ` · Ph: ${settings.phone}` : ''}
              </p>
            </div>
            <div className="text-left sm:text-right flex flex-col justify-between">
              <div>
                <div className="text-sm font-extrabold tracking-wide text-[#1F2937] uppercase">
                  NON-STOCK GATE PASS
                </div>
                <div className="text-[10px] font-semibold text-[#4B5563]">
                  {gatePass.returnable ? 'RETURNABLE CHALLAN' : 'NON-RETURNABLE CHALLAN'}
                  {gatePass.preciousMaterial ? ' · PRECIOUS MATERIAL' : ''}
                </div>
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-[#111827]">
                G.P. No: {gatePass.gpNo}
              </div>
            </div>
          </div>

          {/* Consignee & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-[#1F2937]">
            <div className="p-3 sm:border-r border-b sm:border-b-0 border-[#1F2937] space-y-1.5">
              {gatePass.fromAddress && (
                <div className="pb-1.5 border-b border-[#E5E7EB]">
                  <div className="text-[10px] font-bold uppercase text-[#4B5563]">
                    From
                  </div>
                  <div className="whitespace-pre-line font-medium text-[#111827] text-[10.5px]">
                    {gatePass.fromAddress}
                  </div>
                </div>
              )}
              <div className="text-[10px] font-bold uppercase text-[#4B5563]">
                Sent To (Consignee / Recipient)
              </div>
              <div className="whitespace-pre-line font-semibold text-[#111827] text-[11.5px]">
                {gatePass.sentTo}
              </div>
              <div className="pt-1.5 text-[10.5px] border-t border-[#E5E7EB]">
                <span className="text-[#4B5563]">GST No: </span>
                <span className="font-mono font-semibold">{gatePass.gstNo || '-'}</span>
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10.5px]">
              <div>
                <div className="text-[#4B5563]">Gate Pass Date</div>
                <div className="font-semibold">{formatDateShort(gatePass.createdAt)}</div>
              </div>
              <div>
                <div className="text-[#4B5563]">Expected Date</div>
                <div className="font-semibold">{formatDateShort(gatePass.expectedDate)}</div>
              </div>
              <div>
                <div className="text-[#4B5563]">Department</div>
                <div className="font-semibold">{gatePass.departmentName}</div>
              </div>
              <div>
                <div className="text-[#4B5563]">Precious / Returnable</div>
                <div className="font-semibold">
                  {gatePass.preciousMaterial ? 'Yes' : 'No'} /{' '}
                  {gatePass.returnable ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="col-span-2 border-t border-[#E5E7EB] pt-1">
                <span className="text-[#4B5563]">Despatch Thru: </span>
                <span className="font-semibold">{gatePass.despatchThru || '-'}</span>
              </div>
            </div>
          </div>

          {/* Item Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#E5E7EB] text-[#111827] border-b border-[#1F2937]">
                  <th className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-center w-8">S.No</th>
                  <th className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-left">Stock No</th>
                  <th className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-left">Description</th>
                  <th className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-center">UOM</th>
                  <th className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-left">HSN</th>
                  <th className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-right">Qty</th>
                  <th className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-right">Price/Unit</th>
                  <th className="px-1.5 py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {gatePass.items.map((item) => (
                  <tr key={item.id} className="border-b border-[#D1D5DB]">
                    <td className="border-r border-[#D1D5DB] px-1.5 py-1.5 text-center font-mono">
                      {item.sNo}
                    </td>
                    <td className="border-r border-[#D1D5DB] px-1.5 py-1.5 font-mono">
                      {item.stockNo}
                    </td>
                    <td className="border-r border-[#D1D5DB] px-1.5 py-1.5">
                      {item.description}
                    </td>
                    <td className="border-r border-[#D1D5DB] px-1.5 py-1.5 text-center">
                      {item.uom}
                    </td>
                    <td className="border-r border-[#D1D5DB] px-1.5 py-1.5 font-mono">
                      {item.hsnCode || '-'}
                    </td>
                    <td className="border-r border-[#D1D5DB] px-1.5 py-1.5 text-right font-mono">
                      {item.quantity}
                    </td>
                    <td className="border-r border-[#D1D5DB] px-1.5 py-1.5 text-right font-mono">
                      {formatINR(item.pricePerUnit)}
                    </td>
                    <td className="px-1.5 py-1.5 text-right font-mono font-semibold">
                      {formatINR(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F3F4F6] font-bold border-t border-[#1F2937]">
                  <td colSpan={5} className="border-r border-[#9CA3AF] px-2 py-1.5 text-right">
                    TOTAL
                  </td>
                  <td className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-right font-mono">
                    {totals.totalQuantity}
                  </td>
                  <td className="border-r border-[#9CA3AF] px-1.5 py-1.5 text-right">
                    Total
                  </td>
                  <td className="px-1.5 py-1.5 text-right font-mono">
                    {formatINR(totals.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Remarks & Summary Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-12 border-t border-[#1F2937]">
            <div className="sm:col-span-7 p-3 sm:border-r border-b sm:border-b-0 border-[#1F2937] space-y-2">
              <div>
                <div className="text-[10px] font-bold uppercase text-[#4B5563]">Remarks</div>
                <div className="mt-0.5 text-[11px] min-h-[28px]">
                  {gatePass.remarks || 'No additional remarks.'}
                </div>
              </div>
              <div className="border-t border-[#E5E7EB] pt-1.5">
                <div className="text-[10px] font-bold uppercase text-[#4B5563]">
                  Amount in Words
                </div>
                <div className="font-semibold text-[11px]">
                  {numberToIndianWords(totals.grandTotal)}
                </div>
              </div>
              {(gatePass.dispatchDetails || gatePass.acknowledgementDetails) && (
                <div className="border-t border-[#E5E7EB] pt-1.5 space-y-1 text-[10px]">
                  {gatePass.dispatchDetails && (
                    <div>
                      <span className="font-bold">Dispatched:</span>{' '}
                      {formatDateTimeShort(gatePass.dispatchDetails.dispatchedAt)} by{' '}
                      {gatePass.dispatchDetails.dispatchedByName}
                    </div>
                  )}
                  {gatePass.acknowledgementDetails && (
                    <div>
                      <span className="font-bold">Acknowledged:</span>{' '}
                      {formatDateTimeShort(gatePass.acknowledgementDetails.acknowledgedAt)} ·
                      Received By: {gatePass.acknowledgementDetails.receivedBy}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sm:col-span-5 p-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#4B5563]">Total Quantity:</span>
                <span className="font-mono font-semibold">{totals.totalQuantity}</span>
              </div>
              <div className="flex justify-between border-t border-[#D1D5DB] pt-1">
                <span className="text-[#4B5563]">App. Value in Rs:</span>
                <span className="font-mono font-semibold">
                  Rs. {formatINR(gatePass.appValue)}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-[#1F2937] pt-1.5 text-xs font-extrabold">
                <span>Grand Total Amount:</span>
                <span className="font-mono">Rs. {formatINR(totals.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* 3-Column Signature Block */}
          <div className="grid grid-cols-3 border-t-2 border-[#1F2937] text-center">
            <div className="border-r border-[#1F2937] p-3 flex flex-col justify-between min-h-[78px]">
              <div className="text-[10px] font-bold uppercase text-[#4B5563]">Prepared By</div>
              <div className="pt-6 text-[10.5px] font-semibold">
                {gatePass.createdByName}
              </div>
            </div>
            <div className="border-r border-[#1F2937] p-3 flex flex-col justify-between min-h-[78px]">
              <div className="text-[10px] font-bold uppercase text-[#4B5563]">Authorized By</div>
              <div className="pt-6 text-[10.5px] font-semibold">
                {gatePass.dispatchDetails?.dispatchedByName || '_______________________'}
              </div>
            </div>
            <div className="p-3 flex flex-col justify-between min-h-[78px]">
              <div className="text-[10px] font-bold uppercase text-[#4B5563]">Received By</div>
              <div className="pt-6 text-[10.5px] font-semibold">
                {gatePass.acknowledgementDetails?.receivedBy || '_______________________'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Printer,
  Send,
} from 'lucide-react';
import type { GatePass, User } from '../types/gatepass';
import {
  calculateGatePassTotals,
  formatDateShort,
  formatDateTimeShort,
  formatINR,
} from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';

interface GatePassDetailsPageProps {
  gatePass: GatePass | null;
  currentUser: User;
  onBack: () => void;
  onEditInForm: (gp: GatePass) => void;
  onPrint: (gp: GatePass) => void;
  onDispatch: (
    id: string,
    payload: { vehicleOrCourierRef?: string; dispatchRemarks?: string }
  ) => Promise<GatePass | null>;
  onAcknowledge: (
    id: string,
    payload: { receivedBy: string; remarks?: string }
  ) => Promise<GatePass | null>;
}

export function GatePassDetailsPage({
  gatePass,
  currentUser,
  onBack,
  onEditInForm,
  onPrint,
  onDispatch,
  onAcknowledge,
}: GatePassDetailsPageProps) {
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!gatePass) {
    return (
      <div className="rounded-md border border-[#C5CBE0] bg-white p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-[#1C2130]">No Gate Pass selected.</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded bg-[#2B3352] px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Gate Pass List
        </button>
      </div>
    );
  }

  const totals = calculateGatePassTotals(gatePass.items);
  const canAck =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'SUPERVISOR' ||
    currentUser.role === 'SECURITY';

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded border border-[#BFC5D9] bg-white px-3 py-1.5 text-xs font-semibold text-[#2E354A] hover:bg-[#F3F5FA]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1C2130] font-mono">
              {gatePass.gpNo}
            </h1>
            <p className="text-xs text-[#5A627A]">
              Created {formatDateTimeShort(gatePass.createdAt)} by {gatePass.createdByName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEditInForm(gatePass)}
            className="inline-flex items-center gap-1.5 rounded border border-[#BFC5D9] bg-white px-3.5 py-2 text-xs font-bold text-[#1C2130] hover:bg-[#F3F5FA]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {gatePass.status === 'PENDING' ? 'Edit in Entry Form' : 'Open in Form'}
          </button>

          {gatePass.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => setDispatchOpen(true)}
              className="inline-flex items-center gap-1.5 rounded bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E40AF]"
            >
              <Send className="w-3.5 h-3.5" />
              Confirm Despatch
            </button>
          )}

          {gatePass.status === 'DISPATCHED' && canAck && (
            <button
              type="button"
              onClick={() => setAckOpen(true)}
              className="inline-flex items-center gap-1.5 rounded bg-[#15803D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#166534]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ack Confirm
            </button>
          )}

          <button
            type="button"
            onClick={() => onPrint(gatePass)}
            className="inline-flex items-center gap-1.5 rounded bg-[#2B3352] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E243B]"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Header Metadata Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border border-[#C5CBE0] bg-white p-4 space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#2B3352] border-b border-[#EAEDF5] pb-2">
            Sender &amp; Consignee Details
          </h2>
          <div className="space-y-2 text-xs">
            {gatePass.fromAddress && (
              <div className="pb-2 border-b border-[#EAEDF5]">
                <span className="font-bold text-[#5A627A] block">From</span>
                <p className="whitespace-pre-line font-semibold text-[#1C2130] mt-0.5">
                  {gatePass.fromAddress}
                </p>
              </div>
            )}
            <div>
              <span className="font-bold text-[#5A627A] block">Sent To</span>
              <p className="whitespace-pre-line font-semibold text-[#1C2130] mt-0.5">
                {gatePass.sentTo}
              </p>
            </div>
            <div className="pt-2 border-t border-[#EAEDF5]">
              <span className="text-[#5A627A] block">GST No</span>
              <span className="font-mono font-semibold">{gatePass.gstNo || '-'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[#C5CBE0] bg-white p-4 space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#2B3352] border-b border-[#EAEDF5] pb-2">
            Gate Pass Classification & Logistics
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#5A627A] block">Department</span>
              <span className="font-semibold text-[#1C2130]">{gatePass.departmentName}</span>
            </div>
            <div>
              <span className="text-[#5A627A] block">Expected Date</span>
              <span className="font-mono font-semibold">{formatDateShort(gatePass.expectedDate)}</span>
            </div>
            <div>
              <span className="text-[#5A627A] block">Precious Material</span>
              <span className="font-semibold">{gatePass.preciousMaterial ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-[#5A627A] block">Returnable</span>
              <span className="font-semibold">{gatePass.returnable ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-[#5A627A] block">App. Value in Rs</span>
              <span className="font-mono font-bold text-[#1C2130]">
                Rs. {formatINR(gatePass.appValue)}
              </span>
            </div>
            <div className="col-span-2 pt-1 border-t border-[#EAEDF5]">
              <span className="text-[#5A627A] block">Despatch Thru</span>
              <span className="font-semibold">{gatePass.despatchThru || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Item Breakdown Table */}
      <div className="rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
        <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#1C2130]">
            Item Details Breakdown
          </h2>
          <span className="text-xs font-mono font-bold text-[#2B3352]">
            Grand Total: Rs. {formatINR(totals.grandTotal)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-xs">
            <thead className="bg-[#F5F6FA] border-b border-[#DFE3F0] text-[#3E455B]">
              <tr>
                <th className="px-2.5 py-2 text-center">S.No</th>
                <th className="px-2.5 py-2 text-left">Stock No</th>
                <th className="px-2.5 py-2 text-left">Description</th>
                <th className="px-2.5 py-2 text-center">UOM</th>
                <th className="px-2.5 py-2 text-left">HSN</th>
                <th className="px-2.5 py-2 text-right">Qty</th>
                <th className="px-2.5 py-2 text-right">Price/Unit</th>
                <th className="px-2.5 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {gatePass.items.map((item) => (
                <tr key={item.id} className="border-b border-[#EAEDF5]">
                  <td className="px-2.5 py-2 text-center font-mono">{item.sNo}</td>
                  <td className="px-2.5 py-2 font-mono">{item.stockNo}</td>
                  <td className="px-2.5 py-2">{item.description}</td>
                  <td className="px-2.5 py-2 text-center">{item.uom}</td>
                  <td className="px-2.5 py-2 font-mono">{item.hsnCode || '-'}</td>
                  <td className="px-2.5 py-2 text-right font-mono">{item.quantity}</td>
                  <td className="px-2.5 py-2 text-right font-mono">{formatINR(item.pricePerUnit)}</td>
                  <td className="px-2.5 py-2 text-right font-mono font-bold">{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#ECEEF6] font-bold border-t border-[#C5CBE0]">
              <tr>
                <td colSpan={5} className="px-3 py-2 text-right">TOTAL</td>
                <td className="px-2.5 py-2 text-right font-mono">{totals.totalQuantity}</td>
                <td className="px-2.5 py-2 text-right text-[#4A5168]">Grand Total</td>
                <td className="px-2.5 py-2 text-right font-mono">Rs. {formatINR(totals.grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Dispatch, Acknowledgement & Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border border-[#C5CBE0] bg-white p-4 space-y-3 text-xs">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#2B3352] border-b border-[#EAEDF5] pb-2">
            Dispatch & Acknowledgement Records
          </h2>
          <div>
            <div className="font-bold text-[#4A5168]">Remarks</div>
            <p className="mt-0.5 text-[#1C2130]">{gatePass.remarks || 'No remarks.'}</p>
          </div>
          <div className="border-t border-[#EAEDF5] pt-2">
            <div className="font-bold text-[#1E40AF]">Dispatch Details</div>
            {gatePass.dispatchDetails ? (
              <div className="mt-1 space-y-0.5 text-[#374151]">
                <p>Dispatched By: <strong>{gatePass.dispatchDetails.dispatchedByName}</strong></p>
                <p>Date & Time: {formatDateTimeShort(gatePass.dispatchDetails.dispatchedAt)}</p>
                <p>Carrier/Vehicle: {gatePass.dispatchDetails.vehicleOrCourierRef || gatePass.dispatchDetails.despatchThru}</p>
                {gatePass.dispatchDetails.remarks && <p>Notes: {gatePass.dispatchDetails.remarks}</p>}
              </div>
            ) : (
              <p className="mt-1 text-[#6B7280]">Not yet dispatched.</p>
            )}
          </div>
          <div className="border-t border-[#EAEDF5] pt-2">
            <div className="font-bold text-[#15803D]">Acknowledgement Details</div>
            {gatePass.acknowledgementDetails ? (
              <div className="mt-1 space-y-0.5 text-[#374151]">
                <p>Acknowledged By: <strong>{gatePass.acknowledgementDetails.acknowledgedByName}</strong></p>
                <p>Received By: <strong>{gatePass.acknowledgementDetails.receivedBy}</strong></p>
                <p>Date & Time: {formatDateTimeShort(gatePass.acknowledgementDetails.acknowledgedAt)}</p>
                {gatePass.acknowledgementDetails.remarks && <p>Notes: {gatePass.acknowledgementDetails.remarks}</p>}
              </div>
            ) : (
              <p className="mt-1 text-[#6B7280]">Pending receipt acknowledgement.</p>
            )}
          </div>
        </div>

        <div className="rounded-md border border-[#C5CBE0] bg-white p-4 space-y-3 text-xs">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#2B3352] border-b border-[#EAEDF5] pb-2">
            Transaction Audit Log
          </h2>
          <div className="space-y-2.5 max-h-60 overflow-y-auto erp-scroll pr-1">
            {gatePass.auditLog.map((entry) => (
              <div
                key={entry.id}
                className="rounded border border-[#E6E9F2] bg-[#F8F9FC] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#2B3352]">{entry.action}</span>
                  <span className="font-mono text-[11px] text-[#5A627A]">
                    {formatDateTimeShort(entry.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-[#1C2130]">{entry.summary}</p>
                <p className="mt-0.5 text-[11px] text-[#5A627A]">Actor: {entry.performedByName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={dispatchOpen}
        title={`Confirm Dispatch · ${gatePass.gpNo}`}
        description="Mark this Gate Pass as DISPATCHED and lock ordinary editing."
        confirmLabel="Confirm Despatch"
        loading={busy}
        fields={[
          {
            key: 'vehicleOrCourierRef',
            label: 'Vehicle No / Courier AWB Reference',
            defaultValue: gatePass.despatchThru,
          },
          {
            key: 'dispatchRemarks',
            label: 'Dispatch Remarks',
            multiline: true,
          },
        ]}
        onConfirm={async (vals) => {
          setBusy(true);
          try {
            const res = await onDispatch(gatePass.id, vals);
            if (res) setDispatchOpen(false);
          } finally {
            setBusy(false);
          }
        }}
        onCancel={() => setDispatchOpen(false)}
      />

      <ConfirmModal
        open={ackOpen}
        title={`Acknowledge Receipt · ${gatePass.gpNo}`}
        description="Confirm receipt of material while preserving dispatch details."
        confirmLabel="Confirm Acknowledgement"
        confirmTone="success"
        loading={busy}
        fields={[
          {
            key: 'receivedBy',
            label: 'Received By (Name & Designation)',
            required: true,
          },
          {
            key: 'remarks',
            label: 'Acknowledgement Remarks',
            multiline: true,
          },
        ]}
        onConfirm={async (vals) => {
          setBusy(true);
          try {
            const res = await onAcknowledge(gatePass.id, {
              receivedBy: vals.receivedBy || '',
              remarks: vals.remarks || '',
            });
            if (res) setAckOpen(false);
          } finally {
            setBusy(false);
          }
        }}
        onCancel={() => setAckOpen(false)}
      />
    </div>
  );
}

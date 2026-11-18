import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FilePlus2,
  PackageCheck,
  Truck,
} from 'lucide-react';
import type { DashboardSummary, GatePass } from '../types/gatepass';
import { formatDateShort, formatINR } from '../utils/calculations';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onNewGatePass: () => void;
  onOpenGatePass: (gp: GatePass) => void;
  onViewDetails: (gp: GatePass) => void;
  onNavigateList: () => void;
}

export function DashboardPage({
  summary,
  loading,
  onNewGatePass,
  onOpenGatePass,
  onViewDetails,
  onNavigateList,
}: DashboardPageProps) {
  if (loading && !summary) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-md border border-[#C8CEE0] bg-white animate-pulse p-4"
            />
          ))}
        </div>
        <div className="h-72 rounded-md border border-[#C8CEE0] bg-white animate-pulse" />
      </div>
    );
  }

  const data = summary || {
    totalGatePasses: 0,
    pendingCount: 0,
    dispatchedCount: 0,
    acknowledgedCount: 0,
    totalValue: 0,
    returnablePendingCount: 0,
    preciousCount: 0,
    recentGatePasses: [],
    departmentStats: [],
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1C2130]">Operations Dashboard</h1>
          <p className="text-xs text-[#5A627A] mt-0.5">
            Live overview of TJD non-stock material movements, dispatches, and returnable challans.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewGatePass}
          className="inline-flex items-center gap-2 rounded bg-[#2B3352] px-4 py-2 text-xs font-bold text-white hover:bg-[#1E243B] whitespace-nowrap shrink-0"
        >
          <FilePlus2 className="w-4 h-4" />
          New Non-Stock Gate Pass
        </button>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-md border border-[#C5CBE0] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5A627A]">
            <span>Total Gate Passes</span>
            <PackageCheck className="w-4 h-4 text-[#2B3352]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[#1C2130]">
            {data.totalGatePasses}
          </div>
          <div className="mt-1 text-xs text-[#5A627A] font-mono">
            Total Value: Rs. {formatINR(data.totalValue)}
          </div>
        </div>

        <div className="rounded-md border border-[#C5CBE0] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#92400E]">
            <span>Pending Gate Passes</span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[#1C2130]">
            {data.pendingCount}
          </div>
          <div className="mt-1 text-xs text-[#5A627A]">
            Awaiting dispatch confirmation
          </div>
        </div>

        <div className="rounded-md border border-[#C5CBE0] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1E40AF]">
            <span>Dispatched Gate Passes</span>
            <Truck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[#1C2130]">
            {data.dispatchedCount}
          </div>
          <div className="mt-1 text-xs text-[#5A627A]">
            {data.returnablePendingCount} returnable open
          </div>
        </div>

        <div className="rounded-md border border-[#C5CBE0] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#166534]">
            <span>Acknowledged Gate Passes</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-[#1C2130]">
            {data.acknowledgedCount}
          </div>
          <div className="mt-1 text-xs text-[#5A627A]">
            {data.preciousCount} precious material records
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Entries + Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Recent Gate Pass Entries */}
        <div className="lg:col-span-8 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-3">
            <h2 className="text-sm font-bold text-[#1C2130]">Recent Gate Pass Entries</h2>
            <button
              type="button"
              onClick={onNavigateList}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2B3352] hover:underline whitespace-nowrap shrink-0"
            >
              View All Records
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#F5F6FA] text-[#4A5168] border-b border-[#DFE3F0]">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold">G.P. No</th>
                  <th className="px-3 py-2.5 text-left font-bold">Sent To</th>
                  <th className="px-3 py-2.5 text-left font-bold">Department</th>
                  <th className="px-3 py-2.5 text-left font-bold">Status</th>
                  <th className="px-3 py-2.5 text-right font-bold">Grand Total</th>
                  <th className="px-3 py-2.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recentGatePasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#5A627A]">
                      No gate passes recorded yet. Create your first Non-Stock Gate Pass.
                    </td>
                  </tr>
                ) : (
                  data.recentGatePasses.map((gp) => (
                    <tr
                      key={gp.id}
                      className="border-b border-[#EAEDF5] hover:bg-[#F9FAFC]"
                    >
                      <td className="px-3 py-2.5 font-mono font-bold text-[#2B3352] whitespace-nowrap">
                        <div>{gp.gpNo}</div>
                        <div className="text-[11px] font-normal text-[#6B7280]">
                          {formatDateShort(gp.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[200px]">
                        <div className="font-medium text-[#1C2130] truncate">
                          {gp.sentTo.split('\n')[0]}
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono">
                          {gp.gstNo || 'No GSTIN'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#374151]">{gp.departmentName}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`text-[11px] font-bold ${
                            gp.status === 'ACKNOWLEDGED'
                              ? 'text-[#15803D]'
                              : gp.status === 'DISPATCHED'
                                ? 'text-[#1D4ED8]'
                                : 'text-[#B45309]'
                          }`}
                        >
                          {gp.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#1C2130] whitespace-nowrap">
                        Rs. {formatINR(gp.grandTotal)}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails(gp)}
                          className="text-xs font-semibold text-[#2B3352] hover:underline"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenGatePass(gp)}
                          className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                        >
                          {gp.status === 'PENDING' ? 'Edit' : 'Open Form'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Summary */}
        <div className="lg:col-span-4 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-3">
            <h2 className="text-sm font-bold text-[#1C2130]">Department Volume</h2>
          </div>
          <div className="divide-y divide-[#EAEDF5]">
            {data.departmentStats.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#5A627A]">No department activity yet.</div>
            ) : (
              data.departmentStats.map((d) => (
                <div key={d.departmentName} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#1C2130] truncate">
                      {d.departmentName}
                    </div>
                    <div className="text-[11px] text-[#5A627A]">
                      {d.count} {d.count === 1 ? 'Gate Pass' : 'Gate Passes'}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#2B3352] whitespace-nowrap">
                    Rs. {formatINR(d.totalValue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

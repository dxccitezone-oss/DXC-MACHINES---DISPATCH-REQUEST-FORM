import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, FilePlus2, FileSpreadsheet, Printer, Search } from 'lucide-react';
import type { Department, GatePass } from '../types/gatepass';
import { formatDateShort, formatINR } from '../utils/calculations';

interface GatePassListPageProps {
  gatePasses: GatePass[];
  departments: Department[];
  loading: boolean;
  onNewGatePass: () => void;
  onOpenInForm: (gp: GatePass) => void;
  onViewDetails: (gp: GatePass) => void;
  onPrint: (gp: GatePass) => void;
  onDownloadExcel: () => void;
}

type SortKey = 'createdAt' | 'gpNo' | 'grandTotal' | 'status';

export function GatePassListPage({
  gatePasses,
  departments,
  loading,
  onNewGatePass,
  onOpenInForm,
  onViewDetails,
  onPrint,
  onDownloadExcel,
}: GatePassListPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GatePass['status']>('ALL');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dq = deptFilter.trim().toLowerCase();
    return gatePasses
      .filter((gp) => {
        if (statusFilter !== 'ALL' && gp.status !== statusFilter) return false;
        if (dq && !(gp.departmentName || '').toLowerCase().includes(dq)) return false;
        if (!q) return true;
        return (
          (gp.gpNo || '').toLowerCase().includes(q) ||
          (gp.fromAddress || '').toLowerCase().includes(q) ||
          (gp.sentTo || '').toLowerCase().includes(q) ||
          (gp.gstNo || '').toLowerCase().includes(q) ||
          (gp.despatchThru || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'createdAt') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortKey === 'grandTotal') {
          cmp = (a.grandTotal || 0) - (b.grandTotal || 0);
        } else if (sortKey === 'gpNo') {
          cmp = (a.gpNo || '').localeCompare(b.gpNo || '');
        } else {
          cmp = (a.status || '').localeCompare(b.status || '');
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [gatePasses, search, statusFilter, deptFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1C2130]">Gate Pass Register</h1>
          <p className="text-xs text-[#5A627A] mt-0.5">
            Browse, edit pending records, track dispatch status, and print invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadExcel}
            className="inline-flex items-center gap-1.5 rounded bg-[#15803D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#166534] whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={onNewGatePass}
            className="inline-flex items-center gap-1.5 rounded bg-[#2B3352] px-4 py-2 text-xs font-bold text-white hover:bg-[#1E243B] whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="w-4 h-4" />
            New Gate Pass
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-md border border-[#C5CBE0] bg-white p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search G.P. No, Sent To, GSTIN, Carrier..."
            className="w-full rounded border border-[#BFC5D9] bg-white pl-9 pr-3 py-1.5 text-xs focus:border-[#2B3352] focus:outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <input
            type="text"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by Department..."
            className="w-full rounded border border-[#BFC5D9] bg-white px-2.5 py-1.5 text-xs focus:border-[#2B3352] focus:outline-none"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-1 rounded bg-[#ECEEF6] p-1">
          {(['ALL', 'PENDING', 'DISPATCHED', 'ACKNOWLEDGED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`flex-1 rounded px-2 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-[#1C2130] shadow-xs'
                  : 'text-[#5A627A] hover:text-[#1C2130]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-xs">
            <thead className="bg-[#ECEEF6] text-[#1F2538] border-b border-[#C5CBE0]">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold">
                  <button
                    type="button"
                    onClick={() => toggleSort('gpNo')}
                    className="inline-flex items-center gap-1 hover:text-[#2B3352]"
                  >
                    G.P. No
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left font-bold">
                  <button
                    type="button"
                    onClick={() => toggleSort('createdAt')}
                    className="inline-flex items-center gap-1 hover:text-[#2B3352]"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left font-bold">Sent To</th>
                <th className="px-3 py-2.5 text-left font-bold">Department</th>
                <th className="px-3 py-2.5 text-center font-bold">Flags</th>
                <th className="px-3 py-2.5 text-left font-bold">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1 hover:text-[#2B3352]"
                  >
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right font-bold">
                  <button
                    type="button"
                    onClick={() => toggleSort('grandTotal')}
                    className="inline-flex items-center gap-1 hover:text-[#2B3352]"
                  >
                    Grand Total
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#5A627A]">
                    Loading Gate Pass records...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#5A627A]">
                    No Gate Passes match the current filters.
                  </td>
                </tr>
              ) : (
                paginated.map((gp) => (
                  <tr
                    key={gp.id}
                    className="border-b border-[#EAEDF5] hover:bg-[#F7F8FC]"
                  >
                    <td className="px-3 py-2.5 font-mono font-bold text-[#2B3352] whitespace-nowrap">
                      {gp.gpNo}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[#4A5168] whitespace-nowrap">
                      {formatDateShort(gp.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 max-w-[230px]">
                      <div className="font-medium text-[#1C2130] truncate">
                        {gp.sentTo.split('\n')[0]}
                      </div>
                      <div className="text-[11px] font-mono text-[#6B7280]">
                        {gp.gstNo || 'No GSTIN'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#374151]">{gp.departmentName}</td>
                    <td className="px-3 py-2.5 text-center text-[11px] text-[#4A5168]">
                      {gp.returnable ? 'Ret' : 'Non-Ret'}
                      {gp.preciousMaterial ? ' · Precious' : ''}
                    </td>
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
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-[#1C2130] whitespace-nowrap">
                      Rs. {formatINR(gp.grandTotal)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-2.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails(gp)}
                        className="text-xs font-semibold text-[#2B3352] hover:underline"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenInForm(gp)}
                        className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                      >
                        {gp.status === 'PENDING' ? 'Edit' : 'Form'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrint(gp)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#374151] hover:text-[#111827]"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-[#DFE3F0] bg-[#F8F9FC] px-4 py-2.5 text-xs text-[#4A5168]">
          <div>
            Showing <strong className="font-mono">{paginated.length}</strong> of{' '}
            <strong className="font-mono">{filtered.length}</strong> records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-[#C5CBE0] bg-white p-1 hover:bg-[#ECEEF6] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-[#C5CBE0] bg-white p-1 hover:bg-[#ECEEF6] disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

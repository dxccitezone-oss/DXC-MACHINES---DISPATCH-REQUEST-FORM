import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Printer,
  RotateCcw,
} from 'lucide-react';
import type { Department, GatePass } from '../types/gatepass';
import { formatDateShort, formatINR, round2 } from '../utils/calculations';

interface ReportsPageProps {
  gatePasses: GatePass[];
  departments: Department[];
  onViewDetails: (gp: GatePass) => void;
  onOpenInForm: (gp: GatePass) => void;
  onPrint: (gp: GatePass) => void;
  onDownloadExcel: () => void;
}

type ReportSortField = 'gpNo' | 'createdAt' | 'departmentName' | 'status' | 'grandTotal';

export function ReportsPage({
  gatePasses,
  departments,
  onViewDetails,
  onOpenInForm,
  onPrint,
  onDownloadExcel,
}: ReportsPageProps) {
  const [gpNoQuery, setGpNoQuery] = useState('');
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | GatePass['status']>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<ReportSortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const qGp = gpNoQuery.trim().toLowerCase();
    const qDept = departmentQuery.trim().toLowerCase();

    return gatePasses
      .filter((gp) => {
        if (qGp && !(gp.gpNo || '').toLowerCase().includes(qGp)) return false;
        if (qDept && !(gp.departmentName || '').toLowerCase().includes(qDept)) return false;
        if (status !== 'ALL' && gp.status !== status) return false;
        if (dateFrom) {
          const gpDate = (gp.createdAt || '').slice(0, 10);
          if (gpDate < dateFrom) return false;
        }
        if (dateTo) {
          const gpDate = (gp.createdAt || '').slice(0, 10);
          if (gpDate > dateTo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'createdAt') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortField === 'grandTotal') {
          cmp = (a.grandTotal || 0) - (b.grandTotal || 0);
        } else {
          cmp = String(a[sortField] ?? '').localeCompare(String(b[sortField] ?? ''));
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [gatePasses, gpNoQuery, departmentQuery, status, dateFrom, dateTo, sortField, sortDir]);

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, gp) => {
        acc.count += 1;
        acc.totalQty = round2(acc.totalQty + (gp.totalQuantity || 0));
        acc.totalTax = round2(acc.totalTax + (gp.totalTaxValue || 0));
        acc.grandTotal = round2(acc.grandTotal + (gp.grandTotal || 0));
        return acc;
      },
      { count: 0, totalQty: 0, totalTax: 0, grandTotal: 0 }
    );
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (field: ReportSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleReset = () => {
    setGpNoQuery('');
    setDepartmentQuery('');
    setStatus('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleExportCsv = () => {
    const header = [
      'G.P. No',
      'Date',
      'From',
      'Sent To',
      'GST No',
      'Department',
      'Status',
      'Returnable',
      'Precious',
      'Total Qty',
      'Grand Total',
    ];
    const escapeCsv = (val: string | number) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const lines = [
      header.map(escapeCsv).join(','),
      ...filtered.map((gp) =>
        [
          gp.gpNo,
          (gp.createdAt || '').slice(0, 10),
          (gp.fromAddress || '').replace(/\r?\n/g, ' '),
          (gp.sentTo || '').replace(/\r?\n/g, ' '),
          gp.gstNo || '',
          gp.departmentName || '',
          gp.status,
          gp.returnable ? 'Yes' : 'No',
          gp.preciousMaterial ? 'Yes' : 'No',
          gp.totalQuantity || 0,
          (gp.grandTotal || 0).toFixed(2),
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TJD_GatePass_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1C2130]">Gate Pass Reports</h1>
          <p className="text-xs text-[#5A627A] mt-0.5">
            Search and analyze Dispatch Requests &amp; Gate Passes by number, date range, department, and status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded border border-[#BFC5D9] bg-white px-3 py-2 text-xs font-bold text-[#2E354A] hover:bg-[#F3F5FA]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onDownloadExcel}
            className="inline-flex items-center gap-1.5 rounded bg-[#15803D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#166534]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Download Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded bg-[#2B3352] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1E243B]"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Search Criteria Panel */}
      <div className="rounded-md border border-[#C5CBE0] bg-[#ECEEF6] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-[#2E354A] mb-1">
            Gate Pass No
          </label>
          <input
            type="text"
            value={gpNoQuery}
            onChange={(e) => {
              setGpNoQuery(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. 0004"
            className="w-full rounded border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs font-mono focus:border-[#2B3352] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#2E354A] mb-1">
            Department
          </label>
          <input
            type="text"
            value={departmentQuery}
            onChange={(e) => {
              setDepartmentQuery(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. Maintenance"
            className="w-full rounded border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs focus:border-[#2B3352] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#2E354A] mb-1">
            Status
          </label>
          <div className="grid grid-cols-2 gap-1 rounded border border-[#A8B0C8] bg-white p-1">
            {(['ALL', 'PENDING', 'DISPATCHED', 'ACKNOWLEDGED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatus(st);
                  setPage(1);
                }}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  status === st
                    ? 'bg-[#2B3352] text-white'
                    : 'text-[#4A5168] hover:bg-[#ECEEF6]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#2E354A] mb-1">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs font-mono focus:border-[#2B3352] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#2E354A] mb-1">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-[#A8B0C8] bg-white px-2.5 py-1.5 text-xs font-mono focus:border-[#2B3352] focus:outline-none"
          />
        </div>
      </div>

      {/* Report Summary Totals Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded border border-[#C5CBE0] bg-white px-4 py-2.5">
          <div className="text-[11px] font-semibold text-[#5A627A]">Matched Records</div>
          <div className="text-base font-bold font-mono text-[#1C2130]">{summary.count}</div>
        </div>
        <div className="rounded border border-[#C5CBE0] bg-white px-4 py-2.5">
          <div className="text-[11px] font-semibold text-[#5A627A]">Total Quantity</div>
          <div className="text-base font-bold font-mono text-[#1C2130]">{summary.totalQty}</div>
        </div>
        <div className="rounded border border-[#C5CBE0] bg-white px-4 py-2.5">
          <div className="text-[11px] font-semibold text-[#5A627A]">Aggregate Grand Total</div>
          <div className="text-base font-bold font-mono text-[#2B3352]">
            Rs. {formatINR(summary.grandTotal)}
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-xs">
            <thead className="bg-[#ECEEF6] text-[#1F2538] border-b border-[#C5CBE0]">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold">
                  <button
                    type="button"
                    onClick={() => handleSort('gpNo')}
                    className="inline-flex items-center gap-1"
                  >
                    G.P. No <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left font-bold">
                  <button
                    type="button"
                    onClick={() => handleSort('createdAt')}
                    className="inline-flex items-center gap-1"
                  >
                    Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left font-bold">Recipient</th>
                <th className="px-3 py-2.5 text-left font-bold">
                  <button
                    type="button"
                    onClick={() => handleSort('departmentName')}
                    className="inline-flex items-center gap-1"
                  >
                    Department <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left font-bold">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1"
                  >
                    Status <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right font-bold">Qty</th>
                <th className="px-3 py-2.5 text-right font-bold">
                  <button
                    type="button"
                    onClick={() => handleSort('grandTotal')}
                    className="inline-flex items-center gap-1"
                  >
                    Grand Total <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-right font-bold">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#5A627A]">
                    No Gate Pass records found for selected report criteria.
                  </td>
                </tr>
              ) : (
                rows.map((gp) => (
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
                    <td className="px-3 py-2.5 max-w-[200px] truncate">
                      {gp.sentTo.split('\n')[0]}
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
                    <td className="px-3 py-2.5 text-right font-mono">{gp.totalQuantity}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                      Rs. {formatINR(gp.grandTotal)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-2">
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
                        Form
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrint(gp)}
                        className="inline-flex items-center text-[#374151] hover:text-[#111827]"
                        title="Print A4 Gate Pass"
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

        <div className="flex items-center justify-between border-t border-[#DFE3F0] bg-[#F8F9FC] px-4 py-2.5 text-xs text-[#4A5168]">
          <div>
            Page <strong className="font-mono">{safePage}</strong> of{' '}
            <strong className="font-mono">{totalPages}</strong> ({filtered.length} records)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-[#C5CBE0] bg-white p-1 hover:bg-[#ECEEF6] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-[#C5CBE0] bg-white p-1 hover:bg-[#ECEEF6] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

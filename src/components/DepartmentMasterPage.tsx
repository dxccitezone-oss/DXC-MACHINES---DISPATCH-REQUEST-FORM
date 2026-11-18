import React, { useState } from 'react';
import { Edit2, Plus, Search } from 'lucide-react';
import type { Department, User } from '../types/gatepass';

interface DepartmentMasterPageProps {
  departments: Department[];
  currentUser: User;
  onSaveDepartment: (dept: Partial<Department> & { code: string; name: string }) => Promise<boolean>;
}

export function DepartmentMasterPage({
  departments,
  currentUser,
  onSaveDepartment,
}: DepartmentMasterPageProps) {
  const canEdit = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [hodName, setHodName] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const filtered = departments.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.code.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.hodName.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setEditingId(undefined);
    setCode('');
    setName('');
    setCostCenter('');
    setHodName('');
    setActive(true);
  };

  const handleEdit = (d: Department) => {
    setEditingId(d.id);
    setCode(d.code);
    setName(d.name);
    setCostCenter(d.costCenter);
    setHodName(d.hodName);
    setActive(d.active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const ok = await onSaveDepartment({
        id: editingId,
        code,
        name,
        costCenter,
        hodName,
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
        <h1 className="text-xl font-bold text-[#1C2130]">Department Master</h1>
        <p className="text-xs text-[#5A627A] mt-0.5">
          Manage organizational departments and cost centers referenced in Gate Passes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Panel */}
        <div className="lg:col-span-4 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1C2130]">
              {editingId ? 'Edit Department' : 'Add Department'}
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
                Department Code <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MAINT"
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono uppercase focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">
                Department Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maintenance & Utilities"
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Cost Center</label>
              <input
                type="text"
                disabled={!canEdit}
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                placeholder="e.g. CC-101"
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Head of Department</label>
              <input
                type="text"
                disabled={!canEdit}
                value={hodName}
                onChange={(e) => setHodName(e.target.value)}
                placeholder="HOD Full Name"
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
              <span className="font-semibold text-[#1C2130]">Active Department</span>
            </label>

            {canEdit ? (
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-[#2B3352] py-2 px-4 text-xs font-bold text-white hover:bg-[#1E243B] disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : editingId ? 'Update Department' : 'Create Department'}
              </button>
            ) : (
              <p className="text-[11px] text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded p-2">
                Only Admin or Supervisor roles can modify Department Master records.
              </p>
            )}
          </form>
        </div>

        {/* Table Panel */}
        <div className="lg:col-span-8 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-2.5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#1C2130]">
              Departments ({filtered.length})
            </h2>
            <div className="relative w-60">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter departments..."
                className="w-full rounded border border-[#BFC5D9] bg-white pl-8 pr-2.5 py-1 text-xs focus:border-[#2B3352] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#F5F6FA] border-b border-[#DFE3F0] text-[#3E455B]">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold">Code</th>
                  <th className="px-3 py-2.5 text-left font-bold">Department Name</th>
                  <th className="px-3 py-2.5 text-left font-bold">Cost Center</th>
                  <th className="px-3 py-2.5 text-left font-bold">HOD</th>
                  <th className="px-3 py-2.5 text-left font-bold">Status</th>
                  {canEdit && <th className="px-3 py-2.5 text-right font-bold">Edit</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEdit ? 6 : 5}
                      className="px-4 py-8 text-center text-[#5A627A]"
                    >
                      No departments match your search filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((dept) => (
                    <tr key={dept.id} className="border-b border-[#EAEDF5] hover:bg-[#F7F8FC]">
                      <td className="px-3 py-2.5 font-mono font-bold text-[#2B3352]">{dept.code}</td>
                      <td className="px-3 py-2.5 font-medium text-[#1C2130]">{dept.name}</td>
                      <td className="px-3 py-2.5 font-mono text-[#4A5168]">{dept.costCenter || '-'}</td>
                      <td className="px-3 py-2.5 text-[#374151]">{dept.hodName || '-'}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`font-bold text-[11px] ${
                            dept.active ? 'text-[#15803D]' : 'text-[#DC2626]'
                          }`}
                        >
                          {dept.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleEdit(dept)}
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

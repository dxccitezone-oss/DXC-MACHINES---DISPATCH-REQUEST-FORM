import React, { useEffect, useState } from 'react';
import { Edit2, ShieldAlert, UserPlus } from 'lucide-react';
import type { Department, User, UserRole } from '../types/gatepass';

interface UserManagementPageProps {
  users: User[];
  departments: Department[];
  currentUser: User;
  onSaveUser: (
    user: Partial<User> & {
      username: string;
      fullName: string;
      email: string;
      role: UserRole;
      password?: string;
    }
  ) => Promise<boolean>;
}

export function UserManagementPage({
  users,
  departments,
  currentUser,
  onSaveUser,
}: UserManagementPageProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('OPERATOR');
  const [departmentInput, setDepartmentInput] = useState(departments[0]?.name || '');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId && !departmentInput && departments[0]?.name) {
      setDepartmentInput(departments[0].name);
    }
  }, [departments, editingId, departmentInput]);

  if (!isAdmin) {
    return (
      <div className="rounded-md border border-[#FCD34D] bg-[#FFFBEB] p-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-bold text-[#78350F]">Administrator Access Required</h2>
          <p className="text-xs text-[#92400E] mt-1">
            Your current role ({currentUser.role}) does not have permission to view or manage user accounts. Switch to an Administrator account to manage RBAC permissions.
          </p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setEditingId(undefined);
    setUsername('');
    setFullName('');
    setEmail('');
    setRole('OPERATOR');
    setDepartmentInput(departments[0]?.name || '');
    setPassword('');
    setActive(true);
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setUsername(u.username);
    setFullName(u.fullName);
    setEmail(u.email);
    setRole(u.role);
    setDepartmentInput(u.departmentName || '');
    setPassword('');
    setActive(u.active);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const q = departmentInput.trim().toLowerCase();
      const matchedDept = departments.find(
        (d) => d.name.toLowerCase() === q || d.code.toLowerCase() === q
      );
      const ok = await onSaveUser({
        id: editingId,
        username,
        fullName,
        email,
        role,
        departmentId: matchedDept?.id || '',
        departmentName: matchedDept?.name || departmentInput.trim(),
        password: password.trim() || undefined,
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
        <h1 className="text-xl font-bold text-[#1C2130]">User Management & RBAC</h1>
        <p className="text-xs text-[#5A627A] mt-0.5">
          Manage portal user accounts, department assignments, and role-based permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form */}
        <div className="lg:col-span-4 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1C2130]">
              {editingId ? 'Edit User Account' : 'Create User Account'}
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
              <label className="block font-bold text-[#2E354A] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 font-mono focus:border-[#2B3352] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2E354A] mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none"
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#2E354A] mb-1">Role *</label>
                <div className="grid grid-cols-2 gap-1.5 rounded border border-[#BFC5D9] bg-[#F8F9FC] p-2">
                  {(['ADMIN', 'OPERATOR', 'SUPERVISOR', 'SECURITY'] as const).map((r) => (
                    <label key={r} className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="userRole"
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="accent-[#2B3352]"
                      />
                      <span className="font-mono font-semibold text-[#1C2130]">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold text-[#2E354A] mb-1">Department</label>
                <input
                  type="text"
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                  placeholder="Enter Department name or code"
                  className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-[#2E354A] mb-1">
                {editingId ? 'New Password (leave blank to keep)' : 'Password (default: password123)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded border border-[#BFC5D9] px-2.5 py-1.5 focus:border-[#2B3352] focus:outline-none"
              />
            </div>
            <label className="inline-flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="accent-[#2B3352]"
              />
              <span className="font-semibold text-[#1C2130]">Account Active</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-[#2B3352] py-2 px-4 text-xs font-bold text-white hover:bg-[#1E243B] disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="lg:col-span-8 rounded-md border border-[#C5CBE0] bg-white overflow-hidden">
          <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-3">
            <h2 className="text-sm font-bold text-[#1C2130]">Registered Users ({users.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#F5F6FA] border-b border-[#DFE3F0] text-[#3E455B]">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold">Full Name</th>
                  <th className="px-3 py-2.5 text-left font-bold">Username</th>
                  <th className="px-3 py-2.5 text-left font-bold">Role</th>
                  <th className="px-3 py-2.5 text-left font-bold">Department</th>
                  <th className="px-3 py-2.5 text-left font-bold">Status</th>
                  <th className="px-3 py-2.5 text-right font-bold">Edit</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#EAEDF5] hover:bg-[#F7F8FC]">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-[#1C2130]">{u.fullName}</div>
                      <div className="text-[11px] text-[#6B7280]">{u.email}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[#2B3352]">{u.username}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#1F2937]">{u.role}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{u.departmentName || '-'}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`font-bold text-[11px] ${
                          u.active ? 'text-[#15803D]' : 'text-[#DC2626]'
                        }`}
                      >
                        {u.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(u)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2B3352] hover:underline"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
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

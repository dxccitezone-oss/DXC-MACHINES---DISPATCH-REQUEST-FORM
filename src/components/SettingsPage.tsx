import React, { useEffect, useState } from 'react';
import { Database, Save } from 'lucide-react';
import type { CompanySettings, User } from '../types/gatepass';

interface SettingsPageProps {
  settings: CompanySettings;
  currentUser: User;
  onSaveSettings: (next: CompanySettings) => Promise<boolean>;
}

export function SettingsPage({
  settings,
  currentUser,
  onSaveSettings,
}: SettingsPageProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const [form, setForm] = useState<CompanySettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      await onSaveSettings(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[#1C2130]">Portal & Company Settings</h1>
        <p className="text-xs text-[#5A627A] mt-0.5">
          Configure company letterhead, home state code, and Gate Pass numbering prefix.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-md border border-[#C5CBE0] bg-white overflow-hidden"
      >
        <div className="border-b border-[#DFE3F0] bg-[#ECEEF6] px-4 py-3">
          <h2 className="text-sm font-bold text-[#1C2130]">Organization & Portal Configuration</h2>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-bold text-[#2E354A] mb-1">Company Legal Name</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full rounded border border-[#BFC5D9] px-3 py-2 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-[#2E354A] mb-1">Factory / Registered Address</label>
            <textarea
              rows={2}
              disabled={!isAdmin}
              value={form.companyAddress}
              onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
              className="w-full rounded border border-[#BFC5D9] px-3 py-2 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2E354A] mb-1">Company GSTIN</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={form.companyGstin}
              onChange={(e) => setForm({ ...form, companyGstin: e.target.value.toUpperCase() })}
              className="w-full rounded border border-[#BFC5D9] px-3 py-2 font-mono uppercase focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2E354A] mb-1">Home State Code (ST Code)</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={form.homeStateCode}
              onChange={(e) => setForm({ ...form, homeStateCode: e.target.value })}
              className="w-full rounded border border-[#BFC5D9] px-3 py-2 font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2E354A] mb-1">Contact Phone</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded border border-[#BFC5D9] px-3 py-2 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2E354A] mb-1">Stores / Dispatch Email</label>
            <input
              type="email"
              disabled={!isAdmin}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded border border-[#BFC5D9] px-3 py-2 focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-[#2E354A] mb-1">G.P. No Prefix</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={form.gpPrefix}
              onChange={(e) => setForm({ ...form, gpPrefix: e.target.value })}
              className="w-full rounded border border-[#BFC5D9] px-3 py-2 font-mono focus:border-[#2B3352] focus:outline-none disabled:bg-[#F3F4F6]"
            />
          </div>

        </div>

        <div className="border-t border-[#DFE3F0] bg-[#F8F9FC] px-5 py-3 flex items-center justify-between">
          {!isAdmin ? (
            <span className="text-xs font-medium text-[#B45309]">
              Read-only view. Only Administrator accounts can update portal settings.
            </span>
          ) : (
            <span className="text-xs text-[#5A627A]">
              Changes apply immediately to new Gate Passes and Print Invoices.
            </span>
          )}
          {isAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded bg-[#2B3352] px-4 py-2 text-xs font-bold text-white hover:bg-[#1E243B] disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </div>
      </form>

      {/* Transparent Storage Architecture Notice */}
      <div className="rounded-md border border-[#C5CBE0] bg-white p-4 flex items-start gap-3 text-xs">
        <Database className="w-4 h-4 text-[#2B3352] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-[#1C2130]">Persistence Architecture</div>
          <p className="text-[#4A5168] mt-1 leading-relaxed">
            This portal persists all Gate Passes, Item rows, Dispatch/Acknowledgement records, Departments, Stock Master items, and Users via the Express REST API (<span className="font-mono">/api/*</span>) to a relational JSON datastore file on the application server (<span className="font-mono">data/tjd-gatepass-db.json</span>). Records survive page refreshes and server restarts within the container lifecycle.
          </p>
        </div>
      </div>
    </div>
  );
}

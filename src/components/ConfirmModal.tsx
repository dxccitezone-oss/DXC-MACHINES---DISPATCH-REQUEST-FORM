import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ConfirmDialogField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  multiline?: boolean;
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: 'primary' | 'danger' | 'success';
  fields?: ConfirmDialogField[];
  loading?: boolean;
  onConfirm: (values: Record<string, string>) => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmTone = 'primary',
  fields = [],
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');

  const wasOpenRef = React.useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        initial[f.key] = f.defaultValue || '';
      });
      setValues(initial);
      setError('');
    }
    wasOpenRef.current = open;
  }, [open, fields]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !(values[f.key] || '').trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    setError('');
    onConfirm(values);
  };

  const confirmBtnStyle =
    confirmTone === 'danger'
      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
      : confirmTone === 'success'
        ? 'bg-[#15803D] hover:bg-[#166534] text-white'
        : 'bg-[#2F3759] hover:bg-[#232A45] text-white';

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md rounded-md border border-[#C7CCE0] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#DFE3F0] bg-[#ECEEF6] px-5 py-3.5 rounded-t-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#2F3759]" />
            <h3 id="confirm-modal-title" className="text-sm font-bold text-[#1C2130]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-[#5C647D] hover:text-[#1C2130] p-1 rounded"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-[#3E455B] leading-relaxed">{description}</p>

          {fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="block text-xs font-semibold text-[#2E354A]">
                {field.label}
                {field.required && <span className="text-[#DC2626] ml-0.5">*</span>}
              </label>
              {field.multiline ? (
                <textarea
                  rows={2}
                  value={values[field.key] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="w-full rounded border border-[#BFC5D9] bg-white px-3 py-2 text-sm text-[#1C2130] focus:border-[#2F3759] focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="w-full rounded border border-[#BFC5D9] bg-white px-3 py-2 text-sm text-[#1C2130] focus:border-[#2F3759] focus:outline-none"
                />
              )}
            </div>
          ))}

          {error && (
            <p className="text-xs font-medium text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E6E9F2]">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded border border-[#C3C8DC] bg-white text-[#333A4F] hover:bg-[#F3F5FA] whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 ${confirmBtnStyle}`}
            >
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

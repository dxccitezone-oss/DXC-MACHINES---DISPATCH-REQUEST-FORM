import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="no-print fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const tone =
          toast.type === 'success'
            ? 'border-[#16A34A]/30 bg-white text-[#14532D]'
            : toast.type === 'error'
              ? 'border-[#DC2626]/30 bg-white text-[#7F1D1D]'
              : toast.type === 'warning'
                ? 'border-[#D97706]/30 bg-white text-[#78350F]'
                : 'border-[#434B6B]/30 bg-white text-[#1C2130]';

        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
              ? XCircle
              : toast.type === 'warning'
                ? AlertTriangle
                : Info;

        const iconColor =
          toast.type === 'success'
            ? 'text-[#16A34A]'
            : toast.type === 'error'
              ? 'text-[#DC2626]'
              : toast.type === 'warning'
                ? 'text-[#D97706]'
                : 'text-[#434B6B]';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-md ${tone}`}
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-xs mt-1 text-[#4A5168] leading-snug">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-[#6B7280] hover:text-[#1C2130] p-0.5 rounded focus-visible:outline-2 focus-visible:outline-[#3B446B]"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

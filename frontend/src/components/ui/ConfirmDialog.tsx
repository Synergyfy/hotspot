import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  discardLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  onDiscard?: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  discardLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  onDiscard,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="p-7">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${destructive ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">{title}</h2>
              {description && <div className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{description}</div>}
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end">
              {onDiscard && discardLabel && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                >
                  {discardLabel}
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  destructive ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'
                }`}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

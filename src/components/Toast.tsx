import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto min-w-[260px] max-w-sm p-3 bg-white dark:bg-slate-900 border rounded-[6px] shadow-lg flex items-center gap-2.5 text-xs font-semibold animate-slide-in ${
            toast.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import type { NetworkProfile } from '../types/ipConfig';
import { useI18n } from '../i18n/useI18n';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  profile: NetworkProfile | null;
  onClose: () => void;
  onConfirm: (profile: NetworkProfile) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  profile,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();

  if (!isOpen || !profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-bold">{t('deleteTitle')}</h3>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-[6px] cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-2">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {t('deleteConfirm')}{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">
              "{profile.name}"
            </strong>
            ?
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('deleteWarning')}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="px-3.5 h-8 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-[6px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={onClose}
            id="btn-cancel-delete"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] transition-colors cursor-pointer shadow-xs"
            onClick={() => {
              onConfirm(profile);
              onClose();
            }}
            id="btn-confirm-delete"
          >
            <Trash2 size={14} />
            <span>{t('deleteAction')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SearchX, Plus } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

interface EmptyStateProps {
  onAddClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-[6px] gap-3">
      <div className="w-12 h-12 rounded-[6px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
        <SearchX size={24} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {t('noConfigsFound')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          {t('noConfigsFoundSub')}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 h-8 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer shadow-xs mt-1"
        onClick={onAddClick}
        id="btn-empty-add"
      >
        <Plus size={14} />
        <span>{t('createFirstConfig')}</span>
      </button>
    </div>
  );
};

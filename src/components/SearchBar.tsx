import React from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

export type FilterCategory = 'all' | 'ipv4' | 'ipv6';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  counts: {
    all: number;
    ipv4: number;
    ipv6: number;
  };
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search size={16} />
        </div>
        <input
          type="text"
          className="w-full h-10 pl-9.5 pr-9 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-xs"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          id="input-search"
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            onClick={() => onSearchChange('')}
            title="Clear search"
            id="btn-clear-search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 3 Filter Buttons: All, IPv4, IPv6 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => onFilterChange('all')}
          id="filter-chip-all"
        >
          <span>{t('filterAll')}</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-[6px] ${
              activeFilter === 'all'
                ? 'bg-blue-700 text-blue-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'ipv4'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => onFilterChange('ipv4')}
          id="filter-chip-ipv4"
        >
          <span>{t('filterIpv4')}</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-[6px] ${
              activeFilter === 'ipv4'
                ? 'bg-blue-700 text-blue-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {counts.ipv4}
          </span>
        </button>

        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'ipv6'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => onFilterChange('ipv6')}
          id="filter-chip-ipv6"
        >
          <span>{t('filterIpv6')}</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-[6px] ${
              activeFilter === 'ipv6'
                ? 'bg-blue-700 text-blue-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {counts.ipv6}
          </span>
        </button>
      </div>
    </div>
  );
};

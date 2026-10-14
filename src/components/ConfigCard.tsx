import React, { useState } from 'react';
import { Pencil, Trash2, RotateCcw } from 'lucide-react';
import type { NetworkProfile } from '../types/ipConfig';
import { useI18n } from '../i18n/useI18n';

interface ConfigCardProps {
  profile: NetworkProfile;
  isApplying: boolean;
  disabled?: boolean;
  canRollback?: boolean;
  isRollingBack?: boolean;
  onApply: (profile: NetworkProfile) => void;
  onRollback?: (profile: NetworkProfile) => void;
  onEdit: (profile: NetworkProfile) => void;
  onDelete: (profile: NetworkProfile) => void;
  onNotify: (msg: string) => void;
}

export const ConfigCard: React.FC<ConfigCardProps> = ({
  profile,
  isApplying,
  disabled = false,
  canRollback = false,
  isRollingBack = false,
  onApply,
  onRollback,
  onEdit,
  onDelete,
  onNotify,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  // Full IP address to show without hiding/masking
  const displayIp =
    profile.mode === 'dhcp'
      ? t('dhcpMode')
      : profile.ipAddress || (profile.type === 'ipv4' ? '192.168.1.1' : 'fe80::1');

  const isStatic = profile.mode !== 'dhcp';

  const handleCopyIp = (e: React.MouseEvent) => {
    if (!isStatic) return;
    e.stopPropagation();
    navigator.clipboard.writeText(displayIp).then(() => {
      setCopied(true);
      onNotify(t('ipCopied'));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isIpv4 = profile.type === 'ipv4';

  return (
    <div
      className="relative flex flex-col justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] transition-all shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
      id={`card-${profile.id}`}
    >
      <div className="flex flex-col gap-3">
        {/* Top Header: Left has Title + Hardware Text, Right has ONLY the Ethernet/Wi-Fi badge (top IPv4/6 badge removed) */}
        <div className="flex items-start justify-between gap-3">
          {/* Left Column */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {/* Full Card Name: 2-line clamp to prevent overflow */}
            <h3
              className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 break-words"
              title={profile.name}
            >
              {profile.name}
            </h3>

            {/* Hardware Adapter Text (overflow/truncate smoothly, no icons) */}
            <p
              className="text-xs text-slate-500 dark:text-slate-400 truncate"
              title={profile.deviceDescription || profile.adapterName}
            >
              {profile.deviceDescription || profile.adapterName || t('allAdapters')}
            </p>
          </div>

          {/* Right Column: ONLY Ethernet #1 / Ethernet #2 / Wi-Fi badge */}
          <div className="shrink-0">
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              {profile.adapterTag || profile.adapterName}
            </span>
          </div>
        </div>

        {/* IP Info Box: Clicking on it copies if not DHCP, right side has v4/v6 badge (copy btn replaced) */}
        <div
          className={`flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-[6px] transition-colors ${
            isStatic
              ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              : ''
          }`}
          onClick={handleCopyIp}
          title={isStatic ? t('copyIpBtn') : undefined}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 truncate select-all">
              {displayIp}
            </span>
            {copied && (
              <span className="text-[10px] font-sans font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-[4px] shrink-0">
                {t('ipCopied')}
              </span>
            )}
          </div>

          {/* v4 / v6 badge placed right where the copy button used to be */}
          <span
            className={`shrink-0 ml-2 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-[4px] lowercase border ${
              isIpv4
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-900'
            }`}
          >
            {isIpv4 ? 'v4' : 'v6'}
          </span>
        </div>
      </div>

      {/* Card Actions: Apply (Text Button), Edit (Icon Button), Delete (Icon Button) */}
      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Apply or Rollback Button */}
        {canRollback ? (
          <button
            type="button"
            className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-[6px] bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onRollback?.(profile)}
            disabled={isRollingBack || disabled}
            id={`btn-rollback-${profile.id}`}
            title="Không có kết nối Internet. Nhấn để hoàn tác cấu hình."
          >
            <RotateCcw size={14} className={isRollingBack ? 'animate-spin' : ''} />
            {isRollingBack ? 'Đang hoàn tác...' : 'Rollback'}
          </button>
        ) : (
          <button
            type="button"
            className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-[6px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onApply(profile)}
            disabled={isApplying || disabled}
            id={`btn-apply-${profile.id}`}
          >
            {isApplying ? t('applyingBtn') : t('applyBtn')}
          </button>
        )}

        <div className="flex items-center gap-1.5">
          {/* Edit Icon Button */}
          <button
            type="button"
            className="w-9 h-9 inline-flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-[6px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onEdit(profile)}
            disabled={isApplying || disabled}
            title={t('editBtn')}
            id={`btn-edit-${profile.id}`}
            aria-label={t('editBtn')}
          >
            <Pencil size={15} />
          </button>

          {/* Delete Icon Button */}
          <button
            type="button"
            className="w-9 h-9 inline-flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-rose-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border border-slate-200 dark:border-slate-700 hover:border-rose-600 rounded-[6px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onDelete(profile)}
            disabled={isApplying || disabled}
            title={t('deleteBtn')}
            id={`btn-delete-${profile.id}`}
            aria-label={t('deleteBtn')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

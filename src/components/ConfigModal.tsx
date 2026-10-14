import React, { useState, useEffect } from 'react';
import { X, Network, Globe, Save } from 'lucide-react';
import type { NetworkProfile, NetworkAdapter, IPMode, IPType } from '../types/ipConfig';
import { useI18n } from '../i18n/useI18n';
import { CustomDropdown, type DropdownOption } from './CustomDropdown';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: NetworkProfile) => void;
  editingProfile: NetworkProfile | null;
  adapters: NetworkAdapter[];
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProfile,
  adapters,
}) => {
  const { t } = useI18n();

  // Active tab determines the profile IP type: 'ipv4' | 'ipv6' (UI is for 1 IP only)
  const [activeTab, setActiveTab] = useState<IPType>('ipv4');
  const [name, setName] = useState('');
  const [adapterName, setAdapterName] = useState('Ethernet');
  const [mode, setMode] = useState<IPMode>('static');

  // IPv4 State
  const [v4Ip, setV4Ip] = useState('');
  const [v4Subnet, setV4Subnet] = useState('255.255.255.0');
  const [v4Gateway, setV4Gateway] = useState('');
  const [v4DnsPreferred, setV4DnsPreferred] = useState('1.1.1.1');
  const [v4DnsAlternate, setV4DnsAlternate] = useState('1.0.0.1');

  // IPv6 State
  const [v6Ip, setV6Ip] = useState('');
  const [v6Prefix, setV6Prefix] = useState('64');
  const [v6Gateway, setV6Gateway] = useState('');
  const [v6DnsPreferred, setV6DnsPreferred] = useState('2606:4700:4700::1111');
  const [v6DnsAlternate, setV6DnsAlternate] = useState('2606:4700:4700::1001');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name);
      setAdapterName(editingProfile.adapterName || (adapters[0]?.name ?? 'Ethernet'));
      setActiveTab(editingProfile.type);
      setMode(editingProfile.mode);

      if (editingProfile.type === 'ipv4') {
        setV4Ip(editingProfile.ipAddress || '');
        setV4Subnet(editingProfile.subnetMask || '255.255.255.0');
        setV4Gateway(editingProfile.gateway || '');
        setV4DnsPreferred(editingProfile.dnsPreferred || '');
        setV4DnsAlternate(editingProfile.dnsAlternate || '');
      } else {
        setV6Ip(editingProfile.ipAddress || '');
        setV6Prefix(String(editingProfile.prefixLength || '64'));
        setV6Gateway(editingProfile.gateway || '');
        setV6DnsPreferred(editingProfile.dnsPreferred || '');
        setV6DnsAlternate(editingProfile.dnsAlternate || '');
      }
    } else {
      setName('');
      setAdapterName(adapters[0]?.name ?? 'Ethernet');
      setActiveTab('ipv4');
      setMode('static');
      setV4Ip('192.168.1.50');
      setV4Subnet('255.255.255.0');
      setV4Gateway('192.168.1.1');
      setV4DnsPreferred('1.1.1.1');
      setV4DnsAlternate('1.0.0.1');

      setV6Ip('');
      setV6Prefix('64');
      setV6Gateway('');
      setV6DnsPreferred('2606:4700:4700::1111');
      setV6DnsAlternate('2606:4700:4700::1001');
    }
    setError(null);
  }, [editingProfile, isOpen, adapters]);

  if (!isOpen) return null;

  const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const IPV6_REGEX = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){1,7}|:):((:[0-9a-fA-F]{1,4}){1,7}|:)$/;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên cấu hình (Profile name is required)');
      return;
    }

    if (activeTab === 'ipv4' && mode === 'static') {
      if (!v4Ip.trim()) {
        setError('Địa chỉ IPv4 không được để trống khi chọn chế độ Static');
        return;
      }
      if (!IPV4_REGEX.test(v4Ip.trim())) {
        setError('Địa chỉ IPv4 không đúng định dạng (Ví dụ: 192.168.1.50)');
        return;
      }
      if (v4Subnet.trim() && !IPV4_REGEX.test(v4Subnet.trim())) {
        setError('Subnet Mask không đúng định dạng (Ví dụ: 255.255.255.0)');
        return;
      }
      if (v4Gateway.trim() && !IPV4_REGEX.test(v4Gateway.trim())) {
        setError('Default Gateway IPv4 không đúng định dạng (Ví dụ: 192.168.1.1)');
        return;
      }
      if (v4DnsPreferred.trim() && !IPV4_REGEX.test(v4DnsPreferred.trim())) {
        setError('Preferred DNS IPv4 không đúng định dạng (Ví dụ: 1.1.1.1)');
        return;
      }
      if (v4DnsAlternate.trim() && !IPV4_REGEX.test(v4DnsAlternate.trim())) {
        setError('Alternate DNS IPv4 không đúng định dạng (Ví dụ: 1.0.0.1)');
        return;
      }
    }

    if (activeTab === 'ipv6' && mode === 'static') {
      if (!v6Ip.trim()) {
        setError('Địa chỉ IPv6 không được để trống khi chọn chế độ Static');
        return;
      }
      if (!IPV6_REGEX.test(v6Ip.trim())) {
        setError('Địa chỉ IPv6 không đúng định dạng (Ví dụ: 2001:db8::1)');
        return;
      }
      if (v6Gateway.trim() && !IPV6_REGEX.test(v6Gateway.trim())) {
        setError('Default Gateway IPv6 không đúng định dạng');
        return;
      }
      if (v6DnsPreferred.trim() && !IPV6_REGEX.test(v6DnsPreferred.trim())) {
        setError('Preferred DNS IPv6 không đúng định dạng');
        return;
      }
      if (v6DnsAlternate.trim() && !IPV6_REGEX.test(v6DnsAlternate.trim())) {
        setError('Alternate DNS IPv6 không đúng định dạng');
        return;
      }
    }

    // Lookup hardware friendly name and tag
    const selectedAdapter = adapters.find((a) => a.name === adapterName);

    const updatedProfile: NetworkProfile = {
      id: editingProfile ? editingProfile.id : `cfg-${Date.now()}`,
      name: name.trim(),
      adapterName,
      adapterTag: selectedAdapter?.tag || editingProfile?.adapterTag,
      deviceDescription: selectedAdapter?.friendlyName || editingProfile?.deviceDescription,
      type: activeTab,
      mode,
      ...(activeTab === 'ipv4'
        ? {
            ipAddress: mode === 'static' ? v4Ip.trim() : undefined,
            subnetMask: mode === 'static' ? v4Subnet.trim() || '255.255.255.0' : undefined,
            gateway: mode === 'static' ? v4Gateway.trim() : undefined,
            dnsPreferred: v4DnsPreferred.trim() || undefined,
            dnsAlternate: v4DnsAlternate.trim() || undefined,
          }
        : {
            ipAddress: mode === 'static' ? v6Ip.trim() : undefined,
            prefixLength: mode === 'static' ? v6Prefix.trim() || '64' : undefined,
            gateway: mode === 'static' ? v6Gateway.trim() : undefined,
            dnsPreferred: v6DnsPreferred.trim() || undefined,
            dnsAlternate: v6DnsAlternate.trim() || undefined,
          }),
    };

    onSave(updatedProfile);
    onClose();
  };

  const applyDnsPreset = (pref: string, alt: string) => {
    if (activeTab === 'ipv6') {
      setV6DnsPreferred(pref);
      setV6DnsAlternate(alt);
    } else {
      setV4DnsPreferred(pref);
      setV4DnsAlternate(alt);
    }
  };

  // Dropdown options showing hardware name on left, tag (Ethernet #1, #2, Wi-Fi) on right
  const adapterOptions: DropdownOption[] = adapters.map((ad) => ({
    value: ad.name,
    label: ad.friendlyName || ad.name,
    tag: ad.tag || ad.name,
    type: ad.type,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity overflow-hidden"
      onClick={onClose}
    >
      {/* Dialog container: Unified background for header, content and footer */}
      <div
        className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Consistent background */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {editingProfile ? t('editTitle') : t('createTitle')}
          </h2>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-[6px] cursor-pointer"
            onClick={onClose}
            aria-label="Close"
            id="btn-close-modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body - Scrollable content + Pinned footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-3.5 flex flex-col gap-3.5">
            {error && (
              <div className="p-2.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-[6px]">
                {error}
              </div>
            )}

            {/* 1. Tabs IPv4 / IPv6 MOVED TO THE TOP (above Name and Adapter) */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-[6px] border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ipv4'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('ipv4')}
              id="tab-btn-v4"
            >
              <Network size={14} />
              <span>{t('tabIpv4')}</span>
            </button>

            <button
              type="button"
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ipv6'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('ipv6')}
              id="tab-btn-v6"
            >
              <Globe size={14} />
              <span>{t('tabIpv6')}</span>
            </button>
          </div>

          {/* 2. Profile Name & Target Adapter (Hardware device name shown clearly) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-profile-name">
                {t('profileName')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-profile-name"
                type="text"
                className="h-9 px-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder={t('profileNamePlaceholder')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('selectAdapter')}
              </label>
              <CustomDropdown
                options={adapterOptions}
                value={adapterName}
                onChange={setAdapterName}
                id="dropdown-adapter"
              />
            </div>
          </div>

          <hr className="border-t border-slate-200/80 dark:border-slate-800 my-0.5" />

          {/* 3. Mode switch: DHCP vs Static */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`py-1.5 text-xs font-semibold rounded-[6px] border transition-all cursor-pointer ${
                mode === 'dhcp'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
              onClick={() => setMode('dhcp')}
              id="btn-mode-dhcp"
            >
              {t('dhcpMode')}
            </button>
            <button
              type="button"
              className={`py-1.5 text-xs font-semibold rounded-[6px] border transition-all cursor-pointer ${
                mode === 'static'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
              onClick={() => setMode('static')}
              id="btn-mode-static"
            >
              {t('staticMode')}
            </button>
          </div>

          {/* 4. Detail Fields for IPv4 */}
          {activeTab === 'ipv4' && mode === 'static' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v4-ip">
                    {t('ipAddress')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-v4-ip"
                    type="text"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="192.168.1.150"
                    value={v4Ip}
                    onChange={(e) => setV4Ip(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v4-subnet">
                    {t('subnetMask')}
                  </label>
                  <input
                    id="input-v4-subnet"
                    type="text"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="255.255.255.0"
                    value={v4Subnet}
                    onChange={(e) => setV4Subnet(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v4-gateway">
                  {t('defaultGateway')}
                </label>
                <input
                  id="input-v4-gateway"
                  type="text"
                  className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder={t('gatewayPlaceholder')}
                  value={v4Gateway}
                  onChange={(e) => setV4Gateway(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v4-dns-pref">
                    {t('preferredDns')}
                  </label>
                  <input
                    id="input-v4-dns-pref"
                    type="text"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder={t('dnsPlaceholder')}
                    value={v4DnsPreferred}
                    onChange={(e) => setV4DnsPreferred(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v4-dns-alt">
                    {t('alternateDns')}
                  </label>
                  <input
                    id="input-v4-dns-alt"
                    type="text"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder={t('dnsAltPlaceholder')}
                    value={v4DnsAlternate}
                    onChange={(e) => setV4DnsAlternate(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick DNS presets: Cloudflare & Google */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {t('quickDnsPresets')}:
                </span>
                <button
                  type="button"
                  className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[6px] border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer"
                  onClick={() => applyDnsPreset('1.1.1.1', '1.0.0.1')}
                >
                  Cloudflare (1.1.1.1)
                </button>
                <button
                  type="button"
                  className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[6px] border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer"
                  onClick={() => applyDnsPreset('8.8.8.8', '8.8.4.4')}
                >
                  Google (8.8.8.8)
                </button>
              </div>
            </div>
          )}

          {/* 5. Detail Fields for IPv6 */}
          {activeTab === 'ipv6' && mode === 'static' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v6-ip">
                    {t('ipAddress')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-v6-ip"
                    type="text"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="2001:db8:85a3::8a2e:370:7334"
                    value={v6Ip}
                    onChange={(e) => setV6Ip(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v6-prefix">
                    {t('prefixLength')}
                  </label>
                  <input
                    id="input-v6-prefix"
                    type="number"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="64"
                    value={v6Prefix}
                    onChange={(e) => setV6Prefix(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v6-gateway">
                  {t('defaultGateway')}
                </label>
                <input
                  id="input-v6-gateway"
                  type="text"
                  className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="fe80::1"
                  value={v6Gateway}
                  onChange={(e) => setV6Gateway(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v6-dns-pref">
                    {t('preferredDns')}
                  </label>
                  <input
                    id="input-v6-dns-pref"
                    type="text"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="2606:4700:4700::1111"
                    value={v6DnsPreferred}
                    onChange={(e) => setV6DnsPreferred(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-v6-dns-alt">
                    {t('alternateDns')}
                  </label>
                  <input
                    id="input-v6-dns-alt"
                    type="text"
                    className="h-9 px-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="2606:4700:4700::1001"
                    value={v6DnsAlternate}
                    onChange={(e) => setV6DnsAlternate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {t('quickDnsPresets')}:
                </span>
                <button
                  type="button"
                  className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[6px] border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer"
                  onClick={() => applyDnsPreset('2606:4700:4700::1111', '2606:4700:4700::1001')}
                >
                  Cloudflare v6
                </button>
                <button
                  type="button"
                  className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[6px] border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer"
                  onClick={() => applyDnsPreset('2001:4860:4860::8888', '2001:4860:4860::8844')}
                >
                  Google v6
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Footer - Pinned bottom bar */}
          <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              className="px-3.5 h-8.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-[6px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={onClose}
              id="btn-cancel-modal"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 h-8.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-[6px] transition-colors cursor-pointer shadow-xs"
              id="btn-save-modal"
            >
              <Save size={14} />
              <span>{t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

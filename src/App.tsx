import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { NetworkProfile, NetworkAdapter } from './types/ipConfig';
import { NetworkService } from './services/networkService';
import { I18nProvider, useI18n } from './i18n/useI18n';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { SearchBar, type FilterCategory } from './components/SearchBar';
import { ConfigCard } from './components/ConfigCard';
import { ConfigModal } from './components/ConfigModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EmptyState } from './components/EmptyState';
import { ToastContainer, type ToastMessage } from './components/Toast';

function AppContent() {
  const { t } = useI18n();

  const [profiles, setProfiles] = useState<NetworkProfile[]>(() => NetworkService.getProfiles());
  const [adapters, setAdapters] = useState<NetworkAdapter[]>(() => NetworkService.getCachedAdapters());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<NetworkProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<NetworkProfile | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [rollbackProfileId, setRollbackProfileId] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast feedback: only 1 toast at the same time
  const toastTimerRef = useRef<number | null>(null);

  const addToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    const id = `toast-${Date.now()}`;
    // Replace with only the newest toast (strictly only 1 toast at any time)
    setToasts([{ id, text, type }]);

    toastTimerRef.current = window.setTimeout(() => {
      setToasts([]);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  // Load profiles from Documents & adapters on mount, and listen to real-time kernel network events
  useEffect(() => {
    NetworkService.loadProfilesFromDisk().then((diskProfiles) => {
      if (diskProfiles && diskProfiles.length > 0) {
        setProfiles(diskProfiles);
      }
    });
    NetworkService.getAdapters().then(setAdapters);

    // Lắng nghe sự kiện thay đổi mạng thời gian thực từ Windows Kernel (cắm/rút dây LAN, bật/tắt Wi-Fi)
    let unlisten: (() => void) | undefined;
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen('network-status-changed', () => {
          NetworkService.getAdapters().then(setAdapters);
        }).then((fn) => {
          unlisten = fn;
        });
      });
    }

    return () => {
      unlisten?.();
    };
  }, []);

  // Persist profiles to localStorage and Documents folder
  useEffect(() => {
    NetworkService.saveProfiles(profiles);
  }, [profiles]);

  // Counts for exactly 3 filter buttons: all, ipv4, ipv6
  const counts = useMemo(() => {
    return {
      all: profiles.length,
      ipv4: profiles.filter((p) => p.type === 'ipv4').length,
      ipv6: profiles.filter((p) => p.type === 'ipv6').length,
    };
  }, [profiles]);

  // Filtered and searched profiles
  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return profiles.filter((p) => {
      // Category filter (all, ipv4, ipv6)
      if (activeFilter === 'ipv4' && p.type !== 'ipv4') return false;
      if (activeFilter === 'ipv6' && p.type !== 'ipv6') return false;

      // Text query match
      if (!q) return true;
      const matchName = p.name.toLowerCase().includes(q);
      const matchAdapter = p.adapterName.toLowerCase().includes(q);
      const matchIp = p.ipAddress?.toLowerCase().includes(q);
      const matchDns = p.dnsPreferred?.toLowerCase().includes(q);

      return matchName || matchAdapter || matchIp || matchDns;
    });
  }, [profiles, searchQuery, activeFilter]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
  };

  const handleEditProfile = (profile: NetworkProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleSaveProfile = (savedProfile: NetworkProfile) => {
    const exists = profiles.some((p) => p.id === savedProfile.id);
    if (exists) {
      setProfiles((prev) => prev.map((p) => (p.id === savedProfile.id ? savedProfile : p)));
      addToast(t('toastUpdated', { name: savedProfile.name }));
    } else {
      setProfiles((prev) => [savedProfile, ...prev]);
      addToast(t('toastCreated', { name: savedProfile.name }));
    }
  };

  const handleDeleteProfile = (profile: NetworkProfile) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    addToast(t('toastDeleted', { name: profile.name }));
  };

  const handleApplyProfile = async (profile: NetworkProfile) => {
    setApplyingId(profile.id);
    const result = await NetworkService.applyProfile(profile);
    setApplyingId(null);

    if (result.success) {
      if (!result.hasInternet) {
        setRollbackProfileId(profile.id);
        addToast('Không có kết nối Internet! Bạn có thể giữ cấu hình hoặc nhấn Rollback để hoàn tác.', 'error');
      } else {
        setRollbackProfileId(null);
        addToast(t('toastApplied', { name: profile.name, adapter: profile.adapterName }));
      }
    } else {
      addToast(result.message || t('toastApplyError'), 'error');
    }
  };

  const handleRollbackProfile = async (profile: NetworkProfile) => {
    setIsRollingBack(true);
    const result = await NetworkService.rollback(profile.adapterName);
    setIsRollingBack(false);

    if (result.success) {
      setRollbackProfileId(null);
      addToast(`Đã hoàn tác cấu hình card ${profile.adapterName} về trạng thái trước đó!`);
    } else {
      addToast(result.message || 'Lỗi khi hoàn tác cấu hình', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Header */}
        <Header onOpenCreateModal={handleOpenCreateModal} />

        {/* Search and 3 Filters (All, IPv4, IPv6) */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />

        {/* Content Grid or Empty State */}
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => (
              <ConfigCard
                key={profile.id}
                profile={profile}
                isApplying={applyingId === profile.id}
                disabled={(applyingId !== null && applyingId !== profile.id) || isRollingBack}
                canRollback={rollbackProfileId === profile.id}
                isRollingBack={isRollingBack}
                onApply={handleApplyProfile}
                onRollback={handleRollbackProfile}
                onEdit={handleEditProfile}
                onDelete={(p) => setDeletingProfile(p)}
                onNotify={(msg) => addToast(msg, 'success')}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAddClick={handleOpenCreateModal} />
        )}
      </main>

      {/* Add / Edit Profile Modal */}
      <ConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProfile}
        editingProfile={editingProfile}
        adapters={adapters}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingProfile)}
        profile={deletingProfile}
        onClose={() => setDeletingProfile(null)}
        onConfirm={handleDeleteProfile}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}

import type { NetworkProfile, NetworkAdapter } from '../types/ipConfig';

export interface ApplyResponse {
  success: boolean;
  hasInternet: boolean;
  canRollback: boolean;
  message?: string;
}

const STORAGE_PROFILES_KEY = 'change_ip_profiles';
const STORAGE_ADAPTERS_KEY = 'ip_switch_adapters_cache';

// Hàm gán tag (Ethernet #1, Ethernet #2, Wi-Fi) tự động khi có nhiều card cùng loại
export function assignAdapterTags(adapters: NetworkAdapter[]): NetworkAdapter[] {
  let ethCount = 0;
  let wifiCount = 0;

  adapters.forEach((ad) => {
    if (ad.type === 'wifi' || ad.name.toLowerCase().includes('wi-fi')) {
      wifiCount++;
    } else {
      ethCount++;
    }
  });

  let ethIdx = 0;
  let wifiIdx = 0;

  return adapters.map((ad) => {
    const isWifi = ad.type === 'wifi' || ad.name.toLowerCase().includes('wi-fi');
    let tag = '';
    if (isWifi) {
      wifiIdx++;
      tag = wifiCount > 1 ? `Wi-Fi #${wifiIdx}` : 'Wi-Fi';
    } else {
      ethIdx++;
      tag = ethCount > 1 ? `Ethernet #${ethIdx}` : 'Ethernet';
    }
    return { ...ad, tag };
  });
}

export class NetworkService {
  static getProfiles(): NetworkProfile[] {
    const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static async loadProfilesFromDisk(): Promise<NetworkProfile[]> {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const profiles = await invoke<NetworkProfile[]>('load_profiles');
        if (profiles && Array.isArray(profiles) && profiles.length > 0) {
          localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
          return profiles;
        }
      } catch (err) {
        console.warn('Tauri load_profiles error:', err);
      }
    }
    return NetworkService.getProfiles();
  }

  static saveProfiles(profiles: NetworkProfile[]): void {
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/core')
        .then(({ invoke }) => {
          invoke('save_profiles', { profiles }).catch((err) =>
            console.error('Lỗi lưu cấu hình vào thư mục Documents:', err)
          );
        })
        .catch(() => {});
    }
  }

  static getCachedAdapters(): NetworkAdapter[] {
    try {
      const raw = localStorage.getItem(STORAGE_ADAPTERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static async getAdapters(): Promise<NetworkAdapter[]> {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const rawAdapters = await invoke<NetworkAdapter[]>('get_network_adapters');
        if (rawAdapters && rawAdapters.length > 0) {
          const tagged = assignAdapterTags(rawAdapters);
          localStorage.setItem(STORAGE_ADAPTERS_KEY, JSON.stringify(tagged));
          return tagged;
        }
      } catch (err) {
        console.warn('Tauri get_network_adapters:', err);
      }
    }
    return NetworkService.getCachedAdapters();
  }

  static async applyProfile(profile: NetworkProfile): Promise<ApplyResponse> {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<ApplyResponse>('apply_network_config', { profile });
        return res;
      } catch (err: any) {
        console.error('Tauri apply error:', err);
        return { success: false, hasInternet: false, canRollback: false, message: err?.message || String(err) };
      }
    }

    return { success: true, hasInternet: true, canRollback: false };
  }

  static async rollback(adapterName: string): Promise<{ success: boolean; message?: string }> {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('rollback_network_config', { adapterName });
        return { success: true };
      } catch (err: any) {
        console.error('Tauri rollback error:', err);
        return { success: false, message: err?.message || String(err) };
      }
    }
    return { success: true };
  }
}

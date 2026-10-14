export type IPMode = 'dhcp' | 'static';
export type IPType = 'ipv4' | 'ipv6';

export interface NetworkProfile {
  id: string;
  name: string;
  adapterName: string;
  adapterTag?: string; // e.g. "Ethernet #1", "Ethernet #2", "Wi-Fi"
  deviceDescription?: string;
  type: IPType;
  mode: IPMode;

  // Static IPv4 details
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;

  // Static IPv6 details
  prefixLength?: string | number;

  // Common DNS fields
  dnsPreferred?: string;
  dnsAlternate?: string;

  description?: string;
}

export interface NetworkAdapter {
  id: string;
  name: string; // Windows interface name, e.g. "Ethernet", "Ethernet 2", "Wi-Fi"
  friendlyName: string; // Hardware name, e.g. "Killer E2600 Gigabit Ethernet Controller"
  tag?: string; // Formatted badge, e.g. "Ethernet #1", "Ethernet #2", "Wi-Fi"
  type: 'ethernet' | 'wifi' | 'virtual' | 'other';
  status: 'connected' | 'disconnected';
  macAddress?: string;
}

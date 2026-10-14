use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use std::sync::Mutex;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkAdapter {
    pub id: String,
    pub name: String,
    #[serde(rename = "friendlyName")]
    pub friendly_name: String,
    #[serde(rename = "type")]
    pub adapter_type: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tag: Option<String>,
    #[serde(rename = "macAddress", skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkProfile {
    pub id: String,
    pub name: String,
    #[serde(rename = "adapterName")]
    pub adapter_name: String,
    #[serde(rename = "adapterTag", default)]
    pub adapter_tag: Option<String>,
    #[serde(rename = "deviceDescription", default)]
    pub device_description: Option<String>,
    #[serde(rename = "type")]
    pub profile_type: String, // "ipv4" | "ipv6"
    pub mode: String, // "dhcp" | "static"
    #[serde(rename = "ipAddress", default)]
    pub ip_address: Option<String>,
    #[serde(rename = "subnetMask", default)]
    pub subnet_mask: Option<String>,
    #[serde(default)]
    pub gateway: Option<String>,
    #[serde(rename = "prefixLength", default)]
    pub prefix_length: Option<serde_json::Value>,
    #[serde(rename = "dnsPreferred", default)]
    pub dns_preferred: Option<String>,
    #[serde(rename = "dnsAlternate", default)]
    pub dns_alternate: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyResult {
    pub success: bool,
    #[serde(rename = "hasInternet")]
    pub has_internet: bool,
    #[serde(rename = "canRollback")]
    pub can_rollback: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdapterConfigSnapshot {
    pub adapter_name: String,
    pub mode: String, // "dhcp" | "static"
    pub ip_address: Option<String>,
    pub subnet_mask: Option<String>,
    pub gateway: Option<String>,
    pub dns_preferred: Option<String>,
    pub dns_alternate: Option<String>,
}

// Lưu trữ Snapshot hoàn tác trong bộ nhớ phiên làm việc (mất đi khi tắt app)
static ROLLBACK_SNAPSHOTS: Mutex<Option<HashMap<String, AdapterConfigSnapshot>>> = Mutex::new(None);

#[inline]
fn run_hidden_command(program: &str, args: &[&str]) -> std::io::Result<std::process::Output> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.output()
}

fn execute_netsh(args: &[&str]) -> Result<(), String> {
    let output = run_hidden_command("netsh", args)
        .map_err(|e| format!("Không thể khởi chạy netsh: {}", e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let msg = if !stderr.trim().is_empty() {
            stderr.trim()
        } else if !stdout.trim().is_empty() {
            stdout.trim()
        } else {
            "Lỗi thiết lập card mạng."
        };
        return Err(msg.to_string());
    }
    Ok(())
}

/// Trả về đường dẫn lưu profiles tại thư mục Documents/IP Switch/profiles.json
pub fn get_profiles_file_path() -> std::path::PathBuf {
    let doc_dir = dirs::document_dir().unwrap_or_else(|| {
        std::env::var_os("USERPROFILE")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("Documents")
    });
    doc_dir.join("IP Switch").join("profiles.json")
}

#[tauri::command]
pub fn load_profiles() -> Result<Vec<NetworkProfile>, String> {
    let file_path = get_profiles_file_path();
    if !file_path.exists() {
        return Ok(vec![]);
    }
    let data = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Không thể đọc file cấu hình: {}", e))?;
    let profiles: Vec<NetworkProfile> = serde_json::from_str(&data)
        .map_err(|e| format!("Dữ liệu cấu hình không đúng định dạng: {}", e))?;
    Ok(profiles)
}

#[tauri::command]
pub fn save_profiles(profiles: Vec<NetworkProfile>) -> Result<(), String> {
    let file_path = get_profiles_file_path();
    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Không thể tạo thư mục lưu trữ trong Documents: {}", e))?;
    }
    let json = serde_json::to_string_pretty(&profiles)
        .map_err(|e| format!("Lỗi tuần tự hóa cấu hình: {}", e))?;
    std::fs::write(&file_path, json)
        .map_err(|e| format!("Không thể ghi file cấu hình vào Documents: {}", e))?;
    Ok(())
}

/// Kiểm tra kết nối Internet thực tế bằng TCP probe tới DNS servers (1.1.1.1, 8.8.8.8)
#[tauri::command]
pub fn check_internet_connection() -> bool {
    use std::net::{SocketAddr, TcpStream};
    use std::time::Duration;
    let targets = [
        "1.1.1.1:53".parse::<SocketAddr>().unwrap(),
        "8.8.8.8:53".parse::<SocketAddr>().unwrap(),
    ];
    for target in &targets {
        if TcpStream::connect_timeout(target, Duration::from_millis(1500)).is_ok() {
            return true;
        }
    }
    false
}

/// Chụp nhanh hiện trạng card mạng trước khi thay đổi để phục vụ Rollback
fn capture_adapter_snapshot(adapter: &str) -> AdapterConfigSnapshot {
    let name_arg = format!("name=\"{}\"", adapter);
    if let Ok(out) = run_hidden_command("netsh", &["interface", "ipv4", "show", "config", &name_arg]) {
        let text = String::from_utf8_lossy(&out.stdout);
        let is_dhcp = text.to_lowercase().contains("dhcp enabled:") && text.to_lowercase().contains("yes");

        let mut ip_address = None;
        let mut subnet_mask = None;
        let mut gateway = None;
        let mut dns_servers = Vec::new();

        for line in text.lines() {
            let line_trimmed = line.trim();
            let line_lower = line_trimmed.to_lowercase();
            if line_lower.starts_with("ip address:") {
                let parts: Vec<&str> = line_trimmed.split(':').collect();
                if parts.len() > 1 {
                    ip_address = Some(parts[1].trim().to_string());
                }
            } else if line_lower.starts_with("subnet prefix:") {
                if let Some(mask_idx) = line_trimmed.find("mask ") {
                    let mask_part = &line_trimmed[mask_idx + 5..];
                    let mask_clean = mask_part.trim_matches(|c| c == ')' || c == ' ');
                    subnet_mask = Some(mask_clean.to_string());
                }
            } else if line_lower.starts_with("default gateway:") {
                let parts: Vec<&str> = line_trimmed.split(':').collect();
                if parts.len() > 1 {
                    let gw = parts[1].trim();
                    if !gw.is_empty() && gw.to_lowercase() != "none" {
                        gateway = Some(gw.to_string());
                    }
                }
            } else if line_lower.starts_with("statically configured dns servers:") {
                let parts: Vec<&str> = line_trimmed.split(':').collect();
                if parts.len() > 1 {
                    let d = parts[1].trim();
                    if !d.is_empty() && d.to_lowercase() != "none" {
                        dns_servers.push(d.to_string());
                    }
                }
            }
        }

        AdapterConfigSnapshot {
            adapter_name: adapter.to_string(),
            mode: if is_dhcp { "dhcp".to_string() } else { "static".to_string() },
            ip_address,
            subnet_mask,
            gateway,
            dns_preferred: dns_servers.first().cloned(),
            dns_alternate: dns_servers.get(1).cloned(),
        }
    } else {
        AdapterConfigSnapshot {
            adapter_name: adapter.to_string(),
            mode: "dhcp".to_string(),
            ip_address: None,
            subnet_mask: None,
            gateway: None,
            dns_preferred: None,
            dns_alternate: None,
        }
    }
}

/// Win32 API thuần (GetAdaptersAddresses từ iphlpapi.dll) thay thế hoàn toàn PowerShell CLI
#[cfg(target_os = "windows")]
fn get_adapters_native() -> Result<Vec<NetworkAdapter>, String> {
    use windows_sys::Win32::Foundation::{ERROR_BUFFER_OVERFLOW, NO_ERROR};
    use windows_sys::Win32::NetworkManagement::IpHelper::{
        GetAdaptersAddresses, GAA_FLAG_SKIP_ANYCAST, GAA_FLAG_SKIP_DNS_SERVER, GAA_FLAG_SKIP_MULTICAST,
        IF_TYPE_ETHERNET_CSMACD, IF_TYPE_IEEE80211, IP_ADAPTER_ADDRESSES_LH,
    };
    use windows_sys::Win32::Networking::WinSock::AF_UNSPEC;

    let mut buf_len: u32 = 16384;
    let mut buffer: Vec<u8> = vec![0u8; buf_len as usize];
    let flags = GAA_FLAG_SKIP_ANYCAST | GAA_FLAG_SKIP_MULTICAST | GAA_FLAG_SKIP_DNS_SERVER;

    let mut ret = unsafe {
        GetAdaptersAddresses(
            AF_UNSPEC as u32,
            flags,
            std::ptr::null_mut(),
            buffer.as_mut_ptr() as *mut IP_ADAPTER_ADDRESSES_LH,
            &mut buf_len,
        )
    };

    if ret == ERROR_BUFFER_OVERFLOW {
        buffer.resize(buf_len as usize, 0);
        ret = unsafe {
            GetAdaptersAddresses(
                AF_UNSPEC as u32,
                flags,
                std::ptr::null_mut(),
                buffer.as_mut_ptr() as *mut IP_ADAPTER_ADDRESSES_LH,
                &mut buf_len,
            )
        };
    }

    if ret != NO_ERROR {
        return Err(format!("GetAdaptersAddresses thất bại với mã lỗi: {}", ret));
    }

    let mut raw_adapters = Vec::new();
    let mut curr_ptr = buffer.as_ptr() as *const IP_ADAPTER_ADDRESSES_LH;

    while !curr_ptr.is_null() {
        let adapter = unsafe { &*curr_ptr };
        let if_type = adapter.IfType;
        let is_ethernet = if_type == IF_TYPE_ETHERNET_CSMACD;
        let is_wifi = if_type == IF_TYPE_IEEE80211;

        if is_ethernet || is_wifi {
            let friendly_name = if !adapter.FriendlyName.is_null() {
                let mut len = 0;
                while unsafe { *adapter.FriendlyName.add(len) } != 0 {
                    len += 1;
                }
                let slice = unsafe { std::slice::from_raw_parts(adapter.FriendlyName, len) };
                String::from_utf16_lossy(slice)
            } else {
                "Ethernet".to_string()
            };

            let description = if !adapter.Description.is_null() {
                let mut len = 0;
                while unsafe { *adapter.Description.add(len) } != 0 {
                    len += 1;
                }
                let slice = unsafe { std::slice::from_raw_parts(adapter.Description, len) };
                String::from_utf16_lossy(slice)
            } else {
                friendly_name.clone()
            };

            let desc_lower = description.to_lowercase();
            let name_lower = friendly_name.to_lowercase();
            let is_virtual = desc_lower.contains("vmware")
                || desc_lower.contains("virtual")
                || desc_lower.contains("vpn")
                || desc_lower.contains("tap-")
                || desc_lower.contains("hyper-v")
                || desc_lower.contains("loopback")
                || desc_lower.contains("pseudo")
                || desc_lower.contains("wsl")
                || desc_lower.contains("ndis")
                || desc_lower.contains("bluetooth")
                || desc_lower.contains("fortinet")
                || desc_lower.contains("cisco")
                || name_lower.contains("vethernet")
                || name_lower.contains("local area connection*");

            if !is_virtual {
                let mac = if adapter.PhysicalAddressLength > 0 {
                    let len = (adapter.PhysicalAddressLength as usize).min(8);
                    let bytes = &adapter.PhysicalAddress[..len];
                    Some(bytes.iter().map(|b| format!("{:02X}", b)).collect::<Vec<_>>().join("-"))
                } else {
                    None
                };

                let status = if adapter.OperStatus == 1 {
                    "connected".to_string()
                } else {
                    "disconnected".to_string()
                };

                raw_adapters.push(NetworkAdapter {
                    id: format!("adapter-{}", raw_adapters.len() + 1),
                    name: friendly_name,
                    friendly_name: description,
                    adapter_type: if is_wifi { "wifi".to_string() } else { "ethernet".to_string() },
                    status,
                    tag: None,
                    mac_address: mac,
                });
            }
        }

        curr_ptr = adapter.Next;
    }

    if !raw_adapters.is_empty() {
        let mut eth_count = 0;
        let mut wifi_count = 0;
        for ad in &raw_adapters {
            if ad.adapter_type == "wifi" {
                wifi_count += 1;
            } else {
                eth_count += 1;
            }
        }

        let mut eth_idx = 0;
        let mut wifi_idx = 0;
        for ad in &mut raw_adapters {
            if ad.adapter_type == "wifi" {
                wifi_idx += 1;
                ad.tag = Some(if wifi_count > 1 { format!("Wi-Fi #{}", wifi_idx) } else { "Wi-Fi".to_string() });
            } else {
                eth_idx += 1;
                ad.tag = Some(if eth_count > 1 { format!("Ethernet #{}", eth_idx) } else { "Ethernet".to_string() });
            }
        }
    }

    Ok(raw_adapters)
}

#[tauri::command]
pub async fn get_network_adapters() -> Result<Vec<NetworkAdapter>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        #[cfg(target_os = "windows")]
        {
            get_adapters_native()
        }
        #[cfg(not(target_os = "windows"))]
        {
            Ok(vec![])
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

fn apply_network_config_sync(profile: &NetworkProfile) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let adapter = &profile.adapter_name;

        if profile.profile_type == "ipv4" {
            let name_arg = format!("name=\"{}\"", adapter);
            if profile.mode == "dhcp" {
                execute_netsh(&["interface", "ipv4", "set", "address", &name_arg, "source=dhcp"])?;
                execute_netsh(&["interface", "ipv4", "set", "dnsservers", &name_arg, "source=dhcp"])?;
            } else if profile.mode == "static" {
                if let Some(ip) = &profile.ip_address {
                    let mask = profile.subnet_mask.as_deref().unwrap_or("255.255.255.0");
                    let mut args = vec![
                        "interface",
                        "ipv4",
                        "set",
                        "address",
                        &name_arg,
                        "static",
                        ip.as_str(),
                        mask,
                    ];
                    if let Some(gw) = &profile.gateway {
                        if !gw.is_empty() {
                            args.push(gw.as_str());
                        }
                    }

                    execute_netsh(&args)?;

                    if let Some(dns1) = &profile.dns_preferred {
                        if !dns1.is_empty() {
                            execute_netsh(&[
                                "interface", "ipv4", "set", "dnsservers",
                                &name_arg, "static", dns1, "primary"
                            ])?;
                        }
                    }

                    if let Some(dns2) = &profile.dns_alternate {
                        if !dns2.is_empty() {
                            execute_netsh(&[
                                "interface", "ipv4", "add", "dnsservers",
                                &name_arg, dns2, "index=2"
                            ])?;
                        }
                    }
                }
            }
        } else if profile.profile_type == "ipv6" {
            let iface_arg = format!("interface=\"{}\"", adapter);
            if profile.mode == "dhcp" {
                execute_netsh(&["interface", "ipv6", "set", "dnsservers", &iface_arg, "source=dhcp"])?;
            } else if profile.mode == "static" {
                if let Some(ip6) = &profile.ip_address {
                    let prefix_val = match &profile.prefix_length {
                        Some(serde_json::Value::String(s)) => s.clone(),
                        Some(serde_json::Value::Number(n)) => n.to_string(),
                        _ => "64".to_string(),
                    };
                    let addr_with_prefix = format!("{}/{}", ip6, prefix_val);

                    execute_netsh(&["interface", "ipv6", "set", "address", &iface_arg, &addr_with_prefix])?;

                    if let Some(gw6) = &profile.gateway {
                        if !gw6.is_empty() {
                            let nexthop_arg = format!("nexthop={}", gw6);
                            let _ = run_hidden_command("netsh", &["interface", "ipv6", "add", "route", "::/0", &iface_arg, &nexthop_arg]);
                        }
                    }

                    if let Some(dns1) = &profile.dns_preferred {
                        if !dns1.is_empty() {
                            execute_netsh(&[
                                "interface", "ipv6", "set", "dnsservers",
                                &iface_arg, "static", dns1, "primary"
                            ])?;
                        }
                    }

                    if let Some(dns2) = &profile.dns_alternate {
                        if !dns2.is_empty() {
                            execute_netsh(&[
                                "interface", "ipv6", "add", "dnsservers",
                                &iface_arg, dns2, "index=2"
                            ])?;
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn apply_network_config(profile: NetworkProfile) -> Result<ApplyResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        // 1. Chụp lại snapshot cấu hình hiện tại trước khi thay đổi (lưu trong RAM của phiên chạy)
        let snapshot = capture_adapter_snapshot(&profile.adapter_name);
        {
            let mut lock = ROLLBACK_SNAPSHOTS.lock().unwrap();
            let map = lock.get_or_insert_with(HashMap::new);
            map.insert(profile.adapter_name.clone(), snapshot);
        }

        // 2. Thực hiện thiết lập cấu hình mới
        apply_network_config_sync(&profile)?;

        // 3. Kiểm tra khả năng kết nối Internet ngay sau khi áp dụng
        let has_internet = check_internet_connection();

        Ok(ApplyResult {
            success: true,
            has_internet,
            can_rollback: true,
            message: None,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Hoàn tác về cấu hình mạng trước đó từ bộ nhớ RAM phiên làm việc
#[tauri::command]
pub async fn rollback_network_config(adapter_name: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let snapshot = {
            let mut lock = ROLLBACK_SNAPSHOTS.lock().unwrap();
            lock.as_mut().and_then(|map| map.remove(&adapter_name))
        };

        if let Some(snap) = snapshot {
            let name_arg = format!("name=\"{}\"", adapter_name);
            if snap.mode == "dhcp" {
                execute_netsh(&["interface", "ipv4", "set", "address", &name_arg, "source=dhcp"])?;
                execute_netsh(&["interface", "ipv4", "set", "dnsservers", &name_arg, "source=dhcp"])?;
            } else if let Some(ip) = snap.ip_address {
                let mask = snap.subnet_mask.unwrap_or_else(|| "255.255.255.0".to_string());
                let mut args = vec![
                    "interface", "ipv4", "set", "address",
                    &name_arg, "static", &ip, &mask,
                ];
                if let Some(gw) = &snap.gateway {
                    if !gw.is_empty() {
                        args.push(gw);
                    }
                }
                execute_netsh(&args)?;

                if let Some(dns1) = &snap.dns_preferred {
                    if !dns1.is_empty() {
                        execute_netsh(&["interface", "ipv4", "set", "dnsservers", &name_arg, "static", dns1, "primary"])?;
                    }
                }
                if let Some(dns2) = &snap.dns_alternate {
                    if !dns2.is_empty() {
                        execute_netsh(&["interface", "ipv4", "add", "dnsservers", &name_arg, dns2, "index=2"])?;
                    }
                }
            }
            Ok(())
        } else {
            Err("Không tìm thấy cấu hình snapshot trong phiên hiện tại để hoàn tác.".to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

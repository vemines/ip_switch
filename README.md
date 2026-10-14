# IP Switch

> A blazing-fast, lightweight Windows network configuration switcher and profile manager built with **Tauri v2**, **Rust**, **React 19**.

---

## Overview

**IP Switch** is designed for network administrators, developers, and power users who frequently switch between different network environments. 

Unlike traditional network switcher utilities that rely on PowerShell scripts or batch files, IP Switch communicates directly with Windows networking subsystems via native **Win32 C-APIs (`iphlpapi.dll`)** in Rust. The result is instant profile switching, zero process spawn overhead, and a tiny memory footprint.

---

## Key Features

- **⚡ Native Win32 C-API Performance**  
  Direct integration with `iphlpapi.dll` using `GetAdaptersAddresses` via `windows-sys`. Zero PowerShell CLI invocation, eliminating startup latency and security policy friction.

- **🔄 Real-Time Network State Monitoring**  
  Listens for Windows kernel network events via `NotifyAddrChange` in a background thread, pushing real-time adapter state changes directly to the UI.

- **🛡️ Fail-Safe Rollback Engine**  
  Applies configurations with an active connectivity health check (socket probe to public DNS servers). If no internet connection is detected after applying a profile, an instant **Rollback** button appears, allowing you to revert to the previous adapter configuration with a single click.

- **🌐 Dual Stack: Full IPv4 & IPv6 Support**  
  Seamlessly switch between **DHCP (Auto)** and **Static (Manual)** for both IPv4 and IPv6:
  - IPv4: IP Address, Subnet Mask, Default Gateway, Preferred & Alternate DNS.
  - IPv6: IPv6 Address, Prefix Length, Default Gateway, Preferred & Alternate DNS.

- **⚡ 1-Click Quick DNS Presets**  
  Quickly set trusted DNS servers with one click:
  - **Cloudflare**: `1.1.1.1` / `1.0.0.1` (IPv4) & `2606:4700:4700::1111` / `2606:4700:4700::1001` (IPv6).
  - **Google**: `8.8.8.8` / `8.8.4.4` (IPv4) & `2001:4860:4860::8888` / `2001:4860:4860::8844` (IPv6).

- **📂 Safe Documents Storage**  
  User profiles are stored in standard JSON format at:  
  `%USERPROFILE%\Documents\IP Switch\profiles.json`  
  Your profiles persist across application updates and are easily backup-friendly.

- **📦 Standalone Portable Executable**  
  Compiles into a single, compact `IP Switch.exe` (~2.8 MB) with zero installation required.


- **🎨 Modern Fluent Interface**  
  - Dark Mode and Light Mode support with smooth CSS transitions.
  - Bilingual UI: Instant switching between **English** and **Vietnamese**.
  - Adaptive responsive grid (minimum 2 cards per row) with scrollable dialogs and pinned action bars.
  - Production-hardened with context-menu and DevTools shortcuts locked for an app-like feel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [TailwindCSS v4](https://tailwindcss.com/) + Custom Design Tokens |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/) + [Oxlint](https://oxc.rs/) |
| **Desktop Core** | [Tauri v2](https://v2.tauri.app/) (Rust 2021) |
| **Windows APIs** | `windows-sys` v0.59 (`Win32_NetworkManagement_IpHelper`, `Win32_Networking_WinSock`, `Win32_Foundation`) |
| **State & Persistence** | Rust `dirs` crate + Thread-safe async mutexes |

---

## Project Structure

```text
change_ip/
├── src/                          # Frontend source code (React 19 + TypeScript)
│   ├── assets/                   # Static UI assets and icons
│   ├── components/               # React UI components
│   │   ├── ConfigCard.tsx        # Profile display card with Apply & Rollback actions
│   │   ├── ConfigModal.tsx       # Create / Edit modal with pinned footer & scroll body
│   │   ├── CustomDropdown.tsx    # Styled adapter selector dropdown
│   │   ├── DeleteConfirmModal.tsx# Profile deletion confirmation dialog
│   │   ├── EmptyState.tsx        # Clean onboarding empty state
│   │   ├── Header.tsx            # Header bar with theme & language controls
│   │   ├── SearchBar.tsx         # Search bar and IPv4 / IPv6 category filters
│   │   └── Toast.tsx             # Interactive toast notifications
│   ├── context/                  # Dark / Light theme context provider
│   ├── i18n/                     # Bilingual translation dictionaries (en, vi)
│   ├── services/                 # Tauri IPC command wrappers
│   └── types/                    # TypeScript interfaces for network profiles
│
├── src-tauri/                    # Native Rust backend (Tauri v2)
│   ├── src/
│   │   ├── commands.rs           # Native Win32 adapter queries, IP apply, and profile I/O
│   │   ├── lib.rs                # Tauri initialization and kernel NotifyAddrChange hook
│   │   └── main.rs               # Windows entry point
│   ├── Cargo.toml                # Rust dependencies & optimization profiles
│   └── tauri.conf.json           # Tauri configuration, window dimensions & permissions
│
├── package.json                  # NPM scripts and frontend dependencies
└── README.md                     # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your Windows machine:
1. **[Node.js](https://nodejs.org/)** (v18.0 or newer)
2. **[Rust](https://www.rust-lang.org/tools/install)** with `x86_64-pc-windows-msvc` toolchain
3. **C++ Build Tools for Visual Studio** (included with VS Community or Build Tools for Visual Studio)

### Installation

Clone the repository and install frontend dependencies:

```bash
git clone <repo-url>
cd change_ip
npm install
```

### Running in Development

To run the frontend and native Tauri desktop window simultaneously with hot reload:

```bash
npm run tauri dev
```

### Building the Standalone Executable

To compile a single portable `.exe` (without an installer):

```bash
npm run build:exe
```

The output standalone binary will be generated at:
```text
src-tauri/target/release/IP Switch.exe
```

---

## Configuration File Location

All user-saved IP configuration profiles are stored in:
```text
%USERPROFILE%\Documents\IP Switch\profiles.json
```
Example JSON schema:
```json
[
  {
    "id": "1728912345678",
    "name": "Office Static IP",
    "adapterName": "Ethernet",
    "type": "ipv4",
    "isDhcp": false,
    "ipAddress": "192.168.1.150",
    "subnetMask": "255.255.255.0",
    "gateway": "192.168.1.1",
    "dnsPreferred": "1.1.1.1",
    "dnsAlternate": "1.0.0.1",
    "updatedAt": "2026-10-14T15:30:00.000Z"
  }
]
```

---

## Security & System Privileges

- **UAC Elevation**: Modifying IP addresses, default gateways, and DNS settings on Windows requires administrative privileges. The application binary includes an embedded UAC execution level manifest (`requireAdministrator`) so Windows prompts for standard elevation upon launching.

---

## License

This project is licensed under the [MIT License](LICENSE).

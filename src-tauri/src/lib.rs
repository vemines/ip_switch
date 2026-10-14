mod commands;

use commands::{
    apply_network_config, check_internet_connection, get_network_adapters, load_profiles,
    rollback_network_config, save_profiles,
};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    use windows_sys::Win32::NetworkManagement::IpHelper::NotifyAddrChange;
                    loop {
                        let mut handle = std::ptr::null_mut();
                        let ret = unsafe { NotifyAddrChange(&mut handle, std::ptr::null_mut()) };
                        if ret == 0 {
                            let _ = app_handle.emit("network-status-changed", ());
                        }
                        std::thread::sleep(std::time::Duration::from_millis(600));
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_network_adapters,
            apply_network_config,
            rollback_network_config,
            check_internet_connection,
            load_profiles,
            save_profiles
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

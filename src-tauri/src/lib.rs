use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeInfo {
    desktop: bool,
    distribution: &'static str,
    version: &'static str,
    executable_directory: Option<String>,
    portable_data_directory: Option<String>,
}

#[tauri::command]
fn runtime_info() -> RuntimeInfo {
    let executable_directory = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|parent| parent.to_path_buf()))
        .map(|path| path.to_string_lossy().into_owned());

    let portable_data_directory = if cfg!(feature = "portable") {
        executable_directory
            .as_ref()
            .map(|directory| format!("{}\\PrintGuardianData", directory.trim_end_matches(|character| character == '\\' || character == '/')))
    } else {
        None
    };

    RuntimeInfo {
        desktop: true,
        distribution: if cfg!(feature = "portable") {
            "portable"
        } else {
            "installed"
        },
        version: env!("CARGO_PKG_VERSION"),
        executable_directory,
        portable_data_directory,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![runtime_info])
        .run(tauri::generate_context!())
        .expect("error while running PrintGuardian");
}

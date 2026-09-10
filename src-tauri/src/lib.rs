use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{Manager, State, WebviewUrl, WebviewWindowBuilder};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeInfo {
    desktop: bool,
    distribution: &'static str,
    version: &'static str,
    executable_directory: Option<String>,
    data_directory: Option<String>,
    portable_data_directory: Option<String>,
    storage_scope: &'static str,
}

struct RuntimeState(RuntimeInfo);

#[tauri::command]
fn runtime_info(state: State<'_, RuntimeState>) -> RuntimeInfo {
    state.0.clone()
}

fn executable_directory() -> Option<PathBuf> {
    std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf))
}

#[cfg(target_os = "windows")]
fn hide_portable_data_root(path: &Path) {
    let _ = std::process::Command::new("attrib.exe")
        .arg("+H")
        .arg(path)
        .status();
}

#[cfg(not(target_os = "windows"))]
fn hide_portable_data_root(_path: &Path) {}

fn prepare_storage<R: tauri::Runtime>(app: &tauri::App<R>) -> Result<(PathBuf, Option<PathBuf>, &'static str), Box<dyn std::error::Error>> {
    if cfg!(feature = "portable") {
        if let Some(exe_dir) = executable_directory() {
            let portable_root = exe_dir.join("PrintGuardianData");
            let webview_data = portable_root.join("WebView2");
            if std::fs::create_dir_all(&webview_data).is_ok() {
                hide_portable_data_root(&portable_root);
                return Ok((webview_data, Some(portable_root), "portable"));
            }
        }

        let fallback = app.path().app_local_data_dir()?.join("portable-fallback");
        std::fs::create_dir_all(&fallback)?;
        return Ok((fallback, None, "portable-fallback"));
    }

    let installed = app.path().app_local_data_dir()?;
    std::fs::create_dir_all(&installed)?;
    Ok((installed, None, "installed"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let executable_directory = executable_directory();
            let (data_directory, portable_data_directory, storage_scope) = prepare_storage(app)?;

            let info = RuntimeInfo {
                desktop: true,
                distribution: if cfg!(feature = "portable") {
                    "portable"
                } else {
                    "installed"
                },
                version: env!("CARGO_PKG_VERSION"),
                executable_directory: executable_directory
                    .as_ref()
                    .map(|path| path.to_string_lossy().into_owned()),
                data_directory: Some(data_directory.to_string_lossy().into_owned()),
                portable_data_directory: portable_data_directory
                    .as_ref()
                    .map(|path| path.to_string_lossy().into_owned()),
                storage_scope,
            };
            app.manage(RuntimeState(info));

            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("PrintGuardian")
                .inner_size(1440.0, 900.0)
                .min_inner_size(1024.0, 700.0)
                .resizable(true)
                .fullscreen(false)
                .center()
                .data_directory(data_directory)
                .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![runtime_info])
        .run(tauri::generate_context!())
        .expect("error while running PrintGuardian");
}

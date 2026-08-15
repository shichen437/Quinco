use std::fs;
use std::path::{Path, PathBuf};

use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

fn resolve_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resolve("data", BaseDirectory::AppData)
        .map_err(|e| e.to_string())
}

fn dir_size(path: &Path) -> Result<u64, String> {
    let mut total = 0u64;
    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        if file_type.is_dir() {
            total += dir_size(&entry.path())?;
        } else if file_type.is_file() {
            total += entry.metadata().map_err(|e| e.to_string())?.len();
        }
    }
    Ok(total)
}

fn format_size(bytes: u64) -> String {
    let mut value = (bytes as f64) / (1024.0 * 1024.0);
    if value < 0.01 {
        value = 0.01;
    }

    let mut unit = "M";
    if value >= 1024.0 * 1024.0 {
        value /= 1024.0 * 1024.0;
        unit = "T";
    } else if value >= 1024.0 {
        value /= 1024.0;
        unit = "G";
    }

    format!("{:.2}{}", value, unit)
}

#[tauri::command]
pub fn data_dir(app: AppHandle) -> Result<String, String> {
    let dir = resolve_data_dir(&app)?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn storage_used(app: AppHandle) -> Result<String, String> {
    let dir = resolve_data_dir(&app)?;
    let bytes = if dir.exists() { dir_size(&dir)? } else { 0 };
    Ok(format_size(bytes))
}

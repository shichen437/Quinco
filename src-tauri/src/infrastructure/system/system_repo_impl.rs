use std::path::Path;

use async_trait::async_trait;
use tauri::{AppHandle, Manager};

use crate::domain::system::entity::{DiskUsage, SystemInfo};
use crate::domain::system::repo::SystemRepository;
use crate::shared::error::DomainError;

pub struct SystemRepoImpl {
    app_data_path: String,
}

impl SystemRepoImpl {
    pub fn from_app_handle(app: &AppHandle) -> Result<Self, DomainError> {
        let app_data_dir = app.path().app_data_dir().map_err(|e| {
            DomainError::infra(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Failed to resolve app data directory: {}", e),
            ))
        })?;

        Ok(Self {
            app_data_path: app_data_dir.to_string_lossy().to_string(),
        })
    }

    fn calculate_dir_size(path: &Path) -> Result<u64, DomainError> {
        let mut total_size: u64 = 0;

        if path.is_dir() {
            match std::fs::read_dir(path) {
                Ok(entries) => {
                    for entry in entries.flatten() {
                        let entry_path = entry.path();
                        match entry.file_type() {
                            Ok(file_type) => {
                                if file_type.is_file() {
                                    if let Ok(metadata) = std::fs::metadata(&entry_path) {
                                        total_size += metadata.len();
                                    }
                                } else if file_type.is_dir() {
                                    total_size += Self::calculate_dir_size(&entry_path)?;
                                }
                            }
                            Err(_) => continue,
                        }
                    }
                }
                Err(e) => {
                    return Err(DomainError::infra(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        format!("Failed to read directory '{}': {}", path.display(), e),
                    )));
                }
            }
        }

        Ok(total_size)
    }

    fn format_size(bytes: u64) -> String {
        const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
        if bytes == 0 {
            return "0 B".to_string();
        }
        let bytes_f = bytes as f64;
        let exp = (bytes_f.log2() / 1024f64.log2()).min(UNITS.len() as f64 - 1.0) as usize;
        let size = bytes_f / 1024f64.powi(exp as i32);
        if exp == 0 {
            format!("{} {}", bytes, UNITS[0])
        } else {
            format!("{:.1} {}", size, UNITS[exp])
        }
    }
}

#[async_trait]
impl SystemRepository for SystemRepoImpl {
    async fn get_disk_usage(&self) -> Result<SystemInfo, DomainError> {
        let used_bytes = Self::calculate_dir_size(Path::new(&self.app_data_path))?;
        let used_human = Self::format_size(used_bytes);

        Ok(SystemInfo {
            app_data_path: self.app_data_path.clone(),
            disk_usage: DiskUsage {
                path: self.app_data_path.clone(),
                used_bytes,
                used_human,
            },
        })
    }
}

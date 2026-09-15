use serde::{Deserialize, Serialize};

use crate::domain::system::entity::{AppConfig, SystemInfo};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskUsageDto {
    pub path: String,
    pub used_bytes: u64,
    pub used_human: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfoDto {
    pub app_data_path: String,
    pub disk_usage: DiskUsageDto,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigDto {
    pub theme: String,
    pub lang: String,
    pub last_tab: String,
    pub ai_enabled: bool,
    pub open_tabs: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigUpdateDto {
    pub theme: Option<String>,
    pub lang: Option<String>,
    pub last_tab: Option<String>,
    pub ai_enabled: Option<bool>,
    pub open_tabs: Option<String>,
}

impl From<AppConfig> for ConfigDto {
    fn from(c: AppConfig) -> Self {
        Self {
            theme: c.theme,
            lang: c.lang,
            last_tab: c.last_tab,
            ai_enabled: c.ai_enabled,
            open_tabs: c.open_tabs,
        }
    }
}

impl From<SystemInfo> for SystemInfoDto {
    fn from(s: SystemInfo) -> Self {
        Self {
            app_data_path: s.app_data_path,
            disk_usage: DiskUsageDto {
                path: s.disk_usage.path,
                used_bytes: s.disk_usage.used_bytes,
                used_human: s.disk_usage.used_human,
            },
        }
    }
}

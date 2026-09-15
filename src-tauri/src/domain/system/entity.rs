use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub theme: String,
    pub lang: String,
    pub last_tab: String,
    pub ai_enabled: bool,
    pub open_tabs: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfigUpdate {
    pub theme: Option<String>,
    pub lang: Option<String>,
    pub last_tab: Option<String>,
    pub ai_enabled: Option<bool>,
    pub open_tabs: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskUsage {
    pub path: String,
    pub used_bytes: u64,
    pub used_human: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub app_data_path: String,
    pub disk_usage: DiskUsage,
}

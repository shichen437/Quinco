use std::collections::HashMap;

use tauri::{AppHandle, Manager};

use crate::application::system_use_case::SystemUseCase;
use crate::domain::ai::entity::AIProvider;
use crate::domain::events::ApiKeyEvent;
use crate::domain::system::entity::AppConfigUpdate;
use crate::infrastructure::event_bus::BroadcastEventBus;
use crate::infrastructure::system::store_repo_impl::StoreRepoImpl;
use crate::infrastructure::system::system_repo_impl::SystemRepoImpl;
use crate::interfaces::dto::system::{ConfigDto, ConfigUpdateDto, SystemInfoDto};
use crate::shared::error::DomainError;

fn build_use_case(
    app: &AppHandle,
) -> Result<
    SystemUseCase<StoreRepoImpl<'_>, SystemRepoImpl, BroadcastEventBus<ApiKeyEvent>>,
    DomainError,
> {
    let event_bus = app
        .state::<BroadcastEventBus<ApiKeyEvent>>()
        .inner()
        .clone();
    Ok(SystemUseCase::new(
        StoreRepoImpl::new(app),
        SystemRepoImpl::from_app_handle(app)?,
        event_bus,
    ))
}

#[tauri::command]
pub async fn get_disk_usage(app_handle: AppHandle) -> Result<SystemInfoDto, String> {
    let use_case = build_use_case(&app_handle)?;
    use_case
        .get_system_info()
        .await
        .map(SystemInfoDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub fn get_config_cmd(app_handle: AppHandle) -> Result<ConfigDto, String> {
    let use_case = build_use_case(&app_handle)?;
    use_case
        .get_config()
        .map(ConfigDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub fn set_config_cmd(app_handle: AppHandle, config: ConfigUpdateDto) -> Result<ConfigDto, String> {
    let use_case = build_use_case(&app_handle)?;
    let update = AppConfigUpdate {
        theme: config.theme,
        lang: config.lang,
        last_tab: config.last_tab,
        ai_enabled: config.ai_enabled,
        open_tabs: config.open_tabs,
    };
    use_case
        .set_config(update)
        .map(ConfigDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub fn set_api_key(
    app_handle: AppHandle,
    provider_str: String,
    api_key: String,
) -> Result<(), String> {
    let provider = AIProvider::parse(&provider_str)?;
    let use_case = build_use_case(&app_handle)?;
    use_case
        .set_api_key(provider, &api_key)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub fn get_api_key(app_handle: AppHandle, provider_str: String) -> Result<Option<String>, String> {
    let provider = AIProvider::parse(&provider_str)?;
    let use_case = build_use_case(&app_handle)?;
    use_case
        .get_api_key(provider)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub fn reset_api_key(app_handle: AppHandle, provider_str: String) -> Result<(), String> {
    let provider = AIProvider::parse(&provider_str)?;
    let use_case = build_use_case(&app_handle)?;
    use_case
        .reset_api_key(provider)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub fn get_all_api_key_status_cmd(app_handle: AppHandle) -> Result<HashMap<String, bool>, String> {
    let use_case = build_use_case(&app_handle)?;
    let status = use_case.get_all_api_key_status()?;
    Ok(status
        .into_iter()
        .map(|(provider, enabled)| (provider.as_str().to_string(), enabled))
        .collect())
}

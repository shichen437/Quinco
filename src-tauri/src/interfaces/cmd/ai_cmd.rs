use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, State};

use crate::application::ai_use_case::AiUseCase;
use crate::application::chat_use_case::ChatStreamUseCase;
use crate::domain::ai::entity::NewAiChatSession;
use crate::domain::workspace::repo::WorkspaceRepository;
use crate::infrastructure::ai::ai_gateway;
use crate::infrastructure::ai::cached_ai_repo::CachedAiModelRepo;
use crate::infrastructure::repo_impl::ai_repo_impl::AiSessionRepoImpl;
use crate::infrastructure::repo_impl::workspace_repo_impl::WorkspaceRepoImpl;
use crate::interfaces::dto::ai::CreateChatSessionReq;
use crate::shared::error::DomainError;
use crate::shared::state::AppState;

type AiUseCaseCtx = AiUseCase<CachedAiModelRepo, AiSessionRepoImpl>;

fn build_use_case(app: &AppHandle, state: &State<'_, AppState>) -> AiUseCaseCtx {
    AiUseCase::new(
        CachedAiModelRepo::new(app.clone()),
        AiSessionRepoImpl::new(state.db.clone()),
    )
}

#[tauri::command]
pub async fn abort_stream(state: State<'_, AppState>, sid: String) -> Result<(), String> {
    state.abort_stream(&sid);
    Ok(())
}

#[tauri::command]
pub async fn list_all_ai_models(
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<crate::interfaces::dto::ai::ProviderModelsDto>, String> {
    use crate::domain::ai::entity::AIProvider;

    let use_case = build_use_case(&app_handle, &state);
    let providers = vec![AIProvider::Gemini, AIProvider::Zhipu, AIProvider::Moonshot];
    use_case
        .list_all_models(&providers)
        .await
        .map(|models| {
            models
                .into_iter()
                .map(crate::interfaces::dto::ai::ProviderModelsDto::from)
                .collect()
        })
        .map_err(DomainError::into_api_json)
}

type ActiveStreams = Arc<Mutex<HashSet<String>>>;

#[tauri::command]
pub async fn chat_stream(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    req: crate::interfaces::dto::ai::ChatStreamReq,
    channel: tauri::ipc::Channel<crate::interfaces::dto::ai::StreamEvent>,
) -> Result<(), String> {
    let wid = match req.wid {
        Some(wid) => wid,
        None => {
            let ws_repo = WorkspaceRepoImpl::new(state.db.clone());
            let ws = ws_repo
                .get_current()
                .await
                .map_err(DomainError::into_api_json)?;
            ws.id
        }
    };

    let resolver = ai_gateway::make_default_resolver(app_handle.clone());
    let use_case = ChatStreamUseCase::new(
        app_handle,
        AiSessionRepoImpl::new(state.db.clone()),
        resolver,
    );

    let active_streams: ActiveStreams = state.active_streams.clone();
    let sid = req.sid.clone();
    if let Ok(mut set) = active_streams.lock() {
        set.insert(sid.clone());
    }

    let result = use_case
        .execute(
            req.provider,
            req.model.as_deref(),
            req.message,
            channel,
            req.sid,
            wid,
            &active_streams,
        )
        .await
        .map_err(DomainError::into_api_json);

    if let Ok(mut set) = active_streams.lock() {
        set.remove(&sid);
    }
    result
}

#[tauri::command]
pub async fn create_chat_session(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    req: CreateChatSessionReq,
) -> Result<crate::interfaces::dto::ai::ChatSessionDto, String> {
    let title = req.title.unwrap_or_else(|| "New chat".to_string());
    let session = NewAiChatSession::new(req.model, req.provider, req.wid, title)?;
    let use_case = build_use_case(&app_handle, &state);
    use_case
        .create_session(session)
        .await
        .map(crate::interfaces::dto::ai::ChatSessionDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn list_chat_sessions(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    wid: i64,
) -> Result<Vec<crate::interfaces::dto::ai::ChatSessionDto>, String> {
    let use_case = build_use_case(&app_handle, &state);
    use_case
        .list_sessions(wid)
        .await
        .map(|sessions| {
            sessions
                .into_iter()
                .map(crate::interfaces::dto::ai::ChatSessionDto::from)
                .collect()
        })
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn get_chat_session_data(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    sid: String,
) -> Result<crate::interfaces::dto::ai::ChatSessionDetailDto, String> {
    let use_case = build_use_case(&app_handle, &state);
    use_case
        .get_session_data(&sid)
        .await
        .map(crate::interfaces::dto::ai::ChatSessionDetailDto::from)
        .map_err(DomainError::into_api_json)
}

#[tauri::command]
pub async fn delete_chat_session(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    sid: String,
) -> Result<(), String> {
    let use_case = build_use_case(&app_handle, &state);
    use_case
        .delete_session(&sid)
        .await
        .map_err(DomainError::into_api_json)
}

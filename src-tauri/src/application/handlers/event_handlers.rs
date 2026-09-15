use crate::domain::ai::repo::ModelCachePort;
use crate::domain::events::api_key_events::ApiKeyEvent;
use crate::domain::events::{EventBus, EventStream};

pub struct ApiKeyEventHandler;

impl ApiKeyEventHandler {
    pub fn spawn<B, M>(bus: B, model_cache: M)
    where
        B: EventBus<ApiKeyEvent>,
        M: ModelCachePort,
    {
        let mut rx = bus.subscribe();
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.next_event().await {
                match event {
                    ApiKeyEvent::KeySet { provider } => {
                        model_cache.clear_models(provider);
                        model_cache.refresh_models(provider);
                    }
                    ApiKeyEvent::KeyReset { provider } => {
                        model_cache.clear_models(provider);
                    }
                }
            }
        });
    }
}

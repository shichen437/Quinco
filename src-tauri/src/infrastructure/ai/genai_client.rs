use genai::adapter::AdapterKind;
use genai::resolver::{AuthData, ProviderConfig};
use genai::Client;

use crate::domain::ai::entity::{AIProvider, AiModel};
use crate::shared::error::DomainError;

pub struct GenAiClient {
    client: Client,
}

impl GenAiClient {
    pub fn new() -> Result<Self, DomainError> {
        let client = Client::new().map_err(DomainError::infra)?;
        Ok(Self { client })
    }

    fn adapter_kind_for(provider: AIProvider) -> Result<AdapterKind, DomainError> {
        match provider {
            AIProvider::Gemini => Ok(AdapterKind::Gemini),
            AIProvider::Zhipu => Ok(AdapterKind::BigModel),
            AIProvider::Moonshot => Ok(AdapterKind::Moonshot),
            _ => Err(DomainError::validation(format!(
                "unsupported provider for model listing: {}",
                provider.as_str()
            ))),
        }
    }

    pub async fn fetch_models_from_api(
        &self,
        provider: &str,
        api_key: Option<&str>,
    ) -> Result<Vec<AiModel>, DomainError> {
        let provider_kind = AIProvider::parse(provider)?;
        let adapter_kind = Self::adapter_kind_for(provider_kind)?;

        let provider_config = match api_key {
            Some(key) => ProviderConfig::from_auth(AuthData::from_single(key)),
            None => ProviderConfig::default(),
        };

        let model_names = self
            .client
            .all_model_names(adapter_kind, provider_config)
            .await
            .map_err(DomainError::infra)?;

        let filter_fn = provider_kind.model_filter();
        let models = model_names
            .into_iter()
            .filter(|name| filter_fn(name))
            .map(|name| AiModel {
                name,
                adapter_kind: provider.to_string(),
            })
            .collect();

        Ok(models)
    }
}

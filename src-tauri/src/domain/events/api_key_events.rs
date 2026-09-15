use crate::domain::ai::entity::AIProvider;

#[derive(Clone, Debug)]
pub enum ApiKeyEvent {
    KeySet { provider: AIProvider },
    KeyReset { provider: AIProvider },
}

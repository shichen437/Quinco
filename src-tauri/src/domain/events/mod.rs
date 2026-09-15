pub mod api_key_events;

pub use api_key_events::ApiKeyEvent;

use async_trait::async_trait;

#[async_trait]
pub trait EventStream: Send + 'static {
    type Event: Clone + Send + 'static;

    async fn next_event(&mut self) -> Option<Self::Event>;
}

pub trait EventBus<E>: Send + Sync + 'static
where
    E: Clone + Send + 'static,
{
    type Receiver: EventStream<Event = E>;

    fn subscribe(&self) -> Self::Receiver;

    fn send(&self, event: E);
}

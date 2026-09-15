use async_trait::async_trait;
use tokio::sync::broadcast;

use crate::domain::events::{EventBus, EventStream};

pub struct BroadcastEventBus<E>
where
    E: Clone + Send + 'static,
{
    sender: broadcast::Sender<E>,
}

impl<E> BroadcastEventBus<E>
where
    E: Clone + Send + 'static,
{
    pub fn new(buffer: usize) -> Self {
        let (sender, _) = broadcast::channel(buffer);
        Self { sender }
    }
}

impl<E> Clone for BroadcastEventBus<E>
where
    E: Clone + Send + 'static,
{
    fn clone(&self) -> Self {
        Self {
            sender: self.sender.clone(),
        }
    }
}

impl<E> EventBus<E> for BroadcastEventBus<E>
where
    E: Clone + Send + 'static,
{
    type Receiver = broadcast::Receiver<E>;

    fn subscribe(&self) -> Self::Receiver {
        self.sender.subscribe()
    }

    fn send(&self, event: E) {
        let _ = self.sender.send(event);
    }
}

#[async_trait]
impl<E> EventStream for broadcast::Receiver<E>
where
    E: Clone + Send + 'static,
{
    type Event = E;

    async fn next_event(&mut self) -> Option<Self::Event> {
        self.recv().await.ok()
    }
}

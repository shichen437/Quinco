use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use sqlx::SqlitePool;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub(crate) active_streams: Arc<Mutex<HashSet<String>>>,
}

impl AppState {
    pub fn new(db: SqlitePool) -> Self {
        Self {
            db,
            active_streams: Arc::new(Mutex::new(HashSet::new())),
        }
    }

    pub fn abort_stream(&self, sid: &str) -> bool {
        self.active_streams
            .lock()
            .map(|mut set| set.remove(sid))
            .unwrap_or(false)
    }
}

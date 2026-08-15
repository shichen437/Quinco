use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;

use chrono::Local;
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager, Runtime};
use uuid::Uuid;

use crate::domain::error::DomainError;
use crate::domain::file::{
    classify_by_mime, ext_from_filename, file_url, parse_file_id, NewFile, FILE_PROTOCOL_PREFIX,
};
use crate::infra::repositories::file_repo;

static FILE_POOL: OnceLock<SqlitePool> = OnceLock::new();

pub fn register_pool(pool: SqlitePool) {
    let _ = FILE_POOL.set(pool);
}

fn pool() -> Option<&'static SqlitePool> {
    FILE_POOL.get()
}

pub async fn upload<R: Runtime>(
    app: &AppHandle<R>,
    db: &SqlitePool,
    bytes: &[u8],
    filename: &str,
    mime_type: &str,
) -> Result<String, DomainError> {
    if bytes.is_empty() {
        return Err(DomainError::validation("file content is empty"));
    }

    let content_hash = {
        let mut hasher = Sha256::new();
        hasher.update(bytes);
        format!("{:x}", hasher.finalize())
    };

    if let Some(id) = file_repo::find_id_by_hash(db, &content_hash).await? {
        return Ok(file_url(&id));
    }

    let id = Uuid::new_v4().to_string();
    let file_type = classify_by_mime(mime_type);
    let file_ext = ext_from_filename(filename);
    let storage_key = format!(
        "data/files/{}/{}/{}{}",
        file_type,
        Local::now().format("%Y-%m"),
        content_hash,
        file_ext
    );

    let target = app
        .path()
        .resolve(&storage_key, BaseDirectory::AppData)
        .map_err(DomainError::infra)?;
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(DomainError::infra)?;
    }
    fs::write(&target, bytes).map_err(DomainError::infra)?;

    file_repo::insert(
        db,
        &NewFile {
            id: &id,
            filename,
            file_size: bytes.len() as i64,
            file_ext: &file_ext,
            mime_type,
            storage_key: &storage_key,
            content_hash: &content_hash,
        },
    )
    .await?;

    let id = file_repo::find_id_by_hash(db, &content_hash)
        .await?
        .unwrap_or(id);

    Ok(file_url(&id))
}

pub async fn resolve_storage<R: Runtime>(
    app: &AppHandle<R>,
    id: &str,
) -> Option<(PathBuf, String)> {
    let db = pool()?;
    let (storage_key, mime_type) = file_repo::find_storage(db, id).await.ok()??;
    let path = app
        .path()
        .resolve(&storage_key, BaseDirectory::AppData)
        .ok()?;
    Some((path, mime_type))
}

pub fn extract_image_file_refs(content: &str) -> HashMap<String, i64> {
    let mut counts = HashMap::new();
    if let Ok(value) = serde_json::from_str::<Value>(content) {
        walk_blocks(&value, &mut counts);
    }
    counts
}

fn walk_blocks(value: &Value, counts: &mut HashMap<String, i64>) {
    match value {
        Value::Array(items) => {
            for item in items {
                walk_blocks(item, counts);
            }
        }
        Value::Object(map) => {
            if map.get("type").and_then(Value::as_str) == Some("image") {
                let url = map
                    .get("props")
                    .and_then(|props| props.get("url"))
                    .and_then(Value::as_str)
                    .filter(|url| url.starts_with(FILE_PROTOCOL_PREFIX));
                if let Some(id) = url.and_then(parse_file_id) {
                    *counts.entry(id).or_insert(0) += 1;
                }
            }
            for (_, child) in map {
                walk_blocks(child, counts);
            }
        }
        _ => {}
    }
}

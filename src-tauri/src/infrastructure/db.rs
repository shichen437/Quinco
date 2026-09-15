use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::fs;
use tauri::path::BaseDirectory;
use tauri::Manager;

pub async fn init_sqlite_and_migrate(
    app: &tauri::AppHandle,
) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_path = app
        .path()
        .resolve("data/quinco.db", BaseDirectory::AppData)?;

    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(
            SqliteConnectOptions::new()
                .filename(&db_path)
                .create_if_missing(true),
        )
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

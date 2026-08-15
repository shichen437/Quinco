use tauri::http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE};
use tauri::http::{Request, Response, StatusCode};
use tauri::{AppHandle, Runtime, UriSchemeContext, UriSchemeResponder};

use crate::application::file_service;

pub fn handle<R: Runtime>(
    ctx: UriSchemeContext<'_, R>,
    request: Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let app = ctx.app_handle().clone();
    let uri = request.uri().to_string();

    tauri::async_runtime::spawn(async move {
        let response = match parse_file_request_id(&uri) {
            Some(id) => file_response(&app, &id).await,
            None => not_found_response(),
        };
        responder.respond(response);
    });
}

fn parse_file_request_id(uri: &str) -> Option<String> {
    let url = tauri::Url::parse(uri).ok()?;
    let host = url.host_str()?;

    let is_file_host =
        (url.scheme() == "quinco" && host == "localhost") || host == "quinco.localhost";
    if !is_file_host {
        return None;
    }

    let id = url.path().strip_prefix("/file/")?.split('/').next()?;
    if id.is_empty() {
        None
    } else {
        Some(id.to_string())
    }
}

async fn file_response<R: Runtime>(app: &AppHandle<R>, id: &str) -> Response<Vec<u8>> {
    match file_service::resolve_storage(app, id).await {
        Some((path, mime_type)) => match std::fs::read(&path) {
            Ok(bytes) => Response::builder()
                .status(StatusCode::OK)
                .header(CONTENT_TYPE, mime_type)
                .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .body(bytes)
                .unwrap(),
            Err(_) => not_found_response(),
        },
        None => not_found_response(),
    }
}

fn not_found_response() -> Response<Vec<u8>> {
    Response::builder()
        .status(StatusCode::NOT_FOUND)
        .header(CONTENT_TYPE, "text/plain")
        .body(b"not found".to_vec())
        .unwrap()
}

/// 文件访问协议前缀，上传成功后返回 `quinco://localhost/file/{id}` 形式的 URL。
/// 使用独立 scheme，不覆盖默认 tauri 协议（tauri://localhost 前端资源服务保持原样）。
pub const FILE_PROTOCOL_PREFIX: &str = "quinco://localhost/file/";

/// 新建文件记录的入参。
pub struct NewFile<'a> {
    pub id: &'a str,
    pub filename: &'a str,
    pub file_size: i64,
    pub file_ext: &'a str,
    pub mime_type: &'a str,
    pub storage_key: &'a str,
    pub content_hash: &'a str,
}

/// 按 MIME 类型归类存储目录：image / audio / video / file。
pub fn classify_by_mime(mime_type: &str) -> &'static str {
    match mime_type.split('/').next().unwrap_or("") {
        "image" => "image",
        "audio" => "audio",
        "video" => "video",
        _ => "file",
    }
}

/// 从文件名提取小写扩展名（含前导点），无扩展名时返回空字符串。
pub fn ext_from_filename(filename: &str) -> String {
    match filename.rsplit_once('.') {
        Some((name, ext)) if !name.is_empty() && !ext.is_empty() => {
            format!(".{}", ext.to_lowercase())
        }
        _ => String::new(),
    }
}

/// 拼装文件访问 URL。
pub fn file_url(id: &str) -> String {
    format!("{}{}", FILE_PROTOCOL_PREFIX, id)
}

/// 从 `quinco://localhost/file/{id}` URL 中解析文件 id，非本协议返回 None。
pub fn parse_file_id(url: &str) -> Option<String> {
    let rest = url.strip_prefix(FILE_PROTOCOL_PREFIX)?;
    let id = rest.split(['/', '?', '#']).next()?;
    if id.is_empty() {
        None
    } else {
        Some(id.to_string())
    }
}

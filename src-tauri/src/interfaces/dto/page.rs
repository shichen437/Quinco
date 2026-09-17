use serde::Serialize;

/// 校验并规范化分页参数。
/// 任意非法输入都会收敛到默认值（page=1, page_size=default_size）。
/// 返回 `(page, page_size, offset)`。
pub fn normalize_page(
    page: i64,
    page_size: i64,
    default_size: i64,
    max_size: i64,
) -> (i64, i64, i64) {
    let page = if page < 1 { 1 } else { page };
    let size = if page_size < 1 {
        default_size
    } else if page_size > max_size {
        max_size
    } else {
        page_size
    };
    let offset = (page - 1) * size;
    (page, size, offset)
}

/// 分页响应结构。前端根据 `total` + `page_size` 计算总页数。
#[derive(Debug, Clone, Serialize)]
pub struct Paginated<T> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}

impl<T> Paginated<T> {
    pub fn new(items: Vec<T>, total: i64, page: i64, page_size: i64) -> Self {
        Self {
            items,
            total,
            page,
            page_size,
        }
    }
}

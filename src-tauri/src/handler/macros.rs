#[macro_export]
macro_rules! quinco_commands {
    () => {
        tauri::generate_handler![
            // Workspace
            interfaces::commands::workspace_list,
            interfaces::commands::workspace_current,
            interfaces::commands::workspace_create,
            interfaces::commands::workspace_get,
            interfaces::commands::workspace_update,
            interfaces::commands::workspace_delete,
            interfaces::commands::workspace_switch,
            // Doc - List & Search
            interfaces::commands::doc_list_current_workspace,
            interfaces::commands::doc_list_favorite_current_workspace,
            interfaces::commands::doc_list_by_tag_current_workspace,
            interfaces::commands::doc_list_bidirectional_links,
            interfaces::commands::doc_search_reference_candidates,
            interfaces::commands::doc_quick_search,
            // Doc - CRUD
            interfaces::commands::doc_get,
            interfaces::commands::doc_get_with_content,
            interfaces::commands::doc_create_current_workspace,
            interfaces::commands::doc_update_title,
            interfaces::commands::doc_update_emoji,
            interfaces::commands::doc_update_content,
            // Doc - Favorite / Lock / Trash
            interfaces::commands::doc_set_favorite,
            interfaces::commands::doc_set_lock,
            interfaces::commands::doc_move_to_trash,
            interfaces::commands::doc_list_trash_current_workspace,
            interfaces::commands::doc_restore_from_trash,
            interfaces::commands::doc_delete_permanently,
            // Tag
            interfaces::commands::tag_list_current_workspace,
            interfaces::commands::tag_create_current_workspace,
            interfaces::commands::tag_update_current_workspace,
            interfaces::commands::tag_delete_current_workspace,
            // Doc - Tag
            interfaces::commands::doc_list_tags,
            interfaces::commands::doc_attach_tag,
            interfaces::commands::doc_detach_tag,
            // Doc Link
            interfaces::commands::doc_link_upsert,
            interfaces::commands::doc_link_delete,
            interfaces::commands::doc_graph_data,
            // File
            interfaces::commands::file_upload,
            // System
            interfaces::commands::data_dir,
            interfaces::commands::storage_used,
        ]
    };
}

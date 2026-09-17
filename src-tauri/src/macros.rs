#[macro_export]
macro_rules! quinco_commands {
    () => {
        tauri::generate_handler![
            // worksapce cmds
            crate::interfaces::cmd::workspace_cmd::get_all_workspaces,
            crate::interfaces::cmd::workspace_cmd::get_current_workspace,
            crate::interfaces::cmd::workspace_cmd::switch_workspace,
            crate::interfaces::cmd::workspace_cmd::create_workspace,
            crate::interfaces::cmd::workspace_cmd::create_and_switch_workspace,
            crate::interfaces::cmd::workspace_cmd::delete_workspace,
            crate::interfaces::cmd::workspace_cmd::rename_workspace,
            crate::interfaces::cmd::workspace_cmd::reset_workspace,
            // document cmds
            crate::interfaces::cmd::document_cmd::get_document,
            crate::interfaces::cmd::document_cmd::get_workspace_documents,
            crate::interfaces::cmd::document_cmd::create_document,
            crate::interfaces::cmd::document_cmd::update_document_title,
            crate::interfaces::cmd::document_cmd::update_document_content,
            crate::interfaces::cmd::document_cmd::get_document_content,
            crate::interfaces::cmd::document_cmd::soft_delete_document,
            crate::interfaces::cmd::document_cmd::restore_document,
            crate::interfaces::cmd::document_cmd::hard_delete_document,
            crate::interfaces::cmd::document_cmd::empty_trash,
            crate::interfaces::cmd::document_cmd::toggle_favorite_document,
            crate::interfaces::cmd::document_cmd::get_favorite_documents,
            crate::interfaces::cmd::document_cmd::get_deleted_documents,
            crate::interfaces::cmd::document_cmd::toggle_lock_document,
            crate::interfaces::cmd::document_cmd::get_recent_documents,
            crate::interfaces::cmd::document_cmd::doc_search,
            crate::interfaces::cmd::document_cmd::get_backlinks,
            crate::interfaces::cmd::document_cmd::get_graph_data,
            // tag cmds
            crate::interfaces::cmd::tag_cmd::get_workspace_tags,
            crate::interfaces::cmd::tag_cmd::get_doc_tags,
            crate::interfaces::cmd::tag_cmd::add_tag_to_doc,
            crate::interfaces::cmd::tag_cmd::remove_tag_from_doc,
            crate::interfaces::cmd::tag_cmd::update_tag,
            crate::interfaces::cmd::tag_cmd::delete_tag,
            crate::interfaces::cmd::tag_cmd::get_tag_docs,
            // system cmds
            crate::interfaces::cmd::system_cmd::get_disk_usage,
            crate::interfaces::cmd::system_cmd::get_config_cmd,
            crate::interfaces::cmd::system_cmd::set_config_cmd,
            crate::interfaces::cmd::system_cmd::set_api_key,
            crate::interfaces::cmd::system_cmd::get_api_key,
            crate::interfaces::cmd::system_cmd::reset_api_key,
            crate::interfaces::cmd::system_cmd::get_all_api_key_status_cmd,
            // ai cmds
            crate::interfaces::cmd::ai_cmd::abort_stream,
            crate::interfaces::cmd::ai_cmd::list_all_ai_models,
            crate::interfaces::cmd::ai_cmd::chat_stream,
            crate::interfaces::cmd::ai_cmd::create_chat_session,
            crate::interfaces::cmd::ai_cmd::list_chat_sessions,
            crate::interfaces::cmd::ai_cmd::get_chat_session_data,
            crate::interfaces::cmd::ai_cmd::delete_chat_session,
        ]
    };
}

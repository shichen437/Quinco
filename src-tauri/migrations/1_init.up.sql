CREATE TABLE IF NOT EXISTS sys_workspace (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    is_current  INTEGER DEFAULT 0,
    type        TEXT DEFAULT 'local',
    created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at  DATETIME DEFAULT (datetime('now', 'localtime'))
);

INSERT INTO sys_workspace (name, is_current) VALUES ('Demo Workspace', 1);

CREATE TABLE IF NOT EXISTS sys_doc (
    id          TEXT PRIMARY KEY,
    title       TEXT DEFAULT '',
    emoji       TEXT DEFAULT '',
    type        TEXT DEFAULT 'doc',
    wid         INTEGER NOT NULL,
    is_lock     INTEGER DEFAULT 0,
    is_favorite INTEGER DEFAULT 0,
    is_delete   INTEGER DEFAULT 0,
    deleted_at  DATETIME,
    created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at  DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_doc_wid_is_delete ON sys_doc(wid, is_delete);
CREATE INDEX idx_doc_is_favorite ON sys_doc(is_favorite);
CREATE INDEX idx_doc_deleted_at ON sys_doc(deleted_at);
CREATE INDEX idx_doc_updated_at ON sys_doc(updated_at DESC);

CREATE TABLE IF NOT EXISTS sys_doc_ext (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id      TEXT NOT NULL,
    content     TEXT,
    plain_text  TEXT,
    created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at  DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX idx_doc_ext_doc_id ON sys_doc_ext(doc_id);

CREATE TABLE IF NOT EXISTS sys_doc_link (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_doc_id   TEXT NOT NULL,
    target_doc_id   TEXT,
    wid             INTEGER NOT NULL,
    created_at      DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_doc_link_wid ON sys_doc_link(wid);
CREATE INDEX idx_doc_link_source_target ON sys_doc_link(source_doc_id, target_doc_id);
CREATE INDEX idx_doc_link_target_source ON sys_doc_link(target_doc_id, source_doc_id);

CREATE UNIQUE INDEX idx_doc_link_unique ON sys_doc_link(source_doc_id, target_doc_id);

CREATE TABLE IF NOT EXISTS sys_doc_version (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id      TEXT NOT NULL,
    content     TEXT,
    version     INTEGER DEFAULT 1,
    created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
);

CREATE UNIQUE INDEX idx_doc_version_doc_id ON sys_doc_version(doc_id, version);

CREATE TABLE IF NOT EXISTS sys_tag (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    wid         INTEGER NOT NULL,
    created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at  DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX idx_tag_unique_wid_name ON sys_tag(wid, name);

CREATE TABLE IF NOT EXISTS sys_tag_link (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tid         INTEGER NOT NULL,
    doc_id      TEXT NOT NULL,
    created_at  DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at  DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX idx_tag_link_unique_tid_doc ON sys_tag_link(tid, doc_id);

CREATE TABLE IF NOT EXISTS sys_file (
    id              TEXT PRIMARY KEY,
    filename        TEXT,
    file_size       INTEGER NOT NULL,
    file_ext        TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    storage_key     TEXT NOT NULL,
    content_hash    TEXT NOT NULL,
    ref_count       INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX idx_file_content_hash ON sys_file(content_hash);

CREATE TABLE IF NOT EXISTS sys_file_ref (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    fid             TEXT NOT NULL,
    doc_id          TEXT NOT NULL,
    ref_count       INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at      DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE UNIQUE INDEX idx_file_unique_fid_doc_id ON sys_file_ref(fid, doc_id);

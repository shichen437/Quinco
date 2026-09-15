#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-shichen437/Quinco}"

SRC_TAURI_CONF="src-tauri/tauri.conf.json"
BUILD_DIR=".build"

log()  { printf '\033[1;36m>>>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!!\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31mERR\033[0m %s\n' "$*" >&2; exit 1; }

log "读取版本号 ..."
VERSION="$(python3 -c 'import json;print(json.load(open("'"${SRC_TAURI_CONF}"'"))["version"])')"
if [[ -z "${VERSION}" ]]; then
  err "无法从 ${SRC_TAURI_CONF} 读取版本号"
fi
log "  version = ${VERSION}"
log "  repo    = ${REPO}"

log "运行 mise run build ..."
mise run build
log "构建完成"

log "准备输出目录 '${BUILD_DIR}/' ..."
mkdir -p "${BUILD_DIR}"

RELEASE_BASE="src-tauri/target"

TARGETS="
x86_64-apple-darwin|x64|darwin-x86_64
aarch64-apple-darwin|aarch64|darwin-aarch64
"

TMPFILE="$(mktemp)"
trap 'rm -f "${TMPFILE}"' EXIT

while IFS='|' read -r RUST_TARGET DM_ARCH PLATFORM_KEY; do
  [[ -z "${RUST_TARGET}" ]] && continue

  src_dmg_dir="${RELEASE_BASE}/${RUST_TARGET}/release/bundle/dmg"
  src_macos_dir="${RELEASE_BASE}/${RUST_TARGET}/release/bundle/macos"

  [[ -d "${src_dmg_dir}" ]] || err "DMG 目录不存在: ${src_dmg_dir}"
  [[ -d "${src_macos_dir}" ]] || err "macOS 产物目录不存在: ${src_macos_dir}"

  # --- DMG ---
  src_dmg="${src_dmg_dir}/quinco_${VERSION}_${DM_ARCH}.dmg"
  [[ -f "${src_dmg}" ]] || err "DMG 不存在：${src_dmg}"
  cp "${src_dmg}" "${BUILD_DIR}/"
  log "  [${DM_ARCH}] DMG 已复制：quinco_${VERSION}_${DM_ARCH}.dmg"

  # --- tar.gz（重命名包含架构信息，与 DMG 格式统一） ---
  src_tar="${src_macos_dir}/quinco.app.tar.gz"
  [[ -f "${src_tar}" ]] || err "tar.gz 不存在：${src_tar}"
  new_tar_name="quinco_${VERSION}_${DM_ARCH}.app.tar.gz"
  cp "${src_tar}" "${BUILD_DIR}/${new_tar_name}"
  log "  [${DM_ARCH}] tar.gz 已复制/重命名：${new_tar_name}"

  # --- 签名 (.sig) ---
  src_sig="${src_macos_dir}/quinco.app.tar.gz.sig"
  [[ -f "${src_sig}" ]] || err "签名文件不存在：${src_sig}"
  sig_content="$(cat "${src_sig}")"
  if [[ -z "${sig_content}" ]]; then
    err "签名文件为空：${src_sig}"
  fi
  cp "${src_sig}" "${BUILD_DIR}/${new_tar_name}.sig"
  log "  [${DM_ARCH}] 签名已读取并复制：${new_tar_name}.sig"

  # 记录 | python 用 tab 分隔：platform_key, tar_name, signature
  printf '%s\t%s\t%s\n' "${PLATFORM_KEY}" "${new_tar_name}" "${sig_content}" >> "${TMPFILE}"

done <<< "${TARGETS}"

log "生成 build/latest.json ..."

PUB_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
log "  pub_date = ${PUB_DATE}"

python3 << PYEOF
import json, sys

version = "${VERSION}"
repo = "${REPO}"
pub_date = "${PUB_DATE}"
build_dir = "${BUILD_DIR}"
tmpfile = "${TMPFILE}"

platforms = {}
line_no = 0
with open(tmpfile) as f:
    for raw in f:
        line_no += 1
        raw = raw.rstrip("\n")
        if not raw:
            continue
        parts = raw.split("\t")
        if len(parts) != 3:
            print(f"WARN: skip bad line {line_no}: {raw!r}", file=sys.stderr)
            continue
        platform_key, tar_name, sig = parts
        url = f"https://github.com/{repo}/releases/download/v{version}/{tar_name}"
        platforms[platform_key] = {
            "signature": sig,
            "url": url,
        }

data = {
    "version": version,
    "pub_date": pub_date,
    "platforms": platforms,
}

with open(f"{build_dir}/latest.json", "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
PYEOF

log "验证产物:"
find "${BUILD_DIR}" -maxdepth 1 -type f | sort | while read -r f; do
  sz="$(wc -c < "${f}" | tr -d ' ')"
  printf '    %-55s %10s B\n' "$(basename "${f}")" "${sz}"
done

log "清理 Rust target/ ..."
( cd src-tauri && cargo clean --release )
log "  target/ 已用 cargo clean 清理完毕"

#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '%s\n' "$*"
}

run_cmd() {
  log "+ $*"
  "$@"
}

run_stage() {
  local stage_name="$1"
  shift
  log ""
  log "=============================="
  log "STAGE: ${stage_name}"
  log "=============================="
  "$@"
}

assert_file_exists() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    log "Missing file: $path"
    return 1
  fi
}

assert_dir_exists() {
  local path="$1"
  if [[ ! -d "$path" ]]; then
    log "Missing directory: $path"
    return 1
  fi
}

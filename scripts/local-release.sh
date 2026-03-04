#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/release-artifacts"
VERSION_OVERRIDE=""
RUN_TESTS=1
RUN_BUILD=1
PUBLISH=0
NPM_TAG="latest"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/local-release.sh [options]

Options:
  --out <dir>            Output directory for release assets (default: ./release-artifacts)
  --version <value>      Override package version used for filenames
  --skip-tests           Skip npm test
  --skip-build           Skip npm run build:all
  --publish              Publish packages after packaging
  --tag <value>          NPM publish tag (default: latest)
  --help                 Show this help message

Examples:
  ./scripts/local-release.sh
  ./scripts/local-release.sh --version 1.5.1 --skip-tests
  ./scripts/local-release.sh --publish --tag latest
EOF
}

run() {
  local cmd=("$@")
  echo "==> ${cmd[*]}"
  "${cmd[@]}"
}

latest_tgz_file() {
  local target_dir=$1
  local file
  file="$(ls -1 "$target_dir"/*.tgz 2>/dev/null | sort | tail -n 1 || true)"
  echo "$file"
}

pack_package() {
  local package_dir=$1
  local label=$2

  echo "==> Creating package for $label"
  run bash -lc "cd '$ROOT_DIR/$package_dir' && npm pack"

  local packed_file
  packed_file="$(latest_tgz_file "$ROOT_DIR/$package_dir")"
  if [ -z "$packed_file" ]; then
    echo "Failed to create package for $label"
    exit 1
  fi

  run mv "$packed_file" "$OUT_DIR/$label-v$VERSION.tgz"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)
      OUT_DIR="$2"
      shift 2
      ;;
    --version)
      VERSION_OVERRIDE="$2"
      shift 2
      ;;
    --skip-tests)
      RUN_TESTS=0
      shift
      ;;
    --skip-build)
      RUN_BUILD=0
      shift
      ;;
    --publish)
      PUBLISH=1
      shift
      ;;
    --tag)
      NPM_TAG="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

VERSION="${VERSION_OVERRIDE}"
if [ -z "$VERSION" ]; then
  VERSION="$(node -p "require('./webai-server/package.json').version")"
  VERSION="${VERSION//$'\n'/}"
fi

mkdir -p "$OUT_DIR"

if [ "$RUN_BUILD" -eq 1 ]; then
  run npm run build:all
fi

if [ "$RUN_TESTS" -eq 1 ]; then
  run npm test
fi

pack_package "webai-mcp" "webai-mcp"
pack_package "webai-server" "webai-server"

echo "==> Creating Chrome extension package"
(
  cd "$ROOT_DIR/chrome-extension"
  run zip -r "$OUT_DIR/webai-chrome-extension-v$VERSION.zip" . -x "*.git*" "node_modules/*" "*.DS_Store*"
)

if [ "$PUBLISH" -eq 1 ]; then
  run npm publish "$OUT_DIR/webai-mcp-v$VERSION.tgz" --access public --tag "$NPM_TAG"
  run npm publish "$OUT_DIR/webai-server-v$VERSION.tgz" --access public --tag "$NPM_TAG"
  echo "==> Published webai-mcp and webai-server with tag '$NPM_TAG'"
fi

echo
echo "Local release assets are ready:"
echo "  - $OUT_DIR/webai-mcp-v$VERSION.tgz"
echo "  - $OUT_DIR/webai-server-v$VERSION.tgz"
echo "  - $OUT_DIR/webai-chrome-extension-v$VERSION.zip"
echo
if [ "$PUBLISH" -eq 0 ]; then
  echo "Artifacts are prepared for manual publishing/uploading."
  echo "Use --publish to perform local npm publish now."
fi

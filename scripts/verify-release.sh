#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"
echo "[1/5] npm ci"
npm ci

echo "[2/5] frontend build"
npm run build

echo "[3/5] backend API tests"
python3 -m unittest discover -s backend/tests

echo "[4/5] rust build"
cargo build --manifest-path src-tauri/Cargo.toml

if [[ "${RUN_TAURI_BUILD:-0}" == "1" ]]; then
  echo "[5/5] tauri build"
  npm run tauri build
else
  echo "[5/5] tauri build skipped (set RUN_TAURI_BUILD=1 to enable full packaging drill)"
fi

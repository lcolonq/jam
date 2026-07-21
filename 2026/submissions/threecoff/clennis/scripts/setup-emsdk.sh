#!/usr/bin/env bash
# Install the Emscripten SDK into ./vendor/emsdk (needed only for the web build).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EMSDK_DIR="$ROOT/vendor/emsdk"

if [ ! -d "$EMSDK_DIR" ]; then
    echo ">> Cloning emsdk into $EMSDK_DIR"
    git clone --depth 1 https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
fi

cd "$EMSDK_DIR"
echo ">> Installing latest Emscripten toolchain (large download)..."
./emsdk install latest
./emsdk activate latest

echo
echo ">> Done. Activate it in your shell with:"
echo "     source $EMSDK_DIR/emsdk_env.sh"

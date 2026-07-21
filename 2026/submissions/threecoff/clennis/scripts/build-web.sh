#!/usr/bin/env bash
# Configure + build the WebAssembly version into ./build-web (tennis.html/.js/.wasm)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Activate the project-local Emscripten SDK if the caller hasn't already.
if ! command -v emcc >/dev/null 2>&1; then
    if [ -f "$ROOT/vendor/emsdk/emsdk_env.sh" ]; then
        # shellcheck disable=SC1091
        source "$ROOT/vendor/emsdk/emsdk_env.sh"
    else
        echo "error: emcc not found and vendor/emsdk missing. Run scripts/setup-emsdk.sh first." >&2
        exit 1
    fi
fi

# CMake/emscripten intermediates live in build/web; only the runtime files
# (index/tennis.html, tennis.js, tennis.wasm, tennis.data) land in build-web.
emcmake cmake -B build/web -DPLATFORM=Web -DCMAKE_BUILD_TYPE=Release
cmake --build build/web -j"$(nproc)"
cmake --install build/web --prefix build-web --component web >/dev/null

echo
echo ">> Built build-web/tennis.html (+ index.html copy)  —  serve it"
echo "   (COOP/COEP not required; ports below 1024 need root) with e.g.:"
echo "     python -m http.server -d build-web 8000"
echo "   then open http://localhost:8000/"

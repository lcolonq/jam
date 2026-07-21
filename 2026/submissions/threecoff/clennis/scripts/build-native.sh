#!/usr/bin/env bash
# Configure + build the native desktop binary at ./build-native/tennis
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

cmake -B build-native -DCMAKE_BUILD_TYPE=Debug
cmake --build build-native -j"$(nproc)"

echo
echo ">> Built build-native/tennis  —  run it with:  ./build-native/tennis"

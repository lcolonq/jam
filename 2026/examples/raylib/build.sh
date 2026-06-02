#!/bin/sh
set -xeu -o pipefail
mkdir -p output
emcc -I./raylib/src libraylib.a -s USE_GLFW=3 -s ASYNCIFY --shell-file ./raylib/src/minshell.html main.c -DPLATFORM_WEB -o output/game.html

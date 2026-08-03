#include "raylib.h"

#include <emscripten/em_types.h>
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>

#include <cut.hpp>
#include <game_loop.hpp>

int main() {
  InitWindow(GAME_WIDTH * SCALE, GAME_HEIGHT * SCALE, "sakura samurai");
  emscripten_run_script("window.parent.postMessage({op: \"ready\"});");
  emscripten_set_main_loop(UpdateDrawFrame, 30, 1);
  // EM_ASM(window.lcolonqJamStart = 1.0;);

  return 0;
}

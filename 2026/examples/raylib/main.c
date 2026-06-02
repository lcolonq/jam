#include <raylib.h>
#include <emscripten.h>
#include <stdio.h>
#include <stdbool.h>

int main(int argc, char **argv) {
    InitWindow(240, 160, "test game raylib mode");
    SetTargetFPS(60);
    emscripten_run_script("window.parent.postMessage({op: \"ready\"});");
    bool started = false;
    while (!WindowShouldClose()) {
        if (!started) {
            double difficulty = EM_ASM_DOUBLE({return window.lcolonqJamStart || -1.0;});
            printf("difficulty: %f\n", difficulty);
            if (difficulty > 0.0) {
                started = true;
                emscripten_run_script("window.parent.postMessage({op: \"started\"});");
                printf("started at difficulty: %f\n", difficulty);
            }
        } else {
            if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
                printf("clicked\n");
                emscripten_run_script("window.parent.postMessage({op: \"done\", win: false});");
                return 0;
            }
            BeginDrawing();
            ClearBackground(RED);
            DrawText("hello gamer", 0, 0, 20, WHITE);
            EndDrawing();
        }
    }
    return 0;
}

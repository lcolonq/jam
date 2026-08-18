#pragma once

#include <cstring>
#include <emscripten/fetch.h>

void on_success(emscripten_fetch_t *fetch);
void on_error(emscripten_fetch_t *fetch);
void post_score(int score);

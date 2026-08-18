#pragma once

#include <raylib.h>

constexpr int GAME_WIDTH = 120;
constexpr int GAME_HEIGHT = 80;
constexpr int SCALE = 2;

struct ScorePetal {
  Vector2 Position;
  Texture2D Texture;
};

void UpdateDrawFrame();

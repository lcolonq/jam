#pragma once

#include "raylib.h"

class Cut {
private:
  Vector2 start_;
  Vector2 end_;
  float current_step_;

  Sound slash_;

public:
  Cut(Vector2 start, Vector2 end);
  void Draw();
  void Update();
  bool its_joever = false;
};

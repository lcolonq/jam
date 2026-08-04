#pragma once

#include <raymath.h>

class Clock {
private:
  float radius_;
  long frame_total_;
  long current_frame_;
  Vector2 center_position_;

public:
  Clock(float radius, Vector2 center, int total) {
    radius_ = radius;
    frame_total_ = total;
    current_frame_ = total;
    center_position_ = center;
  }

  void Update();
  void Draw();
  bool TimeIsUp();
  void Reset();
};

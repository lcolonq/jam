#include "raylib.h"
#include <algorithm>
#include <clock.hpp>

void Clock::Update() { current_frame_ = std::max(0.0f, (float)current_frame_ - 1); }
void Clock::Draw() {

  DrawCircle(center_position_.x, center_position_.y, radius_, {0x3c, 0x3a, 0x3a, 0xFF});
  DrawCircleSector(
      center_position_,
      radius_ - 2,
      -90,
      -90 + (-360 * (current_frame_ / (float)frame_total_)),
      36,
      {0xDE, 0xAD, 0xFF, 0xFF});
}

bool Clock::TimeIsUp() { return current_frame_ <= 0; }
void Clock::Reset() { current_frame_ = frame_total_; }

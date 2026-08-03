#include "raylib.h"
#include "raymath.h"
#include <cut.hpp>

Cut::Cut(Vector2 start, Vector2 end) {
  InitAudioDevice();
  this->start_ = start;
  this->end_ = end;
  this->current_step_ = 0.0;
  this->slash_ = LoadSound("assets/slash.wav");
}

void Cut::Draw() {
  if (this->its_joever) {
    return;
  }

  Vector2 head = Vector2Lerp(start_, end_, current_step_);
  DrawLineV(start_, head, {0x0F, 0x0F, 0x0F, 0x40});
}

void Cut::Update() {
  if (this->its_joever) {
    return;
  }

  if (this->current_step_ == 0.0) {
    PlaySound(slash_);
  }

  if (this->current_step_ >= 1.0) {
    this->its_joever = true;
    return;
  }

  this->current_step_ += (1.0 / 60.0);
}

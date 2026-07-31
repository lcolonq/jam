#pragma once

#include "raylib.h"
#include <cstdlib>
#include <format>
#include <optional>
#include <random>

struct PetalThing {
  Texture2D texture;
  bool direction;
  Vector2 position;
};

class Petal {
private:
  PetalThing thing_;
  Vector2 size_;
  Color color_;
  std::mt19937 generator_;
  std::uniform_real_distribution<float> change_direction_;
  std::optional<Vector2> prev_mouse_position;
  Texture2D cut_texture_;
  std::vector<PetalThing> petal_things_;
  long frame_count_ = 0;
  Rectangle window_;
  float fall_speed_;

  void update_position(PetalThing *thing) {
    if (change_direction_(generator_) > 0.95) {
      thing->direction = !thing->direction;
    }

    float next_position = thing->direction ? thing->position.x - 2 : thing->position.x + 2;
    if (next_position <= 0 - (thing->texture.width / 3.0f)) {
      thing->direction = false; // we want to go right, right is false, clearly
      next_position += 4;
    }

    if (next_position >= window_.width - (thing->texture.width / 3.0f)) {
      thing->direction = true;
      next_position -= 4;
    }

    thing->position.x = next_position;

    thing->position.y += fall_speed_;
  }

  bool cut_internal(Vector2 start, Vector2 end) {
    Rectangle rect = {
        .x = thing_.position.x - 2,
        .y = thing_.position.y - 2,
        .width = size_.x + 4,
        .height = size_.y + 4,
    };

    if (CheckCollisionPointRec(start, rect)) {
      return true;
    }

    if (CheckCollisionPointRec(end, rect)) {
      return true;
    }

    Vector2 tl = thing_.position;
    Vector2 tr = {.x = rect.x + rect.width, .y = rect.y};
    Vector2 bl = {.x = rect.x, .y = rect.y + rect.height};
    Vector2 br = {.x = rect.x + rect.width, .y = rect.y + rect.height};

    Vector2 collision_point;

    if (CheckCollisionLines(start, end, tl, tr, &collision_point)) {
      return true;
    }

    if (CheckCollisionLines(start, end, tl, bl, &collision_point)) {
      return true;
    }

    if (CheckCollisionLines(start, end, bl, br, &collision_point)) {
      return true;
    }

    if (CheckCollisionLines(start, end, br, tr, &collision_point)) {
      return true;
    }

    return false;
  }

public:
  ~Petal() = default;
  Petal(Rectangle window, unsigned seed) : window_(window) {
    generator_ = std::mt19937(seed);
    std::uniform_int_distribution<int> speed(0, 80);
    std::uniform_int_distribution<int> x(0, window_.width);
    auto pedal_thing = std::uniform_int_distribution<int>(0, 2);
    int pedal = pedal_thing(generator_);
    std::string file_path = std::format("assets/pedals/{}.png", pedal);
    cut_texture_ = LoadTexture("assets/pedals/cut_pedal.png");
    thing_.texture = LoadTexture(file_path.c_str());
    thing_.position.x = x(generator_);
    thing_.position.y = -thing_.texture.height;
    size_ = {(float)thing_.texture.width, (float)thing_.texture.height};
    color_ = {0xFF, 0xFF, 0xFF, 0xFF};
    fall_speed_ = speed(generator_) / 100.0f;
  }

  Petal(Rectangle window, Vector2 position, int p, float speed = 0.6) : window_(window) {
    std::random_device rd;
    generator_ = std::mt19937(rd());
    change_direction_ = std::uniform_real_distribution<float>();
    thing_.position = position;
    thing_.texture = LoadTexture(std::format("assets/pedals/{}.png", p).c_str());
    cut_texture_ = LoadTexture("assets/pedals/cut_pedal.png");
    size_ = {(float)thing_.texture.width, (float)thing_.texture.height};
    fall_speed_ = speed;
    color_ = {0xFF, 0xFF, 0xFF, 0xFF};
  }

  bool IsCut = false;

  void Cut() {
    IsCut = true;
    petal_things_.push_back(
        PetalThing{
            .texture = cut_texture_,
            .direction = true,
            .position = Vector2{thing_.position.x - 1, thing_.position.y - 1}});

    petal_things_.push_back(
        PetalThing{
            .texture = cut_texture_,
            .direction = false,
            .position = Vector2{thing_.position.x + 1, thing_.position.y - 1}});

    petal_things_.push_back(
        PetalThing{
            .texture = cut_texture_,
            .direction = true,
            .position = Vector2{thing_.position.x - 1, thing_.position.y + 1}});

    petal_things_.push_back(
        PetalThing{
            .texture = cut_texture_,
            .direction = false,
            .position = Vector2{thing_.position.x + 1, thing_.position.y + 1}});
  }

  void Cut(Vector2 start, Vector2 end) {

    if (cut_internal(start, end)) {
      Cut();
    }
  }

  void Update() {
    frame_count_ += 1;
    if (frame_count_ % 2 != 0) {
      return;
    }

    if (IsCut) {
      for (PetalThing &thing : petal_things_) {
        update_position(&thing);
      }

    } else {
      update_position(&thing_);
    }
  }

  void Draw() {
    if (IsCut) {
      for (auto petal : petal_things_) {
        DrawTextureEx(petal.texture, petal.position, 0, 1, color_);
      }
    } else {
      DrawTextureEx(thing_.texture, thing_.position, 0, 1, color_);
    }
  }

  Vector2 GetPosition() { return thing_.position; }
};

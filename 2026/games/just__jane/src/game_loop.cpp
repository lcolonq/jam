#include "raylib.h"
#include <format>
#include <random>
#include <raymath.h>

#include <emscripten/em_types.h>
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <optional>

#include <clock.hpp>
#include <cut.hpp>
#include <game_loop.hpp>
#include <petal.hpp>
#include <score.hpp>
#include <sstream>

static std::uniform_real_distribution<float> rng_ = std::uniform_real_distribution<float>();
std::mt19937 generator_;

static bool initialized;
static bool game_over = false;
static int score;
static int score_to_win;

static std::optional<Cut> the_cut;
static std::optional<Vector2> initial_point;
static std::optional<Vector2> terminal_point;

static bool mouse_is_down;
static bool mouse_is_up;

static Texture2D bg_texture_;
static Texture2D score_petal_texture;
static Texture2D ronin_textures;

static RenderTexture2D draw_target;
static std::vector<Petal> petals;
static std::vector<Petal> tutorial_petals;

static bool tutorial_is_running = true;
static long frame_counter;
static int ronin_anim_frame = 0;
static Vector2 ronin_position = {-40, GAME_HEIGHT - 30};
constexpr Rectangle RONIN_FRAME = {0, 0, 44, 34};

static std::optional<bool> game_started;
static int TUTORIAL_END_FRAME = 90;
static int TUTORIAL_MOVE_START = 10;
static int TUTORIAL_CUT_FRAME = 50;
constexpr int TOTAL_GAME_TIME = 400;
static Clock game_clock(10, Vector2{GAME_WIDTH - 11, GAME_HEIGHT - 11}, TOTAL_GAME_TIME);

static double difficulty = 0.0;

static std::vector<ScorePetal> score_petals;

void RenderFreezeFrames() {
  BeginTextureMode(draw_target);
  if (the_cut) {
    the_cut->Draw();
  }
  EndTextureMode();
}

void RenderDrawTarget() {
  BeginTextureMode(draw_target);
  Rectangle source = Rectangle{
      .x = 0,
      .y = 0,
      .width = (float)bg_texture_.width,
      .height = (float)bg_texture_.height,
  };

  Rectangle dest = Rectangle{
      .x = 0,
      .y = 0,
      .width = GAME_WIDTH,
      .height = GAME_HEIGHT,
  };

  DrawTexturePro(bg_texture_, source, dest, {0, 0}, 0, WHITE);

  for (Petal petal : petals) {
    petal.Draw();
  }

  if (the_cut) {
    the_cut->Draw();
  }

  game_clock.Draw();
  EndTextureMode();
}

EM_BOOL OnGlobalMouse(int event_type, const EmscriptenMouseEvent *mouse_event, void *user_data) {
  if (event_type == EMSCRIPTEN_EVENT_MOUSEDOWN) {
    mouse_is_down = true;
  } else if (event_type == EMSCRIPTEN_EVENT_MOUSEUP) {
    mouse_is_down = false;
    mouse_is_up = true;
  }

  return EM_FALSE;
}

void StartNewGame(bool with_tutorial = true) {
  game_clock.Reset();
  petals.clear();
  tutorial_petals.clear();
  score_petals.clear();

  Rectangle window = Rectangle{.x = 0, .y = 0, .width = GAME_WIDTH, .height = GAME_HEIGHT};
  tutorial_petals.push_back(Petal(window, Vector2{10, -10}, 0));
  tutorial_petals.push_back(Petal(window, Vector2{50, -1}, 0));
  tutorial_petals.push_back(Petal(window, Vector2{70, -5}, 2));
  tutorial_petals.push_back(Petal(window, Vector2{98, 10}, 0, 0.9));
  tutorial_petals.push_back(Petal(window, Vector2{14, 7}, 1));
  tutorial_petals.push_back(Petal(window, Vector2{37, 5}, 1, 0.2));
  tutorial_petals.push_back(Petal(window, Vector2{19, 13}, 0));
  tutorial_petals.push_back(Petal(window, Vector2{39, 19}, 0));
  tutorial_petals.push_back(Petal(window, Vector2{65, 0}, 2, 0.8));
  tutorial_petals.push_back(Petal(window, Vector2{104, 5}, 1));
  tutorial_petals.push_back(Petal(window, Vector2{12, 4}, 0, 0.4));

  game_over = false;
  the_cut = std::nullopt;
  initial_point = std::nullopt;
  terminal_point = std::nullopt;
  score = 0;
  tutorial_is_running = with_tutorial;
  frame_counter = 0;
  ronin_anim_frame = 0;
  ronin_position = {-40, GAME_HEIGHT - 44};
  game_started = true;

  std::random_device rd;
  generator_ = std::mt19937(rd());
}

void InitializeAssets() {
  score_petal_texture = LoadTexture("assets/petals/cut_petal.png");
  bg_texture_ = LoadTexture("assets/background.png");
  ronin_textures = LoadTexture("assets/ronin.png");

  draw_target = LoadRenderTexture(GAME_WIDTH, GAME_HEIGHT);

  emscripten_set_mousedown_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, EM_TRUE, OnGlobalMouse);
  emscripten_set_mouseup_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, nullptr, EM_TRUE, OnGlobalMouse);

  initialized = true;
}

void Draw() {
  ClearBackground(RAYWHITE);

  if (the_cut.has_value() && !the_cut.value().its_joever) {
    RenderFreezeFrames();
  } else {
    RenderDrawTarget();
  }

  Rectangle target_src{
      .x = 0,
      .y = 0,
      .width = GAME_WIDTH,
      .height = -GAME_HEIGHT,
  };

  Rectangle target_dest{
      .x = 0,
      .y = 0,
      .width = GAME_WIDTH * SCALE,
      .height = GAME_HEIGHT * SCALE,
  };

  DrawTexturePro(draw_target.texture, target_src, target_dest, {0, 0}, 0, WHITE);
}

void Update() {
  if (!game_started) {
    game_started = true;
  }

  if (!game_over) {
    game_clock.Update();
    if (game_clock.TimeIsUp() && !the_cut.has_value()) {
      the_cut = Cut(Vector2{0, 0}, Vector2{0, 0});
      game_over = true;
    }

    if (!game_over && the_cut.has_value() && !the_cut.value().its_joever) {
      the_cut->Update();
      return;
    }

    if (!game_over && the_cut.has_value() && the_cut->its_joever) {
      for (Petal &petal : petals) {
        petal.Cut(*initial_point, *terminal_point);
        if (petal.IsCut) {
          score += 1;
          score_petals.push_back(
              ScorePetal{
                  .Position{.x = 20 + (float)score * (score_petal_texture.width + 3), .y = GAME_HEIGHT - 5},
                  .Texture = score_petal_texture});
        }
      }
      post_score(score);
      game_over = true;
    }

    if (!initial_point.has_value() && mouse_is_down) {
      initial_point = Vector2Scale(GetMousePosition(), 1.0f / SCALE);
    }

    if (!terminal_point.has_value() && initial_point.has_value() && mouse_is_up) {
      terminal_point = Vector2Scale(GetMousePosition(), 1.0f / SCALE);
    }

    if (!the_cut.has_value() && initial_point.has_value() && terminal_point.has_value()) {
      Vector2 direction = Vector2Normalize(Vector2Subtract(terminal_point.value(), initial_point.value()));
      terminal_point = Vector2Add(initial_point.value(), Vector2Scale(direction, 70.0f));
      the_cut = Cut(*initial_point, *terminal_point);
    }
  }

  for (Petal &petal : petals) {
    petal.Update();
  }

  if (petals.size() < 20 && rng_(generator_) > .90) {
    std::random_device rd;
    Rectangle window = Rectangle{.x = 0, .y = 0, .width = GAME_WIDTH, .height = GAME_HEIGHT};
    petals.push_back(Petal(window, rd()));
  }

  petals.erase(
      std::remove_if(petals.begin(), petals.end(), [](Petal petal) { return petal.GetPosition().y > GAME_HEIGHT; }),
      petals.end());
}

void UpdateTutorial() {
  for (auto &blossom : tutorial_petals) {
    blossom.Update();
  }

  frame_counter += 1;
  if (frame_counter % 2 != 0) {
    return;
  }

  if (frame_counter > TUTORIAL_END_FRAME) {
    tutorial_is_running = false;
  }

  if (frame_counter > TUTORIAL_MOVE_START) {
    if (ronin_position.x < 10) {
      ronin_position.x += 2;
      return;
    }

    if (ronin_anim_frame < 5) {
      ronin_anim_frame += 1;
      return;
    }
  }

  if (tutorial_petals.size() > 0 && !tutorial_petals[0].IsCut && frame_counter > TUTORIAL_CUT_FRAME) {
    for (auto &blossom : tutorial_petals) {
      blossom.Cut();
    }
  }
}

void RenderTutorialDrawTarget() {
  BeginTextureMode(draw_target);
  Rectangle source = Rectangle{
      .x = 0,
      .y = 0,
      .width = (float)bg_texture_.width,
      .height = (float)bg_texture_.height,
  };

  Rectangle dest = Rectangle{
      .x = 0,
      .y = 0,
      .width = GAME_WIDTH,
      .height = GAME_HEIGHT,
  };

  DrawTexturePro(bg_texture_, source, dest, {0, 0}, 0, WHITE);

  Rectangle src = Rectangle{
      .x = RONIN_FRAME.width * ronin_anim_frame,
      .y = 0,
      .width = RONIN_FRAME.width,
      .height = RONIN_FRAME.height};

  Rectangle ronin_dest =
      Rectangle{.x = ronin_position.x, .y = ronin_position.y, .width = RONIN_FRAME.width, .height = RONIN_FRAME.height};

  DrawTexturePro(ronin_textures, src, ronin_dest, {0, 0}, 0, WHITE);

  for (auto blossom : tutorial_petals) {
    blossom.Draw();
  }

  EndTextureMode();
}

void DrawTutorial() {
  ClearBackground(RAYWHITE);

  RenderTutorialDrawTarget();

  Rectangle target_src{
      .x = 0,
      .y = 0,
      .width = GAME_WIDTH,
      .height = -GAME_HEIGHT,
  };

  Rectangle target_dest{
      .x = 0,
      .y = 0,
      .width = GAME_WIDTH * SCALE,
      .height = GAME_HEIGHT * SCALE,
  };

  Color c = WHITE;
  DrawTexturePro(draw_target.texture, target_src, target_dest, {0, 0}, 0, c);
}

static bool user_started_game = false;
void UpdateStart() {
  if (IsMouseButtonReleased(MOUSE_BUTTON_LEFT)) {
    InitAudioDevice();
    SetAudioStreamBufferSizeDefault(4096);
    user_started_game = true;
  }
}

void DrawStart() {
  ClearBackground(WHITE);
  DrawText("click to start", GAME_WIDTH / 2 - 20, GAME_HEIGHT / 2 - 5, 20, BLACK);
}

void UpdateGameOver() {
  static int counter = 0;
  Update();
  if (counter++ > 120) {
    counter = 0;
    if (score > difficulty) {
      emscripten_run_script("window.parent.postMessage({op: \"done\", win: true});");
    } else {
      emscripten_run_script("window.parent.postMessage({op: \"done\", win: false});");
    }
    initialized = false;
    StartNewGame(false);
  }
}

void DrawGameOver() {
  ClearBackground(WHITE);
  Draw();

  //  std::string text = std::format("SCORE: {}", score);
  //  DrawText(text.c_str(), GAME_WIDTH / 2 - 20, GAME_HEIGHT / 2 - 5, 20, BLACK);
  for (auto petal : score_petals) {
    Vector2 position = {petal.Position.x * SCALE, petal.Position.y * SCALE};
    DrawTextureEx(petal.Texture, position, 0, SCALE, WHITE);
  }
}

void UpdateDrawFrame() {
  if (!initialized) {
    difficulty = EM_ASM_DOUBLE({ return window.lcolonqJamStart || -1.0; });
    if (difficulty < 0.0) {
      return;
    }

    if (difficulty < 3) {
      score_to_win = 2;
    } else if (difficulty < 10) {
      score_to_win = 3;
    } else if (difficulty < 20) {
      score_to_win = 5;
    } else {
      score_to_win = 8;
    }

    std::stringstream ss;
    ss << "window.parent.postMessage({op: \"started\", verb: \"cut" << score_to_win;
    ss << "\" });";
    emscripten_run_script(ss.str().c_str());
    InitializeAssets();
    InitAudioDevice();
    SetAudioStreamBufferSizeDefault(4096);
    StartNewGame();

    initialized = true;
    return;
  }

  if (tutorial_is_running) {
    UpdateTutorial();
    BeginDrawing();
    DrawTutorial();
    EndDrawing();
    return;
  }

  if (game_over) {
    UpdateGameOver();
    BeginDrawing();
    DrawGameOver();
    EndDrawing();
    return;
  }

  Update();
  BeginDrawing();
  Draw();
  EndDrawing();
}

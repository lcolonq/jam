use crate::color::EntityColor;
use wasm_bindgen::prelude::wasm_bindgen;

pub const HEIGHT: u32 = 160;
pub const WIDTH: u32 = 240;
pub const LANDING_TEXTURE_HEIGHT: i32 = 160;
pub const LANDING_TEXTURE_WIDTH: i32 = 240;
pub const MUTE_ICON_SIZE: f32 = 16.0;
pub const MUTE_ICON_MARGIN: f32 = 0.0;

pub const GAME_DURATION_MS: u32 = 15_000;
pub const NB_GREENS: i32 = 15;
pub const INITIAL_SPAWN: u32 = 8;
pub const MAX_ENTITIES: u32 = 40;
pub const BASE_SPEED: f32 = 24.0;
pub const SPEED_COLLIDE_MULT: f32 = 2.0;
pub const ENTITY_RADIUS: f32 = 4.8;
pub const INITIAL_SPAWN_SPREAD_MS: f32 = 1_000.0;
pub const SPAWN_RATE_MIN_MS: u32 = 500;
pub const SPAWN_RATE_MAX_MS: u32 = 1_200;
pub const DAMPING_FACTOR: f32 = 0.98;
pub const JITTER_STRENGTH: f32 = 0.12;
pub const MIN_SPEED: f32 = 2.6;
pub const MAX_SPEED: f32 = 64.0;
pub const SPAWN_PADDING: f32 = 1.0;
pub const ENTITY_SCALE_FACTOR: f32 = 1.5;
pub const RED_COUNTDOWN_MS: f32 = 3_000.0;
pub const ROGUE_DURATION_MS: f32 = 3_000.0;
pub const PACMAN_CHASE_PROB: f64 = 0.30;
pub const PACMAN_CHASE_SPEED_MULT: f32 = 1.5;

pub const BASELINE_RATIOS: [f32; 4] = {
    let mut b = [0.0f32; 4];
    b[EntityColor::Red as usize] = 0.10;
    b[EntityColor::Green as usize] = 0.60;
    b[EntityColor::Bleu as usize] = 0.10;
    b[EntityColor::Yellow as usize] = 0.20;
    b
};

pub const fn get_baseline_ratio(color: EntityColor, difficulty: f32) -> f32 {
    const SHIFT_PER_LEVEL: f32 = 0.15;
    const GREEN_FLOOR: f32 = 0.05;

    let green_base = BASELINE_RATIOS[EntityColor::Green as usize];
    let red_base = BASELINE_RATIOS[EntityColor::Red as usize];

    // how much we can actually shift without breaching the green floor.
    let max_shift = green_base - GREEN_FLOOR;
    let shift = (SHIFT_PER_LEVEL * (difficulty - 1.0).max(0.0)).min(max_shift);

    match color {
        EntityColor::Green => green_base - shift,
        EntityColor::Red => red_base + shift,
        // Bleu and Yellow stay fixed; only the Green/Red tension is modulated.
        c => BASELINE_RATIOS[c as usize],
    }
}

// UI constants
pub const TITLE_HEADING_TEXT_COLOR: glam::Vec3 = glam::Vec3::new(0.105, 0.262, 0.196);
pub const TITLE_DESCRIPTION_TEXT_COLOR: glam::Vec3 = glam::Vec3::new(0.184, 0.321, 0.2);
pub const START_BUTTON_TEXT_COLOR: glam::Vec3 = glam::Vec3::new(1.0, 1.0, 1.0);
pub const TITLE_START_BUTTON_LABEL: &str = "START";
pub fn title_score_goal() -> String {
    format!("Score {} or more to win", NB_GREENS)
}
pub const TITLE_CLICK_START_HINT: &str = "Click START to begin the 15s* round.";
//pub const TITLE_ROUND_WARNING: &str = "(*in this computer seconds might be longer, TBI)";
pub const TITLE_SCORING_HINT: &str = "Green gives +1, all other colors give -1.";
pub const TITLE_HINT: &str = "hint: booting the computer is optional.";

pub const HUD_TEXT_COLOR: glam::Vec3 = glam::Vec3::new(0.2, 0.2, 0.2);
pub const HUD_SCORE_LABEL_PREFIX: &str = "Score: ";
pub const HUD_TIME_LABEL_PREFIX: &str = "Time: ";
pub const HUD_TIME_LABEL_SUFFIX: &str = "s";
pub const HUD_FPS_LABEL_PREFIX: &str = "FPS: ";
pub const HUD_SCORE_POSITION: glam::Vec2 = glam::Vec2::new(2.6, 6.6);
pub const HUD_FPS_POSITION: glam::Vec2 = glam::Vec2::new(2.6, 20.0);
pub const RESULT_DISPLAY_DELAY_MS: f64 = 2000.0;
#[wasm_bindgen]
pub fn get_result_display_delay_ms() -> f64 {
    RESULT_DISPLAY_DELAY_MS
}

// UI rendering colors and uniforms
pub const RED_COUNTDOWN_BAR_COLOR: glam::Vec4 = glam::Vec4::new(1.0, 0.266, 0.266, 1.0);
pub const BUTTON_FILL_COLOR: glam::Vec4 = glam::Vec4::new(0.0, 0.0, 1.0, 0.9);
pub const GAME_OVER_OVERLAY_COLOR: glam::Vec4 = glam::Vec4::new(1.0, 1.0, 1.0, 0.82);
pub const UI_UNIFORM_COLOR_NAME: &str = "color";
pub const UI_UNIFORM_OPACITY_NAME: &str = "opacity";
pub const FLASH_SCREEN_BASE_COLOR: glam::Vec3 = glam::Vec3::new(1.0, 0.0, 0.0);
pub const GAME_OVER_TEXT_COLOR: glam::Vec3 = glam::Vec3::new(0.105, 0.262, 0.196);
pub const GAME_OVER_TITLE_TEXT: &str = "Game Over";
pub const GAME_OVER_RESULT_PREFIX: &str = "Result: ";

// computer
pub const COMPUTER_WIDTH: f32 = 42.6;
pub const COMPUTER_HEIGHT: f32 = 42.6;
pub const TRIGGER_OFFSET_X: f32 = 9.8;
pub const TRIGGER_OFFSET_Y: f32 = 4.0;
pub const TRIGGER_WIDTH: f32 = 8.0;
pub const TRIGGER_HEIGHT: f32 = 6.1;
pub const POWER_BUTTON_OFFSET_X: f32 = 28.8;
pub const POWER_BUTTON_OFFSET_Y: f32 = 2.6;
pub const POWER_BUTTON_WIDTH: f32 = 9.6;
pub const POWER_BUTTON_HEIGHT: f32 = 5.8;

// Subgame

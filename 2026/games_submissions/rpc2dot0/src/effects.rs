use crate::color::EntityColor;
use crate::constants::*;

#[derive(Debug, Clone)]
pub struct PacmanChase {
    pub speed: f32,
}

impl PacmanChase {
    pub fn new(speed: f32) -> Self {
        Self { speed }
    }
}

impl Default for PacmanChase {
    fn default() -> Self {
        Self::new(BASE_SPEED)
    }
}
#[derive(Debug, Clone)]
pub struct Rogue {
    pub until_ms: f32,
    pub hover_color: EntityColor,
}

impl Rogue {
    pub fn new(until_ms: f32, hover_color: EntityColor) -> Self {
        Self {
            until_ms,
            hover_color,
        }
    }
}

impl Default for Rogue {
    fn default() -> Self {
        Self::new(ROGUE_DURATION_MS, EntityColor::Yellow)
    }
}

pub struct Explosion {
    pub x: f32,
    pub y: f32,
    pub age_ms: f32,
    pub duration_ms: f32,
    pub radius: f32,
}
impl Explosion {
    pub fn new(x: f32, y: f32) -> Self {
        Self {
            x,
            y,
            age_ms: 0.0,
            duration_ms: 400.0,
            radius: 8.0,
        }
    }
}

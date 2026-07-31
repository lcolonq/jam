use crate::color::EntityColor;
use crate::constants::{DAMPING_FACTOR, MIN_SPEED};
use crate::effects::{PacmanChase, Rogue};
use crate::math::{BoundingCircle, Vec2};

pub trait Update {
    fn update(&mut self, delta_ms: f32);
}

#[derive(Debug, Clone)]
pub struct Entity {
    pub _id: u32,
    pub pos: Vec2,
    pub vel: Vec2,
    pub speed: f32,
    pub color: EntityColor,
    pub radius: f32,
    pub alive: bool,
    pub spawn_time_ms: Option<f32>,
    pub rogue: Option<Rogue>,
    pub pacman_chase: Option<PacmanChase>,
}

impl Entity {
    pub fn new(id: u32, pos: Vec2, vel: Vec2, color: EntityColor, speed: f32, radius: f32) -> Self {
        let mut entity = Self {
            _id: id,
            pos,
            vel,
            speed,
            color,
            radius,
            alive: true,
            spawn_time_ms: None,
            rogue: None,
            pacman_chase: None,
        };
        entity.normalize_velocity();
        entity
    }

    pub fn normalize_velocity(&mut self) {
        let length = self.vel.length();
        if length <= f32::EPSILON {
            self.vel = Vec2::new(1.0, 0.0);
        } else {
            self.vel = self.vel / length * self.speed;
        }
    }

    pub fn apply_jitter(&mut self, jitter: Vec2) {
        self.vel += jitter;
        self.normalize_velocity();
    }

    pub fn dampen_speed(&mut self, max_speed: f32) {
        self.speed = (self.speed * DAMPING_FACTOR).clamp(MIN_SPEED, max_speed);
        self.normalize_velocity();
    }

    pub fn bounds_bounce(&mut self, width: f32, height: f32) {
        let min_bounds = Vec2::splat(self.radius);
        let max_bounds = Vec2::new(width, height) - min_bounds;

        let hit_min = self.pos.cmple(min_bounds);
        let hit_max = self.pos.cmpge(max_bounds);

        self.pos = self.pos.clamp(min_bounds, max_bounds);

        self.vel = Vec2::select(hit_min, self.vel.abs(), self.vel);
        self.vel = Vec2::select(hit_max, -self.vel.abs(), self.vel);
    }
}

impl Update for Entity {
    fn update(&mut self, delta_ms: f32) {
        let dt = delta_ms / 1000.0;
        self.pos += self.vel * dt;
    }
}

impl BoundingCircle for Entity {
    fn center(&self) -> Vec2 {
        self.pos
    }

    fn radius(&self) -> f32 {
        self.radius
    }
}

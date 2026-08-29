use crate::collision::process_collisions;
use crate::color::EntityColor;
use crate::computer::ComputerPhase;
use crate::constants::{
    BASE_SPEED, ENTITY_RADIUS, ENTITY_SCALE_FACTOR, GAME_DURATION_MS, INITIAL_SPAWN,
    INITIAL_SPAWN_SPREAD_MS, JITTER_STRENGTH, MAX_ENTITIES, MAX_SPEED, PACMAN_CHASE_PROB,
    PACMAN_CHASE_SPEED_MULT, RED_COUNTDOWN_MS, ROGUE_DURATION_MS, SPAWN_PADDING, SPAWN_RATE_MAX_MS,
    SPAWN_RATE_MIN_MS,
};
use crate::effects::{PacmanChase, Rogue};
use crate::entity::{Entity, Update};
use crate::errors::ClickOutcome;
use crate::math::Vec2;
use crate::random::RandomState;

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum GamePhase {
    Waiting,
    Playing,
    Computer(ComputerPhase),
    Finished,
}

impl GamePhase {
    #[allow(dead_code)]
    pub fn phase(&self) -> &'static str {
        match self {
            GamePhase::Waiting => "waiting",
            GamePhase::Playing => "playing",
            GamePhase::Computer(_) => "computer",
            GamePhase::Finished => "finished",
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum RoundResult {
    Ok,
    Ko,
}

impl From<RoundResult> for &'static str {
    fn from(value: RoundResult) -> Self {
        match value {
            RoundResult::Ok => "Ok",
            RoundResult::Ko => "Ko",
        }
    }
}

impl From<RoundResult> for bool {
    fn from(value: RoundResult) -> Self {
        match value {
            RoundResult::Ok => true,
            RoundResult::Ko => false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct GameState {
    consumer_score: i32,
    pub(crate) elapsed_ms: f32,
    phase: GamePhase,
    pub(crate) entities: Vec<Entity>,
    pub(crate) next_entity_id: u32,
    pub(crate) rng: RandomState,
    spawn_timer_ms: f32,
    initial_spawn_remaining: u32,
    next_spawn_delay_ms: f32,
    pub(crate) collision_buffer: Vec<(usize, usize)>,
    pub(crate) events: Vec<String>,
    pub(crate) difficulty: f32,
}

impl Default for GameState {
    fn default() -> Self {
        Self::new()
    }
}

impl GameState {
    pub fn new() -> Self {
        Self {
            consumer_score: 0,
            elapsed_ms: 0.0,
            phase: GamePhase::Waiting,
            entities: Vec::new(),
            next_entity_id: 1,
            #[cfg(debug_assertions)]
            rng: RandomState::new(0x67676767),
            #[cfg(not(debug_assertions))]
            rng: RandomState::new((js_sys::Date::now() as u64) as usize),
            spawn_timer_ms: 0.0,
            initial_spawn_remaining: INITIAL_SPAWN,
            next_spawn_delay_ms: (INITIAL_SPAWN_SPREAD_MS / INITIAL_SPAWN as f32).max(1.0),
            collision_buffer: Vec::new(),
            events: Vec::new(),
            difficulty: 1.0,
        }
    }

    pub fn set_difficulty(&mut self, difficulty: f32) {
        self.difficulty = difficulty;
    }

    pub fn game_duration_ms(&self) -> f32 {
        GAME_DURATION_MS as f32 / self.difficulty
    }

    pub fn required_greens(&self) -> i32 {
        5.max((15.0 / self.difficulty.sqrt()).round() as i32)
    }

    pub const fn base_speed(&self) -> f32 {
        BASE_SPEED * self.difficulty
    }

    pub fn max_speed(&self) -> f32 {
        MAX_SPEED * self.difficulty
    }

    pub fn spawn_rate_min_ms(&self) -> u32 {
        (SPAWN_RATE_MIN_MS as f32 / self.difficulty) as u32
    }

    pub fn spawn_rate_max_ms(&self) -> u32 {
        (SPAWN_RATE_MAX_MS as f32 / self.difficulty) as u32
    }

    pub fn entity_radius(&self) -> f32 {
        ENTITY_RADIUS / (1.0 + (self.difficulty - 1.0) * 0.25)
    }

    pub fn start_round(&mut self) {
        self.consumer_score = 0;
        self.elapsed_ms = 0.0;
        self.phase = GamePhase::Playing;
        self.entities.clear();
        self.next_entity_id = 1;
        self.spawn_timer_ms = 0.0;
        self.initial_spawn_remaining = INITIAL_SPAWN;
        self.next_spawn_delay_ms = (INITIAL_SPAWN_SPREAD_MS / INITIAL_SPAWN as f32).max(1.0);
        self.events.clear();
    }
    pub fn set_phase(&mut self, phase: GamePhase) {
        self.phase = phase;
    }
    /*
    pub fn boot_computer(&mut self) {
        if self.phase == GamePhase::Playing {
            self.phase = GamePhase::Computer(ComputerPhase::Booting);
        }
    }

    pub fn shutdown_computer(&mut self) {
        if self.phase == GamePhase::Computer(ComputerPhase::On) {
            self.phase = GamePhase::Computer(ComputerPhase::ShutDown);
        }
    }
    */

    pub fn spawn_entity(
        &mut self,
        pos: Vec2,
        vel: Vec2,
        color: EntityColor,
        disquette_inserted: bool,
    ) {
        if self.get_entity_count() >= MAX_ENTITIES {
            return;
        }
        let speed = self.base_speed();
        let radius = self.entity_radius() * ENTITY_SCALE_FACTOR;
        let mut entity = Entity::new(self.next_entity_id, pos, vel, color, speed, radius);
        if color == EntityColor::Red {
            entity.spawn_time_ms = Some(self.elapsed_ms);
        }
        if color == EntityColor::Green {
            let base_prob = 0.25;
            let prob = (base_prob * self.difficulty).min(0.85);
            if self.rng.next_bool(prob as f64) {
                let rogue_duration = ROGUE_DURATION_MS / self.difficulty;
                let mut hover_color = self.rng.random_color();
                while hover_color == EntityColor::Green {
                    hover_color = self.rng.random_color();
                }
                entity.rogue = Some(Rogue::new(self.elapsed_ms + rogue_duration, hover_color));
            }
        }

        if !disquette_inserted
            && color == EntityColor::Bleu
            && self.rng.next_bool(PACMAN_CHASE_PROB)
        {
            let chase_speed = self.base_speed() * PACMAN_CHASE_SPEED_MULT;
            entity.pacman_chase = Some(PacmanChase::new(chase_speed));
        }
        self.next_entity_id = self.next_entity_id.wrapping_add(1);
        self.entities.push(entity);
    }
    pub fn update_entities(
        &mut self,
        delta_ms: f32,
        area_width: f32,
        area_height: f32,
        disquette_inserted: bool,
        disquette_pos: Option<Vec2>,
    ) {
        self.update_spawning(delta_ms, area_width, area_height, disquette_inserted);

        let current_max_speed = self.max_speed();
        for entity in &mut self.entities {
            if !entity.alive {
                continue;
            }
            if let Some(chase) = &entity.pacman_chase {
                if let Some(target) = disquette_pos {
                    let dx = target.x - entity.pos.x;
                    let dy = target.y - entity.pos.y;
                    let dist = (dx * dx + dy * dy).sqrt();
                    if dist > f32::EPSILON {
                        entity.vel.x = (dx / dist) * chase.speed;
                        entity.vel.y = (dy / dist) * chase.speed;
                    }
                } else {
                    entity.apply_jitter(Vec2::new(
                        self.rng.next_range(-JITTER_STRENGTH, JITTER_STRENGTH),
                        self.rng.next_range(-JITTER_STRENGTH, JITTER_STRENGTH),
                    ));
                }
            } else {
                entity.apply_jitter(Vec2::new(
                    self.rng.next_range(-JITTER_STRENGTH, JITTER_STRENGTH),
                    self.rng.next_range(-JITTER_STRENGTH, JITTER_STRENGTH),
                ));
            }

            entity.update(delta_ms);
            entity.dampen_speed(current_max_speed);
            entity.bounds_bounce(area_width, area_height);
        }
        if let Some(target) = disquette_pos {
            const DISQUETTE_HALF_SIZE: f32 = 3.2;
            let mut consumed = false;
            for entity in &self.entities {
                if entity.alive
                    && entity.pacman_chase.is_some()
                    && entity.pos.distance_squared(target)
                        <= (entity.radius + DISQUETTE_HALF_SIZE).powi(2)
                {
                    consumed = true;
                    break;
                }
            }
            if consumed {
                self.events.push("disquette_consumed".to_string());
            }
        }

        process_collisions(
            &mut self.entities,
            &mut self.rng,
            &mut self.next_entity_id,
            &mut self.collision_buffer,
            self.elapsed_ms,
            &mut self.events,
        );

        // Check red countdown timers (explode if expired)
        let mut greens_to_kill = false;
        for entity in &mut self.entities {
            if entity.alive
                && entity.color == EntityColor::Red
                && let Some(spawn_time) = entity.spawn_time_ms
                && self.elapsed_ms >= spawn_time + RED_COUNTDOWN_MS
            {
                entity.alive = false;
                self.events
                    .push(format!("explode:{},{}", entity.pos.x, entity.pos.y));
                greens_to_kill = true;
            }
        }
        if greens_to_kill {
            for entity in &mut self.entities {
                if entity.alive && entity.color == EntityColor::Green {
                    entity.alive = false;
                }
            }
        }

        self.entities.retain(|e| e.alive);
    }

    pub fn entities(&self) -> &[Entity] {
        &self.entities
    }

    fn schedule_next_spawn(&mut self) {
        self.next_spawn_delay_ms = if self.initial_spawn_remaining > 0 {
            (INITIAL_SPAWN_SPREAD_MS / INITIAL_SPAWN as f32).max(1.0)
        } else {
            self.rng
                .next_range(
                    self.spawn_rate_min_ms() as f32,
                    self.spawn_rate_max_ms() as f32,
                )
                .round()
                .max(1.0)
        };
    }

    fn position_overlaps(&self, pos: Vec2) -> bool {
        let scaled_radius = self.entity_radius() * ENTITY_SCALE_FACTOR;
        self.entities.iter().any(|entity| {
            let distance_sq = entity.pos.distance_squared(pos);
            distance_sq < (entity.radius + scaled_radius + SPAWN_PADDING).powi(2)
        })
    }

    fn generate_spawn_position(&mut self, area_width: f32, area_height: f32) -> Vec2 {
        let scaled_radius = self.entity_radius() * ENTITY_SCALE_FACTOR;
        const MAX_ATTEMPTS: usize = 16;
        for _ in 0..MAX_ATTEMPTS {
            let pos = Vec2::new(
                self.rng
                    .next_range(scaled_radius, area_width - scaled_radius),
                self.rng
                    .next_range(scaled_radius, area_height - scaled_radius),
            );
            if !self.position_overlaps(pos) {
                return pos;
            }
        }
        Vec2::new(
            self.rng
                .next_range(scaled_radius, area_width - scaled_radius),
            self.rng
                .next_range(scaled_radius, area_height - scaled_radius),
        )
    }

    fn spawn_random_entity(&mut self, area_width: f32, area_height: f32, disquette_inserted: bool) {
        if self.get_entity_count() >= MAX_ENTITIES {
            return;
        }

        let pos = self.generate_spawn_position(area_width, area_height);
        let dir = self.rng.next_unit_vector();
        let vel = dir * self.base_speed();

        let mut color_counts = [0u32; 4];
        for entity in &self.entities {
            if entity.alive {
                color_counts[entity.color as usize] += 1;
            }
        }
        let color = self.rng.random_color_biased(color_counts, self.difficulty);
        self.spawn_entity(pos, vel, color, disquette_inserted);
    }

    fn update_spawning(
        &mut self,
        delta_ms: f32,
        area_width: f32,
        area_height: f32,
        disquette_inserted: bool,
    ) {
        if self.phase != GamePhase::Playing || area_width <= 0.0 || area_height <= 0.0 {
            return;
        }

        self.spawn_timer_ms += delta_ms;
        while self.spawn_timer_ms >= self.next_spawn_delay_ms {
            self.spawn_timer_ms -= self.next_spawn_delay_ms;
            if self.get_entity_count() >= MAX_ENTITIES {
                self.spawn_timer_ms = 0.0;
                break;
            }

            if self.initial_spawn_remaining > 0 {
                self.spawn_random_entity(area_width, area_height, disquette_inserted);
                self.initial_spawn_remaining = self.initial_spawn_remaining.saturating_sub(1);
            } else {
                self.spawn_random_entity(area_width, area_height, disquette_inserted);
            }

            self.schedule_next_spawn();
        }
    }

    fn entity_at_point(&self, point: Vec2) -> Option<usize> {
        self.entities
            .iter()
            .enumerate()
            .rev()
            .find(|(_, e)| e.alive && e.pos.distance_squared(point) <= e.radius * e.radius)
            .map(|(idx, _)| idx)
    }

    pub fn click_at(&mut self, x: f32, y: f32) -> Option<ClickOutcome> {
        //log::info!("eatyourgreens:: click_at(x={x},y={y})");
        if self.phase != GamePhase::Playing {
            return None;
        }

        let target = self.entity_at_point(Vec2::new(x, y));
        if let Some(idx) = target {
            let color = self.entities[idx].color;

            let mut effective_color = color;
            if color == EntityColor::Green
                && let Some(rogue) = &self.entities[idx].rogue
                && self.elapsed_ms < rogue.until_ms
            {
                effective_color = rogue.hover_color;
            }

            self.entities[idx].alive = false;
            match effective_color {
                EntityColor::Green => self.change_score(1),
                EntityColor::Yellow | EntityColor::Red | EntityColor::Bleu => self.change_score(-1),
            }

            if effective_color == EntityColor::Red {
                self.events.push(format!("click_red:{},{}", x, y));
            }
            return Some(ClickOutcome::Hit(effective_color));
        }
        Some(ClickOutcome::Miss)
    }

    pub fn consumer_score(&self) -> i32 {
        self.consumer_score
    }

    pub fn elapsed_ms(&self) -> f32 {
        self.elapsed_ms
    }

    pub fn remaining_ms(&self) -> f32 {
        self.game_duration_ms() - self.elapsed_ms
    }

    pub fn phase(&self) -> GamePhase {
        self.phase
    }

    pub fn round_result(&self) -> RoundResult {
        if self.consumer_score >= self.required_greens() {
            RoundResult::Ok
        } else {
            RoundResult::Ko
        }
    }

    pub fn advance_time(&mut self, delta_ms: f32) {
        if self.phase != GamePhase::Playing {
            return;
        }

        self.elapsed_ms += delta_ms;
        let duration = self.game_duration_ms();
        if self.elapsed_ms >= duration {
            self.elapsed_ms = duration;
            self.phase = GamePhase::Finished;
        }
    }

    pub fn drain_events(&mut self) -> Vec<String> {
        std::mem::take(&mut self.events)
    }

    pub fn get_entity_count(&self) -> u32 {
        self.entities.iter().filter(|e| e.alive).count() as u32
    }

    pub fn change_score(&mut self, delta: i32) {
        if self.phase != GamePhase::Playing {
            return;
        }
        self.consumer_score = self.consumer_score.saturating_add(delta);
    }
}

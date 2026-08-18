use crate::math::{ContainsPoint, Rectangle};
use crate::random::RandomState;
use teleia::state;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DisquettePhase {
    Free,
    Inserted,
}

impl From<DisquettePhase> for &'static str {
    fn from(value: DisquettePhase) -> Self {
        match value {
            DisquettePhase::Free => "Free",
            DisquettePhase::Inserted => "Inserted",
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Disquette {
    pub coord: glam::Vec2,
    pub vel: glam::Vec2,
    pub size: f32,
    pub phase: DisquettePhase,
}

impl Disquette {
    pub fn new(
        logical_width: f32,
        logical_height: f32,
        rng: &mut RandomState,
        computer_hitzone: Option<Rectangle>,
    ) -> Self {
        const SIZE: f32 = 6.4;
        const HALF: f32 = SIZE / 2.0;
        log::info!(
            "eatyourgreens:: Disquette new at ({}, {})",
            logical_width,
            logical_height
        );

        let x = rng.next_range(HALF, logical_width - HALF);
        let y = rng.next_range(HALF, logical_height - HALF);
        let mut coord = glam::Vec2::new(x, y);

        // prevent spawning inside the computer hitzone
        // this is a bit stupidos, but it works for now.
        // @TODO: find a better way to do this. like using rng api (random.rs) where you can
        // specify the excluded area, or something less retarded.
        if let Some(hitzone) = computer_hitzone {
            // wasting few cpu cycles doesn't hurt anybody
            while hitzone.contains(coord) {
                coord.x = rng.next_range(HALF, logical_width - HALF);
                coord.y = rng.next_range(HALF, logical_height - HALF);
            }
        }

        Self {
            coord,
            vel: glam::Vec2::new(
                // -/+ 21.3 as value cause it works, yeah idc
                if rng.next_bool(0.5) { 21.3 } else { -21.3 },
                if rng.next_bool(0.5) { 21.3 } else { -21.3 },
            ),
            size: SIZE,
            phase: DisquettePhase::Free,
        }
    }

    pub fn is_inserted(&self) -> bool {
        self.phase == DisquettePhase::Inserted
    }

    pub fn update(
        &mut self,
        width: f32,
        height: f32,
        keys: &state::Keys,
        delta_ms: f32,
        difficulty: f32,
        computer_hitzone: Option<Rectangle>,
    ) {
        let dt = delta_ms / 1000.0;
        let impulse = 106.7 * difficulty;

        let driven_by_user = keys.left() || keys.right() || keys.up() || keys.down();

        if keys.left() {
            self.vel.x -= impulse * dt;
        }
        if keys.right() {
            self.vel.x += impulse * dt;
        }
        if keys.up() {
            self.vel.y -= impulse * dt;
        }
        if keys.down() {
            self.vel.y += impulse * dt;
        }

        // speed limiting
        // @TODO : hum value below was adjusted manualy it might
        // be wrong with game rendering speed? ??
        let max_speed = 53.3 * difficulty;
        let speed = self.vel.length();
        if speed > max_speed {
            self.vel = self.vel.normalize() * max_speed;
        }

        self.coord += self.vel * dt;

        let half = self.size / 2.0;
        let min_bounds = glam::Vec2::splat(half);
        let max_bounds = glam::Vec2::new(width - half, height - half);

        // boundary collision and bouncing
        // left edge : clamp position and ensure it moves right
        if self.coord.x < min_bounds.x {
            self.coord.x = min_bounds.x;
            // .abs() guarantees velocity is positive (moving right)
            self.vel.x = self.vel.x.abs();
        }
        // right edge : clamp position and ensure it moves left
        else if self.coord.x > max_bounds.x {
            self.coord.x = max_bounds.x;
            // -.abs() guarantees velocity is negative (moving left)
            self.vel.x = -self.vel.x.abs();
        }

        // top and bottom edges
        if self.coord.y < min_bounds.y {
            self.coord.y = min_bounds.y;
            // .abs() guarantees velocity is positive (moving down)
            self.vel.y = self.vel.y.abs();
        } else if self.coord.y > max_bounds.y {
            self.coord.y = max_bounds.y;
            // -.abs() guarantees velocity is negative (moving up)
            self.vel.y = -self.vel.y.abs();
        }

        // bounce off computer hitzone unless user is actively driving it in
        if !driven_by_user && let Some(hitzone) = computer_hitzone {
            let prev_pos = self.coord - self.vel * dt;

            if hitzone.contains(self.coord) {
                let was_outside = !hitzone.contains(prev_pos);
                if was_outside {
                    let was_left = prev_pos.x < hitzone.min.x;
                    let was_right = prev_pos.x > hitzone.max.x;
                    let was_top = prev_pos.y < hitzone.min.y;
                    let was_bottom = prev_pos.y > hitzone.max.y;

                    if was_left || was_right {
                        // reverse horizontal velocity to bounce off
                        self.vel.x = -self.vel.x;
                        // +/- 0.1 is a tiny extra push away from the hitzone.
                        // this prevent the disquette from getting stuck exactly on the boundary
                        // and repeatedly triggers collisions
                        // this bug took 2h from my life, fuck you disquette, you floppy disk :/.
                        self.coord.x = if was_left {
                            hitzone.min.x - 0.1
                        } else {
                            hitzone.max.x + 0.1
                        };
                    }
                    if was_top || was_bottom {
                        // reverse vertical velocity to bounce off
                        self.vel.y = -self.vel.y;
                        // +/- 0.1 adds a tiny gap to safely escape the hitzone
                        self.coord.y = if was_top {
                            hitzone.min.y - 0.1
                        } else {
                            hitzone.max.y + 0.1
                        };
                    }
                }
            }
        }
    }
}

// the hours spent on this zone/bouncing detection bs, I should've done something more productive, but
// whatever.

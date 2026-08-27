use crate::constants::*;
use crate::disquette::Disquette;
use crate::game::Game;
use crate::math::ContainsPoint;
use crate::math::Rectangle;
use crate::random::RandomState;

pub mod os;

use os::Os;
use teleia::context;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComputerPhase {
    Off,
    Booting,
    On,
    ShutDown,
}

impl From<ComputerPhase> for &'static str {
    fn from(value: ComputerPhase) -> Self {
        match value {
            ComputerPhase::Off => "Off",
            ComputerPhase::Booting => "Booting",
            ComputerPhase::On => "On",
            ComputerPhase::ShutDown => "ShutDown",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PowerButtonAction {
    On,
    Off,
}

impl From<PowerButtonAction> for &'static str {
    fn from(value: PowerButtonAction) -> Self {
        match value {
            PowerButtonAction::On => "On",
            PowerButtonAction::Off => "Off",
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Computer {
    pub coord: glam::Vec2,
    pub phase: ComputerPhase,
    pub disquette: Disquette,
    pub os: Os,
}

impl Computer {
    pub fn new(
        logical_width: f32,
        logical_height: f32,
        rng: &mut RandomState,
        difficulty: f32,
    ) -> Self {
        const HALF_W: f32 = COMPUTER_WIDTH / 2.0;
        const HALF_H: f32 = COMPUTER_HEIGHT / 2.0;
        let x = rng.next_range(HALF_W, logical_width - HALF_W);
        let y = rng.next_range(HALF_H, logical_height - HALF_H);
        log::info!("eatyourgreens:: Computer new at ({}, {}) ", x, y);
        let mut temp = Self {
            coord: glam::Vec2::new(x, y),
            phase: ComputerPhase::Off,
            disquette: Disquette {
                coord: glam::Vec2::ZERO,
                vel: glam::Vec2::ZERO,
                size: 0.0,
                phase: crate::disquette::DisquettePhase::Free,
            },
            os: Os::from(ComputerPhase::Off),
        };

        let hitzone = temp.hit_zone(difficulty);
        temp.disquette = Disquette::new(logical_width, logical_height, rng, Some(hitzone));
        temp
    }

    pub fn disquette_inserted(&self) -> bool {
        self.disquette.is_inserted()
    }

    pub fn boot(&mut self) {
        log::info!("eatyourgreens:: computer boot");
        self.phase = ComputerPhase::Booting;
        self.os = Os::from(self.phase);
    }

    pub fn on(&mut self, ctx: &context::Context) {
        log::info!("eatyourgreens:: computer on");
        self.phase = ComputerPhase::On;
        self.os.set(self.phase);
        self.os.os_play(&ctx);
    }

    pub fn shutdown(&mut self) {
        log::info!("eatyourgreens:: computer shutdown");
        self.phase = ComputerPhase::Off;
        self.os.set(self.phase);
    }

    pub fn already_used(&self) -> bool {
        self.phase != ComputerPhase::Off
    }

    //
    // hitzone calculation
    //
    // computer pos is (x, y)so its center.
    // first find the top-left corner of the computer bbox.
    // second define "hitzone" as the inner rectangle offset from that top-left corner.

    // us diffculity to shrink the area, so user msut aim better at higher difficulties

    //   topleft(x -width/2 , y-height/2)
    //      +------------------------------------------+  ---
    //      |                                          |   |
    //      |     TRIGGER_OFFSET_Y                     |   |
    //      |     v                                    |   | COMPUTER_HEIGHT
    //      | -> +----------------------------+ ---    |   |
    //      | ^  |        diff_y              |  |     |   |
    //      | |  | -> +---------------+ ---   |  |     |   |
    //      | |  | ^  |               |  |    |  | TRIGGER_HEIGHT
    //      | |  | |  | Actual Hit    |actual_|  |     |   |
    //      | |  | |  | Zone (shrunk) |height |  |     |   |
    //      | |  | |  +---------------+ ---   |  |     |   |
    //      | |  | diff_x                     |  |     |   |
    //      | |  +----------------------------+ ---    |   |
    //      | |                                        |   |
    //      | TRIGGER_OFFSET_X                         |   |
    //      +------------------------------------------+  ---
    //      |--------------COMPUTER_WIDTH--------------|

    pub fn hit_zone(&self, difficulty: f32) -> Rectangle {
        let topleft = self.coord - glam::Vec2::new(COMPUTER_WIDTH / 2.0, COMPUTER_HEIGHT / 2.0);

        let size_multiplier = 1.0 / difficulty.max(1.0);
        let actual_size = glam::Vec2::new(TRIGGER_WIDTH, TRIGGER_HEIGHT) * size_multiplier;

        let diff = (glam::Vec2::new(TRIGGER_WIDTH, TRIGGER_HEIGHT) - actual_size) / 2.0;

        let trigger_pos = topleft + glam::Vec2::new(TRIGGER_OFFSET_X, TRIGGER_OFFSET_Y) + diff;

        Rectangle::from_min_max(trigger_pos, trigger_pos + actual_size)
    }

    pub fn check_power_button(
        &self,
        point: glam::Vec2,
        difficulty: f32,
    ) -> Option<PowerButtonAction> {
        let topleft = self.coord - glam::Vec2::new(COMPUTER_WIDTH / 2.0, COMPUTER_HEIGHT / 2.0);
        let pb_pos = topleft + glam::Vec2::new(POWER_BUTTON_OFFSET_X, POWER_BUTTON_OFFSET_Y);
        let pb_size = glam::Vec2::new(POWER_BUTTON_WIDTH, POWER_BUTTON_HEIGHT);

        let pb_rect = Rectangle::from_min_max(pb_pos, pb_pos + pb_size);

        if pb_rect.contains(point) {
            if difficulty > 1.0 {
                let half_width = POWER_BUTTON_WIDTH / 2.0;
                if point.x < pb_pos.x + half_width {
                    Some(PowerButtonAction::Off)
                } else {
                    Some(PowerButtonAction::On)
                }
            } else {
                Some(PowerButtonAction::On)
            }
        } else {
            None
        }
    }

    pub fn contains_disquette(&self, disquette: &Disquette, difficulty: f32) -> bool {
        let hitzone = self.hit_zone(difficulty);
        hitzone.contains(disquette.coord)
    }
}

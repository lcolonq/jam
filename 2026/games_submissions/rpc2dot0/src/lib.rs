use crate::constants::{HEIGHT, WIDTH};
use wasm_bindgen::prelude::*;
mod assets;
pub(crate) mod collision;
pub(crate) mod color;
pub(crate) mod computer;
pub(crate) mod constants;
pub(crate) mod disquette;
pub(crate) mod effects;
pub(crate) mod entity;
pub(crate) mod errors;
mod game;
pub(crate) mod math;
pub(crate) mod message;
pub(crate) mod random;
pub(crate) mod state;

#[wasm_bindgen]
pub fn main_js(is_embedded: bool) {
    teleia::run(
        WIDTH,
        HEIGHT,
        teleia::Options::FULLSCREEN_MOUSE,
        move |ctx| {
            let game = game::Game::new(ctx, is_embedded);
            game.send_op("ready", None, None, None, None);
            game
        },
    );
}

#[wasm_bindgen]
pub fn set_difficulty_js(difficulty: f32) {
    teleia::contextualize(|_ctx, _st, game: &mut game::Game| game.set_difficulty(difficulty))
}

#[wasm_bindgen]
pub fn receive_op_js(op: String) {
    teleia::contextualize(|ctx, st, game: &mut game::Game| game.receive_op(ctx, st, op.clone()))
}

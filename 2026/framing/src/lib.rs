mod game;
mod assets;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn main_js() {
    teleia::run(480, 320, teleia::Options::OVERLAY, game::Game::new);
}

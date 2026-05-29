mod game;

#[cfg(not(target_arch = "wasm32"))]
pub fn main() -> teleia::Erm<()> {
    teleia::run("game", 240, 160, teleia::Options::empty(), game::Game::new)
}

#[cfg(target_arch = "wasm32")]
pub fn main() {} // dummy main, real wasm32 main is lib::main_js

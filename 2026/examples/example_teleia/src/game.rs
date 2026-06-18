#![allow(dead_code, unused_variables)]
use std::collections::HashMap;
use teleia::*;
use wasm_bindgen::prelude::wasm_bindgen;

struct Assets {
    font: font::Bitmap,
    shader_flat: shader::Shader,
    mesh_square: mesh::Mesh,
    texture_test: texture::Texture,
}

impl Assets {
    fn new(ctx: &context::Context) -> Self {
        Self {
            font: font::Bitmap::default(ctx),
            shader_flat: shader::Shader::new(
                ctx,
                include_str!("assets/shaders/flat/vert.glsl"),
                include_str!("assets/shaders/flat/frag.glsl"),
            ),
            mesh_square: mesh::Mesh::from_obj(ctx, include_bytes!("assets/meshes/square.obj")),
            texture_test: texture::Texture::new(ctx, include_bytes!("assets/textures/test.png")),
        }
    }
}

pub enum Mode {
    Waiting,
    Running { difficulty: f32 },
}

pub struct Game {
    mode: Mode,
    assets: Assets,
}

impl Game {
    pub fn new(ctx: &context::Context) -> Self {
        Self {
            mode: Mode::Waiting,
            assets: Assets::new(ctx),
        }
    }
}

impl teleia::state::Game for Game {
    fn initialize_audio(&self, ctx: &context::Context, st: &state::State, actx: &audio::Context) -> HashMap<String, audio::Audio> {
        log::info!("initialized audio!");
        HashMap::from_iter(vec![
            ("holyshit".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/holyshit.mp3"))),
        ])
    }
    fn initialize(&mut self, _ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        send_ready();
        Ok(())
    }
    fn mouse_press(&mut self, _ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        match self.mode {
            Mode::Waiting => {},
            Mode::Running {..} => {
                self.mode = Mode::Waiting;
                send_done(false);
            },
        }
        Ok(())
    }
    fn update(&mut self, _ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        match self.mode {
            Mode::Waiting => {
            },
            Mode::Running { difficulty } => {
                if st.tick.is_multiple_of(120) {
                    st.audio.play_sfx("holyshit");
                }
            },
        }
        Ok(())
    }
    fn render(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        match self.mode {
            Mode::Waiting => {
                ctx.clear_color(glam::Vec4::new(0.0, 0.0, 0.0, 1.0));
                ctx.clear();
            },
            Mode::Running { difficulty } => {
                ctx.clear_color(glam::Vec4::new(0.0, 0.0, 1.0, 1.0));
                ctx.clear();
                self.assets.font.render_text_at(
                    ctx, st,
                    glam::Vec2::new(0.0, 0.0),
                    "hello computer",
                    font::BitmapParams::default(),
                );
                st.bind_2d(ctx, &self.assets.shader_flat);
                self.assets.texture_test.bind(ctx);
                self.assets.shader_flat.set_position_2d(
                    ctx, st,
                    &glam::Vec2::new(40.0, 40.0),
                    &glam::Vec2::new(16.0, 16.0),
                );
                self.assets.mesh_square.render(ctx);
            },
        }
        Ok(())
    }
}

#[wasm_bindgen]
pub fn game_start(difficulty: f32) {
    contextualize(|ctx, st, g: &mut Game| {
        log::info!("received game start");
        g.mode = Mode::Running { difficulty };
        send_started("test!".to_owned());
    });
}

#[wasm_bindgen]
extern "C" {
    fn send_ready();
    fn send_started(verb: String);
    fn send_done(win: bool);
}

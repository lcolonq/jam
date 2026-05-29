#![allow(dead_code, unused_variables)]
use std::collections::HashMap;
use teleia::*;

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

pub struct Game {
    assets: Assets,
}

impl Game {
    pub fn new(ctx: &context::Context) -> Self {
        Self {
            assets: Assets::new(ctx),
        }
    }
}

impl teleia::state::Game for Game {
    fn initialize_audio(&self, ctx: &context::Context, st: &state::State, actx: &audio::Context) -> HashMap<String, audio::Audio> {
        HashMap::from_iter(vec![
            ("test".to_owned(), audio::Audio::new(&actx, include_bytes!("assets/audio/test.wav"))),
        ])
    }
    fn update(&mut self, _ctx: &context::Context, _st: &mut state::State) -> Erm<()> {
        Ok(())
    }
    fn render(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        ctx.clear_color(glam::Vec4::new(1.0, 0.0, 0.0, 0.5));
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
        Ok(())
    }
}

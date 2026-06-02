#![allow(dead_code, unused_variables)]
use std::collections::HashMap;
use teleia::*;
use teleia::renderer::UberFlags;
use wasm_bindgen::prelude::*;

use crate::assets;

const NUM_LIVES: usize = 4;
const LIFE_LOSS_FRAMES: u64 = 120;

#[derive(PartialEq, Eq)]
enum MrColor {
    Green,
    Blue,
}
impl MrColor {
    fn texture(&self) -> assets::Texture {
        match self {
            Self::Green => assets::Texture::Mrgreen,
            Self::Blue => assets::Texture::Mrblue,
        }
    }
    fn hue(&self) -> f32 {
        match self {
            Self::Green => 0.3,
            Self::Blue => 0.6,
        }
    }
}

struct Lives {
    lives: [ui::Mode; NUM_LIVES],
}
impl Lives {
    fn new() -> Self {
        Self {
            lives: [
                ui::Mode::new(LIFE_LOSS_FRAMES),
                ui::Mode::new(LIFE_LOSS_FRAMES),
                ui::Mode::new(LIFE_LOSS_FRAMES),
                ui::Mode::new(LIFE_LOSS_FRAMES),
            ],
        }
    }
    fn last_life(&self) -> Option<usize> {
        self.lives.iter().rposition(|l| !l.is_active())
    }
    fn lives_remaining(&self) -> i32 {
        self.last_life().map(|x| (x + 1) as i32).unwrap_or(0)
    }
    fn lose_life(&mut self, _ctx: &context::Context, st: &state::State) {
        if let Some(ll) = self.last_life() {
            self.lives[ll].toggle(st.tick)
        }
    }
    fn render(&self,
        ctx: &context::Context, st: &mut state::State, r: &mut renderer::Renderer<assets::Assets>,
    ) -> Erm<()> {
        let base = glam::Vec2::new(90.0, 250.0);
        let off = glam::Vec2::new(90.0, 0.0);
        let t = st.tick as f32 / 10.0;
        for i in 0..NUM_LIVES {
            let fi = i as f32;
            let pos = base + fi * off; 
            let osc = (t + fi * 10.0).sin();
            if self.lives[i].is_active() {
                let hoff = self.lives[i].progress(st.tick) * st.render_dims.x;
                draw_mr_armed(ctx, st, r, MrColor::Blue, pos + glam::Vec2::new(hoff, 0.0), osc)?;
            } else {
                draw_mr_armed(ctx, st, r, MrColor::Green, pos, osc)?;
            };
        }
        Ok(())
    }
}

pub fn draw_texture_rotated_about(
    ctx: &context::Context, st: &mut state::State, r: &mut renderer::Renderer<assets::Assets>,
    texture: assets::Texture, flip: bool, hueset: Option<f32>,
    pos: glam::Vec2, dims: glam::Vec2, joint: glam::Vec2, angle: f32,
) -> Erm<()> {
    let origin_offset = glam::Vec3::new(-st.render_dims.x / 2.0, st.render_dims.y / 2.0, 0.0);
    r.bind_uber_2d(ctx, st, UberFlags::TEXTURE_COLOR | UberFlags::EFFECTS);
    r.set_i32(ctx, st, "effect_flip", flip as i32);
    r.set_f32(ctx, st, "effect_flash", 0.0);
    r.set_f32(ctx, st, "effect_huescale", if hueset.is_some() { 0.0 } else { 1.0 });
    r.set_f32(ctx, st, "effect_hueshift", if let Some(hs) = hueset { hs } else { 0.0 });
    r.bind_texture(ctx, st, texture);
    r.set_position_2d_mat(ctx, st,
        glam::Mat4::from_translation(glam::Vec3::new(pos.x, -pos.y, 0.0) + origin_offset)
            .mul_mat4(&glam::Mat4::from_translation(glam::Vec3::new(joint.x, -joint.y, 0.0)))
            .mul_mat4(&glam::Mat4::from_rotation_z(angle))
            .mul_mat4(&glam::Mat4::from_translation(glam::Vec3::new(-joint.x, joint.y, 0.0)))
            .mul_mat4(&glam::Mat4::from_scale(glam::Vec3::new(dims.x / 2.0, dims.y / 2.0, 1.0))),
    );
    r.render_square(ctx, st);
    Ok(())
}

fn draw_mr_armed(
    ctx: &context::Context, st: &mut state::State, r: &mut renderer::Renderer<assets::Assets>,
    mr: MrColor, center: glam::Vec2, oscillation: f32,
) -> Erm<()> {
    let dims = glam::Vec2::new(48.0, 48.0);
    let pos = center + glam::Vec2::new(0.0, 4.0 * oscillation);
    let topleft = pos - dims / 2.0;
    let leftedge = pos.x - dims.x / 2.0;
    let rightedge = pos.x + dims.x / 2.0;
    let armheight = pos.y - dims.y / 3.0;
    let legheight = pos.y + dims.y / 2.0;
    let legangle = 0.2 * oscillation;
    let armangle = 0.1 * oscillation;
    let origin_offset = glam::Vec3::new(-st.render_dims.x / 2.0, st.render_dims.y / 2.0, 0.0);
    draw_texture_rotated_about(ctx, st, r,
        assets::Texture::Timbs, true, None,
        glam::Vec2::new(leftedge, legheight),
        dims,
        glam::Vec2::new(dims.x / 2.0, -dims.y / 2.0),
        legangle,
    )?;
    draw_texture_rotated_about(ctx, st, r,
        assets::Texture::Timbs, false, None,
        glam::Vec2::new(rightedge, legheight),
        dims,
        glam::Vec2::new(-dims.x / 2.0, -dims.y / 2.0),
        -legangle,
    )?;
    if mr == MrColor::Green {
        draw_texture_rotated_about(ctx, st, r,
            assets::Texture::Arm, true, Some(mr.hue()),
            glam::Vec2::new(leftedge, armheight),
            dims,
            glam::Vec2::new(dims.x / 2.0, dims.y / 2.0),
            armangle,
        )?;
        draw_texture_rotated_about(ctx, st, r,
            assets::Texture::Arm, false, Some(mr.hue()),
            glam::Vec2::new(rightedge, armheight),
            dims,
            glam::Vec2::new(-dims.x / 2.0, dims.y / 2.0),
            -armangle,
        )?;
    }
    r.texture_screen(ctx, st,
        mr.texture(),
        topleft,
        dims,
    );
    Ok(())
}

pub struct Game {
    renderer: renderer::Renderer<assets::Assets>,
    lives: Lives,
}

impl Game {
    pub fn new(ctx: &context::Context) -> Self {
        Self {
            renderer: renderer::Renderer::new(ctx, assets::Assets::new),
            lives: Lives::new(),
        }
    }
}

impl teleia::state::Game for Game {
    fn initialize_audio(&self, ctx: &context::Context, st: &state::State, actx: &audio::Context) -> HashMap<String, audio::Audio> {
        HashMap::from_iter(vec![
            ("footsteps".to_owned(), audio::Audio::new(&actx, include_bytes!("assets/audio/footsteps.wav"))),
        ])
    }
    fn update(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        if st.keys.new_a() {
            log::info!("yo");
            self.lives.lose_life(ctx, st);
            st.audio.play_sfx("footsteps");
        }
        Ok(())
    }
    fn render(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        ctx.clear_color(glam::Vec4::ZERO);
        ctx.clear();
        self.renderer.text_screen(ctx, st, glam::Vec2::new(0.0, 0.0), "hi");
        self.renderer.bind_uber_2d(ctx, st, UberFlags::TEXTURE_COLOR | UberFlags::SPRITE);
        self.renderer.bind_texture(ctx, st, assets::Texture::Mrworld);
        self.renderer.set_texture_offset(ctx, st, 2, 1, ((st.tick / 15) % 2) as i32, 0);
        self.renderer.set_position_2d(ctx, st, glam::Vec2::ZERO, st.render_dims);
        self.renderer.render_square(ctx, st);
        self.lives.render(ctx, st, &mut self.renderer)?;
        Ok(())
    }
}

#[wasm_bindgen]
pub fn lose_life() {
    contextualize(|ctx, st, g: &mut Game| {
        log::info!("lose a life");
        g.lives.lose_life(ctx, st);
        st.audio.play_sfx("footsteps");
    });
}

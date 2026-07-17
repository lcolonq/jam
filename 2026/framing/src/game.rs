#![allow(dead_code, unused_variables)]
use std::collections::HashMap;
use teleia::*;
use teleia::renderer::UberFlags;
use wasm_bindgen::prelude::*;
use rand::seq::SliceRandom;

use crate::assets;

const NUM_LIVES: usize = 4;
const LIFE_LOSS_FRAMES: u64 = 120;

const SOUND_POSITIVE: &[&str] = &["booyah", "excellent", "epicwin", "wow"];
const SOUND_NEGATIVE: &[&str] = &["boo", "aww", "itsover", "youlose", "yousuck"];

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
        let base = Vec2::new(90.0, 250.0);
        let off = Vec2::new(90.0, 0.0);
        let t = st.tick as f32 / 10.0;
        for i in 0..NUM_LIVES {
            let fi = i as f32;
            let pos = base + fi * off; 
            let osc = (t + fi * 10.0).sin();
            if self.lives[i].is_active() {
                let hoff = self.lives[i].progress(st.tick) * st.render_dims.x;
                draw_mr_armed(ctx, st, r, MrColor::Blue, pos + Vec2::new(hoff, 0.0), osc)?;
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
    pos: Vec2, dims: Vec2, joint: Vec2, angle: f32,
) -> Erm<()> {
    let origin_offset = Vec3::new(-st.render_dims.x / 2.0, st.render_dims.y / 2.0, 0.0);
    r.bind_uber_2d(ctx, st, UberFlags::TEXTURE_COLOR | UberFlags::TEXTURE_FLIP | UberFlags::HUE);
    r.set_vec2(ctx, st, "texture_flip", Vec2::new(flip as i32 as f32, 1.0));
    r.set_f32(ctx, st, "hue_scale", if hueset.is_some() { 0.0 } else { 1.0 });
    r.set_f32(ctx, st, "hue_shift", hueset.unwrap_or(0.0));
    r.bind_texture(ctx, st, texture);
    r.set_position_2d_mat(ctx, st,
        Mat4::from_translation(Vec3::new(pos.x, -pos.y, 0.0) + origin_offset)
            .mul_mat4(&Mat4::from_translation(Vec3::new(joint.x, -joint.y, 0.0)))
            .mul_mat4(&Mat4::from_rotation_z(angle))
            .mul_mat4(&Mat4::from_translation(Vec3::new(-joint.x, joint.y, 0.0)))
            .mul_mat4(&Mat4::from_scale(Vec3::new(dims.x / 2.0, dims.y / 2.0, 1.0))),
    );
    r.render_square(ctx, st);
    Ok(())
}

fn draw_mr_armed(
    ctx: &context::Context, st: &mut state::State, r: &mut renderer::Renderer<assets::Assets>,
    mr: MrColor, center: Vec2, oscillation: f32,
) -> Erm<()> {
    let dims = Vec2::new(48.0, 48.0);
    let pos = center + Vec2::new(0.0, 4.0 * oscillation);
    let topleft = pos - dims / 2.0;
    let leftedge = pos.x - dims.x / 2.0;
    let rightedge = pos.x + dims.x / 2.0;
    let armheight = pos.y - dims.y / 3.0;
    let legheight = pos.y + dims.y / 2.0;
    let legangle = 0.2 * oscillation;
    let armangle = 0.1 * oscillation;
    let origin_offset = Vec3::new(-st.render_dims.x / 2.0, st.render_dims.y / 2.0, 0.0);
    draw_texture_rotated_about(ctx, st, r,
        assets::Texture::Timbs, true, None,
        Vec2::new(leftedge, legheight),
        dims,
        Vec2::new(dims.x / 2.0, -dims.y / 2.0),
        legangle,
    )?;
    draw_texture_rotated_about(ctx, st, r,
        assets::Texture::Timbs, false, None,
        Vec2::new(rightedge, legheight),
        dims,
        Vec2::new(-dims.x / 2.0, -dims.y / 2.0),
        -legangle,
    )?;
    if mr == MrColor::Green {
        draw_texture_rotated_about(ctx, st, r,
            assets::Texture::Arm, true, Some(mr.hue()),
            Vec2::new(leftedge, armheight),
            dims,
            Vec2::new(dims.x / 2.0, dims.y / 2.0),
            armangle,
        )?;
        draw_texture_rotated_about(ctx, st, r,
            assets::Texture::Arm, false, Some(mr.hue()),
            Vec2::new(rightedge, armheight),
            dims,
            Vec2::new(-dims.x / 2.0, dims.y / 2.0),
            -armangle,
        )?;
    }
    r.texture_screen(ctx, st, topleft, mr.texture()).dimensions(dims).render();
    Ok(())
}

pub enum Mode {
    Titlescreen,
    Intro,
    BetweenGames,
    InGame,
    PostGames,
}

pub struct Game {
    mode: Mode,
    mode_started: Tick,
    renderer: renderer::Renderer<assets::Assets>,
    font0: font::Bitmap,
    lives: Lives,
    verb: Option<String>,
}

impl Game {
    pub fn new(ctx: &context::Context, st: &mut state::State) -> Self {
        Self {
            mode: Mode::Titlescreen,
            mode_started: 0,
            renderer: renderer::Renderer::new(ctx, st, assets::Assets::new),
            font0: font::Bitmap::from_image(ctx, 32, 48, 512, 288, include_bytes!("assets/fonts/font0.png")),
            lives: Lives::new(),
            verb: None,
        }
    }
    pub fn switch(&mut self, _ctx: &context::Context, st: &mut state::State, m: Mode) {
        self.mode = m;
        self.mode_started = st.tick;
    }
    fn draw_mrworld(&mut self, ctx: &context::Context, st: &mut state::State, fadeout: Option<Tick>) -> Erm<()> {
        self.renderer.bind_uber_2d(ctx, st, UberFlags::TEXTURE_COLOR | UberFlags::TEXTURE_FLIP | UberFlags::SPRITE | UberFlags::OPACITY);
        self.renderer.bind_texture(ctx, st, assets::Texture::Mrworld);
        self.renderer.set_position_2d(ctx, st, Vec2::ZERO, st.render_dims);
        self.renderer.set_vec2(ctx, st, "texture_flip", glam::Vec2::new(0.0, 1.0));
        let opacity = if let Some(t) = fadeout {
            if t < 35 {
                self.renderer.set_texture_offset(ctx, st, 8, 1, 2 + (t / 5).clamp(0, 5) as i32, 0);
                self.renderer.set_f32(ctx, st, "opacity", 1.0);
                1.0
            } else if t < 70 {
                let since = ((t - 35) as f32).clamp(0.0, 34.0);
                let opacity = (34.0 - since) / 34.0;
                self.renderer.set_texture_offset(ctx, st, 8, 1, 7, 0);
                self.renderer.set_f32(ctx, st, "opacity", opacity);
                opacity
            } else { 1.0 }
        } else {
            self.renderer.set_texture_offset(ctx, st, 8, 1, (st.tick as i32 / 20) % 2, 0);
            self.renderer.set_f32(ctx, st, "opacity", 1.0);
            1.0
        };
        self.renderer.render_square(ctx, st);
        if let Some(v) = &self.verb && let Some(t) = fadeout && t > 5 && t < 70 {
            self.renderer.text_screen(ctx, st,
                glam::Vec2::new(st.render_dims.x / 2.0, st.render_dims.y / 2.0),
                v
            )
                .centered()
                .font(&self.font0)
                .color(glam::Vec4::new(0.39, 0.61, 1.0, opacity))
                .render();
        }
        Ok(())
    }
    fn play_random_sound(&mut self, ctx: &context::Context, st: &mut state::State, sounds: &[&str]) {
        st.audio.play_sfx(sounds.choose(&mut rand::thread_rng()).unwrap());
    }
}

impl teleia::state::Game for Game {
    fn initialize_audio(&self, ctx: &context::Context, st: &state::State, actx: &audio::Context) -> HashMap<String, audio::Audio> {
        HashMap::from_iter(vec![
            ("jam2026".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/jam2026.wav"))),
            ("wind".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/wind.wav"))),
            ("footsteps".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/footsteps.wav"))),
            ("explosion".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/explosion.wav"))),
            ("gamingtime".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/gamingtime.wav"))),
            ("booyah".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/booyah.wav"))),
            ("excellent".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/excellent.wav"))),
            ("epicwin".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/epicwin.wav"))),
            ("wow".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/wow.wav"))),
            ("boo".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/boo.wav"))),
            ("aww".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/aww.wav"))),
            ("itsover".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/itsover.wav"))),
            ("youlose".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/youlose.wav"))),
            ("yousuck".to_owned(), audio::Audio::new(actx, include_bytes!("assets/audio/yousuck.wav"))),
        ])
    }
    fn update(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        let t = st.tick - self.mode_started;
        match self.mode {
            Mode::Intro => {
                if t == 43 * 5 {
                    st.audio.play_sfx("explosion");
                    st.audio.play_music("jam2026", None, None);
                }
                if t >= 57 * 5 {
                    self.switch(ctx, st, Mode::BetweenGames);
                }
            },
            _ => {},
        }
        Ok(())
    }
    fn render(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        let t = st.tick - self.mode_started;
        match self.mode {
            Mode::Titlescreen => {
                self.renderer.begin_frame(ctx, st, Vec4::ZERO);
                self.renderer.bind_uber_2d(ctx, st, UberFlags::TEXTURE_COLOR | UberFlags::TEXTURE_FLIP | UberFlags::SPRITE);
                self.renderer.bind_texture(ctx, st, assets::Texture::Titlescreen);
                self.renderer.set_texture_offset(ctx, st, 2, 1, (t / 60 % 2) as i32, 0);
                self.renderer.set_position_2d(ctx, st, Vec2::ZERO, st.render_dims);
                self.renderer.set_vec2(ctx, st, "texture_flip", glam::Vec2::new(0.0, 1.0));
                self.renderer.render_square(ctx, st);
            },
            Mode::Intro => {
                self.renderer.begin_frame(ctx, st, Vec4::ZERO);
                self.draw_mrworld(ctx, st, None)?;
                self.lives.render(ctx, st, &mut self.renderer)?;
                let f = t / 5;
                let sx = f % 8;
                let sy = f / 8;
                self.renderer.bind_uber_2d(ctx, st, UberFlags::TEXTURE_COLOR | UberFlags::TEXTURE_FLIP | UberFlags::SPRITE);
                self.renderer.bind_texture(ctx, st, assets::Texture::Intro);
                self.renderer.set_texture_offset(ctx, st, 8, 8, sx as i32, sy as i32);
                self.renderer.set_position_2d(ctx, st, Vec2::ZERO, st.render_dims);
                self.renderer.set_vec2(ctx, st, "texture_flip", glam::Vec2::new(0.0, 1.0));
                self.renderer.render_square(ctx, st);
            }
            Mode::BetweenGames => {
                self.renderer.begin_frame(ctx, st, Vec4::ZERO);
                self.draw_mrworld(ctx, st, None)?;
                self.lives.render(ctx, st, &mut self.renderer)?;
            },
            Mode::InGame => {
                self.renderer.begin_frame(ctx, st, Vec4::ZERO);
                self.draw_mrworld(ctx, st, Some(t))?;
                // self.lives.render(ctx, st, &mut self.renderer)?;
            },
            Mode::PostGames => {
            },
        }
        Ok(())
    }
    fn mouse_press(&mut self, _ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        Ok(())
    }
}

#[wasm_bindgen(module = "/src/bindings.js")]
extern {
    fn js_update_lifetotal(lives: i32);
}

#[wasm_bindgen]
pub fn titlescreen_click() {
    contextualize(|ctx, st, g: &mut Game| {
        g.switch(ctx, st, Mode::Intro);
        st.audio.play_music("wind", None, None);
    });
}

#[wasm_bindgen]
pub fn start_game(verb: Option<String>) {
    contextualize(|ctx, st, g: &mut Game| {
        g.switch(ctx, st, Mode::InGame);
        g.verb = verb.as_ref().map(|x| x.to_ascii_uppercase());
        st.audio.mute_music(0.0);
    });
}

#[wasm_bindgen]
pub fn end_game(win: bool) {
    contextualize(|ctx, st, g: &mut Game| {
        g.switch(ctx, st, Mode::BetweenGames);
        st.audio.unmute_music(0.0);
        if win {
            g.play_random_sound(ctx, st, SOUND_POSITIVE);
        } else {
            g.lives.lose_life(ctx, st);
            st.audio.play_sfx("footsteps");
            g.play_random_sound(ctx, st, SOUND_NEGATIVE);
        }
        js_update_lifetotal(g.lives.lives_remaining());
    });
}

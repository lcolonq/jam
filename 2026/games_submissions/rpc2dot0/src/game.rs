use std::collections::HashMap;

use teleia::renderer::UberFlags;
use teleia::*;

use crate::assets;
use crate::assets::AUDIO_ASSETS;
use crate::color::{ColorExt, EntityColor};
use crate::computer::os::Os;
use crate::computer::*;
use crate::constants::*;
use crate::disquette::*;
use crate::effects::*;
use crate::errors::*;
use crate::math::*;
use crate::message::Message;
use crate::state::{GamePhase, GameState};

pub struct Game {
    renderer: renderer::Renderer<assets::Assets>,
    state: GameState,
    mouse: glam::Vec2,
    explosions: Vec<Explosion>,
    greens_wiped_flash: f32,
    computer: Computer,
    start_button_rect: Option<Rectangle>,
    is_muted: bool,
    mute_button_rect: Option<Rectangle>,
    is_embedded: bool,
    last_time_ms: Option<f64>,
    finish_time_ms: Option<f64>,
    done_sent: bool,
}

impl Game {
    pub fn new(ctx: &context::Context, is_embedded: bool) -> Self {
        log::info!("eatyourgreens:: entering new Game");
        let mut state = GameState::new();
        let computer = Computer::new(
            ctx.render_width,
            ctx.render_height,
            &mut state.rng,
            state.difficulty,
        );
        Self {
            renderer: renderer::Renderer::new(ctx, assets::Assets::new),
            state,
            mouse: glam::Vec2::ZERO,
            explosions: Vec::new(),
            greens_wiped_flash: 0.0,
            computer,
            start_button_rect: None,
            is_muted: false,
            mute_button_rect: None,
            is_embedded,
            last_time_ms: None,
            finish_time_ms: None,
            done_sent: false,
        }
    }

    pub fn set_difficulty(&mut self, difficulty: f32) {
        log::info!("eatyourgreens:: set_difficulty: {}", difficulty);
        self.state.set_difficulty(difficulty);
    }

    pub fn receive_op(&mut self, ctx: &context::Context, st: &mut state::State, op: String) {
        log::info!(
            "eatyourgreens:: receive op: {} (phase: {:?})",
            op,
            self.state.phase()
        );
        match self.state.phase() {
            GamePhase::Waiting | GamePhase::Finished => {
                if self.is_embedded && op == "start" {
                    self.reset_round(ctx, st);
                    const VERB: &str = "eat your greens";
                    self.send_op("started", Some(VERB), None, None, None);
                } else {
                    log::warn!("eatyourgreens:: received unexpected op: {} (waiting) ", op);
                }
            }
            GamePhase::Computer(computer_phase) => {
                let currentop = op.as_str();
                match computer_phase {
                    ComputerPhase::Booting => {
                        if currentop == "video_finished" {
                            self.state.set_phase(GamePhase::Computer(ComputerPhase::On));
                            self.computer.on(ctx);
                        } else {
                            log::warn!(
                                "eatyourgreens:: received unexpected op: {}, Phase {:?} (Computer)",
                                op,
                                computer_phase
                            );
                        }
                    }
                    ComputerPhase::On => {
                        if currentop == "computing" {
                            // nothing to do in here
                            // we wait for os-micro-game to send shutdown
                            log::info!("eatyourgreens:: computer computing. do nothing.");
                        } else if currentop == "shutdown" {
                            log::info!(
                                "eatyourgreens:: computer shutdown. Transition to main game."
                            );
                            self.computer.shutdown();
                            self.state.set_phase(GamePhase::Playing);
                        } else {
                            log::warn!(
                                "eatyourgreens:: received unexpected op: {}, Phase {:?} (Computer)",
                                op,
                                computer_phase
                            );
                        }
                    }

                    _ => {
                        // we shouldn't be receiving events while computer is off or shutdown
                        log::warn!(
                            "eatyourgreens:: received unexpected op: {}, Phase {:?} (Computer)",
                            op,
                            computer_phase
                        );
                    }
                }
            }
            _ => {
                log::warn!(
                    "eatyourgreens:: received unexpected op: {} for phase: {:?}",
                    op,
                    self.state.phase()
                );
            }
        }
    }

    fn reset_round(&mut self, ctx: &context::Context, st: &mut state::State) {
        log::info!("eatyourgreens:: reset_round");
        self.state.start_round();

        let computer = Computer::new(
            ctx.render_width,
            ctx.render_height,
            &mut self.state.rng,
            self.state.difficulty,
        );

        self.computer = computer;
        self.explosions.clear();
        self.greens_wiped_flash = 0.0;
        if self.is_muted {
            st.audio.stop_music();
        }
        self.last_time_ms = None;
        self.finish_time_ms = None;
        self.done_sent = false;
    }

    fn push_explosion(&mut self, x: f32, y: f32) {
        self.explosions.push(Explosion::new(x, y));
    }

    fn update_explosions(&mut self, delta_ms: f32) {
        for exp in &mut self.explosions {
            exp.age_ms += delta_ms;
        }
        self.explosions.retain(|e| e.age_ms < e.duration_ms);
    }

    fn handle_state_event(&mut self, event: String, st: &mut state::State) {
        log::info!("eatyourgreens:: handle_state_event: {}", event);
        if let Some(coords) = event.strip_prefix("explode:") {
            if !self.is_muted {
                st.audio.play_sfx("explosion");
            }
            let (x, y): (f32, f32) = parse_coords(coords);
            self.push_explosion(x, y);
            self.greens_wiped_flash = 300.0;
            return;
        }

        if let Some(coords) = event.strip_prefix("click_red:") {
            if !self.is_muted {
                st.audio.play_sfx("explosion");
            }
            let (x, y) = parse_coords(coords);
            self.push_explosion(x, y);
            return;
        }
    }

    fn render_title(&mut self, ctx: &context::Context, st: &mut state::State) {
        self.renderer
            .bind_uber_2d(ctx, st, UberFlags::TEXTURE_COLOR | UberFlags::SPRITE);
        self.renderer
            .bind_texture(ctx, st, assets::Texture::Landing);
        self.renderer.set_texture_offset(
            ctx,
            st,
            1,
            1,
            LANDING_TEXTURE_WIDTH,
            LANDING_TEXTURE_HEIGHT,
        );
        self.renderer
            .set_position_2d(ctx, st, glam::Vec2::ZERO, st.render_dims);
        self.renderer.set_f32(ctx, st, UI_UNIFORM_OPACITY_NAME, 0.5);
        self.renderer.render_square(ctx, st);

        let center_x: f32 = ctx.render_width / 2.0;
        let mut y: f32 = ctx.render_height * 0.3;
        let line_height: f32 = self.renderer.font_char_height(st) + 1.0;

        self.draw_text_centered(
            ctx,
            st,
            center_x,
            y,
            TITLE_HEADING_TEXT_COLOR,
            &title_score_goal(),
        );

        y += line_height;
        self.draw_text_centered(
            ctx,
            st,
            center_x,
            y,
            TITLE_HEADING_TEXT_COLOR,
            TITLE_CLICK_START_HINT,
        );

        y += line_height * 2.0;
        if !self.is_embedded {
            self.draw_button_centered(
                ctx,
                st,
                center_x,
                y,
                START_BUTTON_TEXT_COLOR,
                TITLE_START_BUTTON_LABEL,
            );
        } else {
            self.start_button_rect = None;
        }

        y += line_height * 3.0;
        self.draw_text_centered(
            ctx,
            st,
            center_x,
            y,
            TITLE_DESCRIPTION_TEXT_COLOR,
            TITLE_SCORING_HINT,
        );

        y += line_height;
        self.draw_text_centered(
            ctx,
            st,
            center_x,
            y,
            TITLE_DESCRIPTION_TEXT_COLOR,
            TITLE_HINT,
        );

        self.draw_mute_icon(ctx, st);
    }

    fn render_background(&mut self, ctx: &context::Context, st: &mut state::State) {
        ctx.clear_color(glam::Vec4::ZERO);
        ctx.clear();
        self.renderer.texture_screen(
            ctx,
            st,
            assets::Texture::BackgroundMain,
            glam::Vec2::ZERO,
            glam::Vec2::new(ctx.render_width, ctx.render_height),
        );
    }

    fn render_entities(&mut self, ctx: &context::Context, st: &mut state::State) {
        let mapped_mouse = self.map_mouse_to_render(ctx, st);
        let elapsed_ms = self.state.elapsed_ms();
        for entity in self.state.entities() {
            if !entity.alive {
                continue;
            }

            let size: f32 = entity.radius * 2.0;
            let pos: glam::Vec2 = glam::Vec2::new(entity.pos.x, entity.pos.y);
            let dims: glam::Vec2 = glam::Vec2::new(size, size);
            let topleft: glam::Vec2 = pos - dims / 2.0;

            let mut display_color: EntityColor = entity.color;
            if display_color == EntityColor::Green
                && let Some(rogue) = &entity.rogue
                && elapsed_ms < rogue.until_ms
                && entity.pos.distance_squared(mapped_mouse) <= entity.radius * entity.radius
            {
                display_color = rogue.hover_color;
            }

            let texture = if entity.color == EntityColor::Bleu && entity.pacman_chase.is_some() {
                assets::Texture::MrbleuLurking
            } else {
                display_color.texture()
            };

            self.renderer
                .texture_screen(ctx, st, texture, topleft, dims);
        }
    }

    fn render_red_countdowns(&mut self, ctx: &context::Context, st: &mut state::State) {
        self.renderer.bind_uber_2d(ctx, st, UberFlags::empty());
        self.renderer
            .set_vec4(ctx, st, UI_UNIFORM_COLOR_NAME, RED_COUNTDOWN_BAR_COLOR);

        for entity in self.state.entities() {
            if !entity.alive || entity.color != EntityColor::Red {
                continue;
            }

            if let Some(spawn_time) = entity.spawn_time_ms {
                let elapsed = self.state.elapsed_ms() - spawn_time;
                if elapsed < RED_COUNTDOWN_MS {
                    let remaining = RED_COUNTDOWN_MS - elapsed;
                    let fraction = remaining / RED_COUNTDOWN_MS;
                    let bar_width = 10.6;
                    let bar_height = 1.6;
                    let pos = glam::Vec2::new(
                        entity.pos.x - bar_width / 2.0,
                        entity.pos.y - entity.radius - 3.2,
                    );

                    self.renderer.set_position_2d(
                        ctx,
                        st,
                        pos,
                        glam::Vec2::new(bar_width * fraction, bar_height),
                    );
                    self.renderer.render_square(ctx, st);
                }
            }
        }
    }

    fn render_explosions(&mut self, ctx: &context::Context, st: &mut state::State) {
        self.renderer.bind_uber_2d(ctx, st, UberFlags::empty());

        for exp in &self.explosions {
            let t = exp.age_ms / exp.duration_ms;
            let alpha = 1.0 - t;
            let r = exp.radius * (0.5 + t * 0.5);
            let color = glam::Vec4::new(1.0, (200.0 - t * 200.0) / 255.0, 0.0, alpha);
            self.renderer.set_vec4(ctx, st, "color", color);

            let size = r * 2.0;
            let pos = glam::Vec2::new(exp.x - r, exp.y - r);
            self.renderer
                .set_position_2d(ctx, st, pos, glam::Vec2::new(size, size));
            self.renderer.render_square(ctx, st);
        }
    }

    fn render_flash(&mut self, ctx: &context::Context, st: &mut state::State) {
        if self.greens_wiped_flash > 0.0 {
            let flash_alpha = (self.greens_wiped_flash / 300.0) * 0.3;
            let flash_color = glam::Vec4::new(
                FLASH_SCREEN_BASE_COLOR.x,
                FLASH_SCREEN_BASE_COLOR.y,
                FLASH_SCREEN_BASE_COLOR.z,
                flash_alpha,
            );
            self.renderer.color_screen(
                ctx,
                st,
                flash_color,
                glam::Vec2::ZERO,
                glam::Vec2::new(ctx.render_width, ctx.render_height),
            );
        }
    }

    fn render_computer(&mut self, ctx: &context::Context, st: &mut state::State) {
        let dims = glam::Vec2::new(COMPUTER_WIDTH, COMPUTER_HEIGHT);
        let topleft = self.computer.coord - dims / 2.0;
        self.renderer
            .texture_screen(ctx, st, assets::Texture::Computer, topleft, dims);
    }

    fn render_disquette(&mut self, ctx: &context::Context, st: &mut state::State) {
        if self.computer.already_used() || self.computer.disquette_inserted() {
            return;
        }

        let size = self.computer.disquette.size;
        let dims = glam::Vec2::splat(size);
        let topleft = self.computer.disquette.coord - dims / 2.0;
        self.renderer
            .texture_screen(ctx, st, assets::Texture::Disquette, topleft, dims);
    }

    fn render_hud(&mut self, ctx: &context::Context, st: &mut state::State) {
        self.renderer.text_colored_screen(
            ctx,
            st,
            HUD_SCORE_POSITION,
            HUD_TEXT_COLOR,
            &format!(
                "{}{}",
                HUD_SCORE_LABEL_PREFIX,
                format_args!("{}/{}", self.state.consumer_score(), NB_GREENS)
            ),
        );

        let remaining_secs = (self.state.remaining_ms() / 1000.0).ceil() as i32;
        let time_str = format!(
            "{}{}{}",
            HUD_TIME_LABEL_PREFIX, remaining_secs, HUD_TIME_LABEL_SUFFIX
        );
        let time_width = self.renderer.font_char_width(st) * time_str.len() as f32;

        self.renderer.text_colored_screen(
            ctx,
            st,
            glam::Vec2::new(ctx.render_width - time_width - 2.6, 6.6),
            HUD_TEXT_COLOR,
            &time_str,
        );

        self.renderer.text_colored_screen(
            ctx,
            st,
            HUD_FPS_POSITION,
            HUD_TEXT_COLOR,
            &format!("{}{}", HUD_FPS_LABEL_PREFIX, st.fps),
        );
    }

    fn render_game_over(&mut self, ctx: &context::Context, st: &mut state::State) {
        st.audio.stop_music();
        self.renderer.color_screen(
            ctx,
            st,
            GAME_OVER_OVERLAY_COLOR,
            glam::Vec2::ZERO,
            glam::Vec2::new(ctx.render_width, ctx.render_height),
        );

        self.draw_text_centered(
            ctx,
            st,
            ctx.render_width / 2.0,
            ctx.render_height / 2.0 - 8.0,
            GAME_OVER_TEXT_COLOR,
            GAME_OVER_TITLE_TEXT,
        );

        let status_text: &str = self.state.round_result().into();

        self.draw_text_centered(
            ctx,
            st,
            ctx.render_width / 2.0,
            ctx.render_height / 2.0 + 5.3,
            GAME_OVER_TEXT_COLOR,
            &format!("{}{}", GAME_OVER_RESULT_PREFIX, status_text),
        );
        self.draw_text_centered(
            ctx,
            st,
            ctx.render_width / 2.0,
            ctx.render_height / 2.0 + 14.6,
            GAME_OVER_TEXT_COLOR,
            &format!(
                "{}{}",
                HUD_SCORE_LABEL_PREFIX,
                format_args!(
                    "{}/{}",
                    self.state.consumer_score(),
                    self.state.required_greens()
                )
            ),
        );
    }
}

impl teleia::state::Game for Game {
    fn initialize(&mut self, _ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        log::info!("eatyourgreens:: entering initialize");

        st.keybindings.insert(
            state::Keycode::new(winit::keyboard::KeyCode::ArrowUp),
            state::Key::Up,
        );
        st.keybindings.insert(
            state::Keycode::new(winit::keyboard::KeyCode::ArrowDown),
            state::Key::Down,
        );
        st.keybindings.insert(
            state::Keycode::new(winit::keyboard::KeyCode::ArrowLeft),
            state::Key::Left,
        );
        st.keybindings.insert(
            state::Keycode::new(winit::keyboard::KeyCode::ArrowRight),
            state::Key::Right,
        );

        log::info!("eatyourgreens:: exiting initialize");
        Ok(())
    }

    fn initialize_audio(
        &self,
        _ctx: &context::Context,
        _st: &state::State,
        actx: &audio::Context,
    ) -> HashMap<String, audio::Audio> {
        let mut map = HashMap::new();
        for (name, data) in AUDIO_ASSETS {
            map.insert(name.to_string(), audio::Audio::new(actx, data));
        }
        map
    }

    fn mouse_move(
        &mut self,
        _ctx: &context::Context,
        _st: &mut state::State,
        x: i32,
        y: i32,
    ) -> Erm<()> {
        self.mouse = glam::Vec2::new(x as f32, y as f32);
        Ok(())
    }

    fn mouse_press(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        let mapped_mouse = self.map_mouse_to_render(ctx, st);
        /*log::info!(
            "eatyourgreens:: mouse at ({:?}), mapped to ({:?})",
            self.mouse,
            mapped_mouse
        );*/

        if !self.computer.already_used()
            && self.computer.disquette_inserted()
            && let Some(action) = self
                .computer
                .check_power_button(mapped_mouse, self.state.difficulty)
        {
            log::info!("eatyourgreens:: clicked power button {:?}", action);
            if action == PowerButtonAction::On {
                self.computer.boot();
                self.state
                    .set_phase(GamePhase::Computer(ComputerPhase::Booting));
                Os::boot(&mut self.state.rng);
                //log::info!("eatyourgreens:: blah2");
            }
        }

        if let Some(rect) = self.mute_button_rect
            && rect.contains(mapped_mouse)
        {
            self.is_muted = !self.is_muted;
            if self.is_muted {
                st.audio.stop_music();
            } else {
                //play something
            }
            return Ok(());
        }
        match self.state.phase() {
            GamePhase::Waiting => {
                if let Some(rect) = self.start_button_rect
                    && rect.contains(mapped_mouse)
                {
                    self.reset_round(ctx, st);
                }
            }
            GamePhase::Playing => {
                if let Some(ClickOutcome::Hit(color)) =
                    self.state.click_at(mapped_mouse.x, mapped_mouse.y)
                {
                    log::info!("eatyourgreens:: Hit entity of color {:?}", color);
                    match color {
                        EntityColor::Green => {
                            if !self.is_muted {
                                st.audio.play_sfx("crunch");
                            }
                        }
                        _ => {
                            if !self.is_muted {
                                st.audio.play_sfx("fart");
                            }
                        }
                    }
                }
            }
            GamePhase::Finished => {
                if !self.is_embedded {
                    self.reset_round(ctx, st);
                    if !self.is_muted {
                        st.audio.stop_music();
                    }
                }
            }
            GamePhase::Computer(_) => {
                //nothing to do here we yielded to DA COMPUTTTA
            }
            #[allow(unreachable_patterns)]
            _ => unreachable!(),
        }

        Ok(())
    }

    fn update(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        let now_ms = teleia::state::now(ctx) * 1000.0;
        let last_time = self.last_time_ms.unwrap_or(now_ms);
        self.last_time_ms = Some(now_ms);

        if let GamePhase::Computer(ComputerPhase::On) = self.state.phase() {
            // @TODO: play OS microgame here. For now, simulate its end immediately.
            self.receive_op(ctx, st, "shutdown".to_string());
        }

        if self.state.phase() != GamePhase::Playing && self.state.phase() != GamePhase::Finished {
            return Ok(());
        }

        if self.state.phase() == GamePhase::Playing {
            // cap maximum time jump to 250ms,
            // sometime the game lags when embedded in a Wcolonq wrapper, not sure why
            // probbaly these copypasta all over the place make's it buggy
            let real_delta = (now_ms - last_time).clamp(0.0, 250.0);
            let dt = real_delta as f32;

            let disquette_pos = if !self.computer.disquette.is_inserted() {
                Some(self.computer.disquette.coord)
            } else {
                None
            };
            self.state.update_entities(
                dt,
                ctx.render_width,
                ctx.render_height,
                self.computer.disquette.is_inserted(),
                disquette_pos,
            );
            self.state.advance_time(dt);
            self.update_explosions(dt);

            if self.greens_wiped_flash > 0.0 {
                self.greens_wiped_flash = (self.greens_wiped_flash - dt).max(0.0);
            }

            let events = self.state.drain_events();
            let mut disquette_consumed = false;
            for event in events {
                if event == "disquette_consumed" {
                    disquette_consumed = true;
                } else {
                    self.handle_state_event(event, st);
                }
            }

            if disquette_consumed {
                let hitzone = self.computer.hit_zone(self.state.difficulty);
                self.computer.disquette = crate::disquette::Disquette::new(
                    ctx.render_width,
                    ctx.render_height,
                    &mut self.state.rng,
                    Some(hitzone),
                );
            }

            if !self.computer.disquette.is_inserted() {
                let hitzone = self.computer.hit_zone(self.state.difficulty);
                self.computer.disquette.update(
                    ctx.render_width,
                    ctx.render_height,
                    &st.keys,
                    dt,
                    self.state.difficulty,
                    Some(hitzone),
                );

                if self
                    .computer
                    .contains_disquette(&self.computer.disquette, self.state.difficulty)
                {
                    self.computer.disquette.phase = DisquettePhase::Inserted;
                }
            }
        }

        if self.state.phase() == GamePhase::Finished && self.is_embedded && !self.done_sent {
            let finish_at = *self.finish_time_ms.get_or_insert(now_ms);

            if now_ms - finish_at >= RESULT_DISPLAY_DELAY_MS {
                self.send_op(
                    "done",
                    None,
                    Some(self.state.round_result().into()),
                    Some(self.state.consumer_score()),
                    None,
                );
                self.done_sent = true;
            }
        }

        Ok(())
    }

    fn render(&mut self, ctx: &context::Context, st: &mut state::State) -> Erm<()> {
        if self.state.phase() == GamePhase::Waiting {
            self.render_title(ctx, st);
            return Ok(());
        }

        self.render_background(ctx, st);

        self.draw_mute_icon(ctx, st);
        self.render_computer(ctx, st);
        self.render_entities(ctx, st);
        self.render_red_countdowns(ctx, st);
        self.render_explosions(ctx, st);
        self.render_flash(ctx, st);
        self.render_disquette(ctx, st);

        self.render_hud(ctx, st);

        if self.state.phase() == GamePhase::Finished {
            self.render_game_over(ctx, st);
        }

        Ok(())
    }
}

impl Game {
    fn draw_text_centered(
        &mut self,
        ctx: &context::Context,
        st: &mut state::State,
        center_x: f32,
        y: f32,
        color: glam::Vec3,
        text: &str,
    ) {
        let w = self.renderer.font_char_width(st) * text.len() as f32;
        let x = (center_x - w / 2.0).round();
        self.renderer
            .text_colored_screen(ctx, st, glam::Vec2::new(x, y), color, text);
    }

    fn draw_button_centered(
        &mut self,
        ctx: &context::Context,
        st: &mut state::State,
        center_x: f32,
        y: f32,
        color: glam::Vec3,
        text: &str,
    ) {
        let text_width = self.renderer.font_char_width(st) * text.len() as f32;
        let padding_x = 4.8;
        let padding_y = 3.2;
        let char_height = self.renderer.font_char_height(st);
        let height = char_height + padding_y * 2.0;
        let width = text_width + padding_x * 2.0;
        let x = (center_x - width / 2.0).round();

        let border_thickness = 1.0;
        let inner_color = BUTTON_FILL_COLOR;

        self.renderer.color_screen(
            ctx,
            st,
            inner_color,
            glam::Vec2::new(x + border_thickness, y + border_thickness),
            glam::Vec2::new(
                width - border_thickness * 2.0,
                height - border_thickness * 2.0,
            ),
        );

        self.draw_text_centered(
            ctx,
            st,
            center_x,
            y + (height - char_height) / 2.0,
            color,
            text,
        );

        self.start_button_rect = Some(Rectangle::from_xywh(x, y, width, height));
    }

    fn draw_mute_icon(&mut self, ctx: &context::Context, st: &mut state::State) {
        let tex = if self.is_muted {
            assets::Texture::Mute
        } else {
            assets::Texture::Unmute
        };

        let size = glam::Vec2::new(MUTE_ICON_SIZE, MUTE_ICON_SIZE);
        let topleft = glam::Vec2::new(
            MUTE_ICON_MARGIN,
            ctx.render_height - MUTE_ICON_SIZE - MUTE_ICON_MARGIN,
        );
        self.renderer.texture_screen(ctx, st, tex, topleft, size);

        self.mute_button_rect = Some(Rectangle::from_xywh(topleft.x, topleft.y, size.x, size.y));
    }

    // mapping of raw physical mouse coordinates to logical internal rendering coordinates.
    // 1) subtract screen offsets to adjust to window margins.
    // 2) scale the position by the ratio of the logical render resolution to the
    //    physical screen dimensions.
    // 3) round and clamp the result point to guarantee it falls strictly within
    //    the valid rendering bounds [0, render_width] and [0, render_height].
    fn map_mouse_to_render(&self, ctx: &context::Context, st: &state::State) -> glam::Vec2 {
        let x =
            ((self.mouse.x - st.screen.offsets.x) * ctx.render_width / st.screen.dims.x).round();
        let y =
            ((self.mouse.y - st.screen.offsets.y) * ctx.render_height / st.screen.dims.y).round();
        glam::Vec2::new(
            x.clamp(0.0, ctx.render_width),
            y.clamp(0.0, ctx.render_height),
        )
    }

    pub(crate) fn send_op(
        &self,
        op: &str,
        verb: Option<&str>,
        win: Option<bool>,
        score: Option<i32>,
        video_url: Option<String>,
    ) {
        // we send_op only if embedded
        if !self.is_embedded {
            return;
        }
        if let Some(window) = web_sys::window()
            && let Some(parent) = window.parent().ok().flatten()
        {
            log::info!(
                "eatyourgreens:: send op: {} with verb {:?} win {:?} score {:?}",
                op,
                verb,
                win,
                score
            );
            let msg = Message {
                op,
                verb,
                win,
                score,
                video_url,
            };
            Message::post(&parent, &msg);
        }
    }
}

use std::fmt::Debug;

use crate::computer::ComputerPhase;
use crate::message::Message;
use crate::{assets::VIDEO_ASSETS, random::RandomState};
use crate::{constants::*, game};
use teleia::context;
use web_sys::{Blob, BlobPropertyBag, Url};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Os {
    state: OsState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OsState {
    Booting,
    On,
    ShutDown,
    Off,
}

// TODO ???
impl From<OsState> for ComputerPhase {
    fn from(value: OsState) -> Self {
        match value {
            OsState::Booting => ComputerPhase::Booting,
            OsState::On => ComputerPhase::On,
            OsState::ShutDown => ComputerPhase::ShutDown,
            OsState::Off => ComputerPhase::Off,
        }
    }
}

impl From<ComputerPhase> for OsState {
    fn from(value: ComputerPhase) -> Self {
        match value {
            ComputerPhase::Off => OsState::Off,
            ComputerPhase::Booting => OsState::Booting,
            ComputerPhase::On => OsState::On,
            ComputerPhase::ShutDown => OsState::ShutDown,
        }
    }
}

impl Os {
    pub fn new() -> Self {
        Self {
            state: OsState::Off,
        }
    }
    pub fn from(phase: ComputerPhase) -> Self {
        Self {
            state: OsState::from(phase),
        }
    }

    pub fn set(&mut self, phase: ComputerPhase) {
        self.state = OsState::from(phase);
    }
}

impl Default for Os {
    fn default() -> Self {
        Self {
            state: OsState::Off,
        }
    }
}

impl Os {
    pub fn boot(rng: &mut RandomState) {
        let idx = rng.next_range(0.0, VIDEO_ASSETS.len() as f32) as usize;
        let bytes = VIDEO_ASSETS[idx].1;

        // huh ? `of1` nice api name
        let parts = js_sys::Array::of1(&js_sys::Uint8Array::from(bytes));
        let blob_props = BlobPropertyBag::new();
        blob_props.set_type("video/mp4");

        let blob = match Blob::new_with_u8_array_sequence_and_options(&parts, &blob_props) {
            Ok(b) => b,
            Err(_) => {
                log::error!("eatyourgreens:: failed to create blob");
                return;
            }
        };

        let url = match Url::create_object_url_with_blob(&blob) {
            Ok(s) => s,
            Err(_) => {
                log::error!("eatyourgreens:: failed to create object URL");
                return;
            }
        };
        if let Some(window) = web_sys::window() {
            let msg = Message {
                op: "play_video",
                verb: None,
                win: None,
                score: None,
                video_url: Some(url),
            };
            Message::post(&window, &msg);
        } else {
            log::error!("eatyourgreens:: failed to get window and send os msg");
        }
    }

    pub fn os_play(&self, ctx: &context::Context) {
        log::debug!("eatyourgreens:: os play game:");
    }

    pub fn os_quit() {
        log::debug!("eatyourgreens:: os quit");
    }
}

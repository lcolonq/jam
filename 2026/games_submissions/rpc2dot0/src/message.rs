use serde::Serialize;
use std::fmt::Debug;

#[derive(Serialize, Debug)]
pub struct Message<'a> {
    pub op: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verb: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub win: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub score: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_url: Option<String>,
}

impl<'a> Message<'a> {
    pub fn post<MSG>(window: &web_sys::Window, msg: &MSG)
    where
        MSG: Serialize + Debug,
    {
        log::info!("eatyourgreens:: post message: {:?}", msg);
        let js_value = serde_wasm_bindgen::to_value(msg).unwrap();
        let _ = window.post_message(&js_value, "*");
    }
}

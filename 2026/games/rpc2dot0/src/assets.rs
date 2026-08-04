teleia_macros::generate_assets!("src/assets/");

pub const AUDIO_ASSETS: &[(&str, &[u8])] = &[
    ("crunch", include_bytes!("assets/audio/crunch.wav")),
    ("fart", include_bytes!("assets/audio/fart.wav")),
    ("explosion", include_bytes!("assets/audio/explosion.wav")),
];

pub const VIDEO_ASSETS: &[(&str, &[u8])] = &[
    (
        "seks_is_bad.mp4",
        include_bytes!("assets/video/adzzz/seks_is_bad.mp4"),
    ),
    (
        "seks_is_gud.mp4",
        include_bytes!("assets/video/adzzz/seks_is_gud.mp4"),
    ),
    (
        "pinnesse_c.mp4",
        include_bytes!("assets/video/adzzz/pinnesse_c.mp4"),
    ),
    (
        "hyped_c.mp4",
        include_bytes!("assets/video/adzzz/hyped_c.mp4"),
    ),
    (
        "GG_win_c.mp4",
        include_bytes!("assets/video/adzzz/GG_win_c.mp4"),
    ),
    (
        "game_over_c.mp4",
        include_bytes!("assets/video/adzzz/game_over_c.mp4"),
    ),
    (
        "confused_c.mp4",
        include_bytes!("assets/video/adzzz/confused_c.mp4"),
    ),
];

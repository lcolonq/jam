use crate::assets;

#[derive(Debug, Copy, Clone, PartialEq, Eq)]

pub enum EntityColor {
    Red = 0,
    Green = 1,
    Bleu = 2,
    Yellow = 3,
}

pub trait ColorExt {
    fn texture(&self) -> assets::Texture;
}

impl ColorExt for EntityColor {
    fn texture(&self) -> assets::Texture {
        match self {
            EntityColor::Red => assets::Texture::Mrred,
            EntityColor::Green => assets::Texture::Mrgreen,
            EntityColor::Bleu => assets::Texture::Mrbleu,
            EntityColor::Yellow => assets::Texture::Mryellow,
        }
    }
}

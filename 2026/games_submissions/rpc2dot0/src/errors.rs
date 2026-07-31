use crate::color::EntityColor;

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum ClickOutcome {
    Hit(EntityColor),
    Miss,
}

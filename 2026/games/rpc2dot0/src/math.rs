pub use glam::Vec2;

pub trait BoundingCircle {
    fn center(&self) -> Vec2;
    fn radius(&self) -> f32;

    // Intersection between two bounding circles.
    // compares squared distance to squared sum of radiuSUS (*insert mrGreen.png*),
    // tl;dr: a naive collision detection.
    fn overlaps_with(&self, other: &impl BoundingCircle) -> bool {
        let radius_sum = self.radius() + other.radius();
        self.center().distance_squared(other.center()) <= radius_sum * radius_sum
    }
}

#[derive(Clone, Copy)]
pub struct Rectangle {
    pub min: Vec2,
    pub max: Vec2,
}

pub trait ContainsPoint {
    fn contains(&self, point: Vec2) -> bool;
}

impl ContainsPoint for Rectangle {
    fn contains(&self, point: Vec2) -> bool {
        point.cmpge(self.min).all() && point.cmple(self.max).all()
    }
}

impl Rectangle {
    pub const fn from_xywh(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self {
            min: Vec2::new(x, y),
            max: Vec2::new(x + width, y + height),
        }
    }

    pub const fn from_min_max(min: Vec2, max: Vec2) -> Self {
        Self { min, max }
    }

    #[allow(dead_code)]
    pub fn overlaps(&self, other: &Rectangle) -> bool {
        self.min.cmple(other.max).all() && self.max.cmpge(other.min).all()
    }
}

pub fn parse_coords(coords: &str) -> (f32, f32) {
    let mut parts = coords.split(',');
    let x: f32 = parts.next().unwrap_or("0").parse().unwrap_or(0.0);
    let y: f32 = parts.next().unwrap_or("0").parse().unwrap_or(0.0);
    (x, y)
}

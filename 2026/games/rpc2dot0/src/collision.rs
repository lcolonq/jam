use crate::color::EntityColor;
use crate::constants::{MAX_SPEED, MIN_SPEED, SPEED_COLLIDE_MULT};
use crate::entity::Entity;
use crate::math::BoundingCircle;
use crate::random::RandomState;

pub fn detect_collisions(entities: &[Entity], buffer: &mut Vec<(usize, usize)>) {
    buffer.clear();
    let len = entities.len();

    for i in 0..len {
        if !entities[i].alive {
            continue;
        }
        for j in (i + 1)..len {
            if !entities[j].alive {
                continue;
            }
            if entities[i].overlaps_with(&entities[j]) {
                buffer.push((i, j));
            }
        }
    }
}

pub fn process_collisions(
    entities: &mut Vec<Entity>,
    rng: &mut RandomState,
    _next_entity_id: &mut u32,
    collision_buffer: &mut Vec<(usize, usize)>,
    elapsed_ms: f32,
    _events: &mut Vec<String>,
) {
    detect_collisions(entities, collision_buffer);

    let new_entities = Vec::new();

    for &(i, j) in collision_buffer.iter() {
        if i >= entities.len() || j >= entities.len() {
            continue;
        }
        if !entities[i].alive || !entities[j].alive {
            continue;
        }

        let color_a = entities[i].color;
        let color_b = entities[j].color;

        match (color_a, color_b) {
            (EntityColor::Green, EntityColor::Green) => {
                if (rng.next_u32() & 1) == 0 {
                    entities[i].color = EntityColor::Yellow;
                    entities[j].color = EntityColor::Red;
                    entities[j].spawn_time_ms = Some(elapsed_ms);
                } else {
                    entities[i].color = EntityColor::Red;
                    entities[i].spawn_time_ms = Some(elapsed_ms);
                    entities[j].color = EntityColor::Yellow;
                }
            }
            (EntityColor::Red, EntityColor::Red) => {
                let a = &entities[i];
                let b = &entities[j];
                let collision_point = (a.pos + b.pos) * 0.5;

                entities[i].alive = false;
                entities[j].alive = false;

                let best_green_idx = entities
                    .iter()
                    .enumerate()
                    .filter(|(_, e)| e.alive && e.color == EntityColor::Green)
                    .min_by(|(_, e1), (_, e2)| {
                        e1.pos
                            .distance_squared(collision_point)
                            .partial_cmp(&e2.pos.distance_squared(collision_point))
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .map(|(idx, _)| idx);

                if let Some(idx) = best_green_idx {
                    entities[idx].alive = false;
                }
            }
            _ => {
                let a_speed = (entities[i].speed * SPEED_COLLIDE_MULT).clamp(MIN_SPEED, MAX_SPEED);
                let b_speed = (entities[j].speed * SPEED_COLLIDE_MULT).clamp(MIN_SPEED, MAX_SPEED);
                entities[i].speed = a_speed;
                entities[j].speed = b_speed;
                entities[i].normalize_velocity();
                entities[j].normalize_velocity();
            }
        }
    }

    if !new_entities.is_empty() {
        entities.extend(new_entities);
    }
}

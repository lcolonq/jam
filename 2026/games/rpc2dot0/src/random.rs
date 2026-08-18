use crate::color::EntityColor;
use crate::constants::get_baseline_ratio;
use crate::math::Vec2;

use rand::{Rng, RngCore, SeedableRng};
use rand_chacha::ChaCha8Rng;

#[derive(Debug, Clone)]
pub struct RandomState {
    rng: ChaCha8Rng,
}

impl RandomState {
    /// RandomState::new(0x67676767) when debugging
    pub fn new(seed: usize) -> Self {
        log::info!("eatyourgreens:: RandomState new seed is {:?}", seed);
        Self {
            rng: ChaCha8Rng::seed_from_u64(seed as u64),
        }
    }

    pub fn next_u32(&mut self) -> u32 {
        self.rng.next_u32()
    }

    pub fn next_f32(&mut self) -> f32 {
        self.rng.r#gen::<f32>()
    }

    pub fn next_range(&mut self, min: f32, max: f32) -> f32 {
        self.rng.gen_range(min..max)
    }

    pub fn next_unit_vector(&mut self) -> Vec2 {
        let angle = self.rng.gen_range(0.0..std::f32::consts::TAU);
        Vec2::new(angle.cos(), angle.sin())
    }

    pub fn next_bool(&mut self, p: f64) -> bool {
        self.rng.gen_bool(p)
    }

    // this is used for rogue colors,
    // when used for random spawn, there is a risk
    // of color overcrowding. (like too much green or whatever)
    pub fn random_color(&mut self) -> EntityColor {
        let next_color_prob = self.next_f32();
        match next_color_prob {
            x if x < 0.60 => EntityColor::Green,
            x if x < 0.80 => EntityColor::Yellow,
            x if x < 0.90 => EntityColor::Red,
            _ => EntityColor::Bleu,
        }
    }

    // don't give it too much toughts this is designed by a clanker (cause too much math hurts my soul, I am not sorry)
    // coded by yours truely something within the spirit of
    // wiki :
    // https://en.wikipedia.org/wiki/Fitness_proportionate_selection
    // https://en.wikipedia.org/wiki/Reservoir_sampling#Weighted_random_sampling

    // we try to have a basline that is adjustable by difficulty
    // then we have weights for our biased random picker
    // used to spanwing entities
    // seed compatiable aka : reproducible behaviour with a fixed D and S (D=difficulty, S=seed)
    /*
       difficulty 1.0 => Green: 0.60  Red: 0.10   (baseline, no shift)
       difficulty 1.5 => Green: 0.525 Red: 0.175  (shift = 0.075)
       difficulty 2.0 => Green: 0.45  Red: 0.25   (shift = 0.15)
       difficulty 3.0 => Green: 0.30  Red: 0.40   (shift = 0.30)
       difficulty 5.0 => Green: 0.05  Red: 0.65   (capped: Green can't go below 5%)
    */
    // not tested and I won't test it, fuck that.
    pub fn random_color_biased(&mut self, counts: [u32; 4], difficulty: f32) -> EntityColor {
        let baseline: [f32; 4] = {
            let mut b = [0.0f32; 4];
            b[EntityColor::Red as usize] = get_baseline_ratio(EntityColor::Red, difficulty);
            b[EntityColor::Green as usize] = get_baseline_ratio(EntityColor::Green, difficulty);
            b[EntityColor::Bleu as usize] = get_baseline_ratio(EntityColor::Bleu, difficulty);
            b[EntityColor::Yellow as usize] = get_baseline_ratio(EntityColor::Yellow, difficulty);
            b
        };

        let total = counts.iter().sum::<u32>().max(1) as f32;

        let mut weights = [0.0f32; 4];
        for i in 0..4 {
            let actual_ratio = counts[i] as f32 / total;
            weights[i] = (2.0 * baseline[i] - actual_ratio).max(0.05);
        }
        let sum: f32 = weights.iter().sum();
        let roll: f32 = self.next_f32() * sum;
        let mut cumulative: f32 = 0.0f32;
        for (i, &w) in weights.iter().enumerate() {
            cumulative += w;
            if roll < cumulative {
                return match i {
                    0 => EntityColor::Red,
                    1 => EntityColor::Green,
                    2 => EntityColor::Bleu,
                    _ => EntityColor::Yellow,
                };
            }
        }
        unreachable!("Should never happen")
    }
}

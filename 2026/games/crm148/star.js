
import { getCosmos } from './cosmos.js';
import { globalView } from './view.js';
import Vec2 from './vec2.js';
import Color from './color.js';
import Pulse from './pulse.js';

var cosmos;

export default class Star {
    pos = Vec2.zero();
    radius;

    difficulty_mult = 0.2;
    growth_base = 3;

    pulses = [];
    state = 'state_glowing';

    energy = 5;
    growth_rate;

    constructor(radius, difficulty) {
        cosmos = getCosmos();
        this.radius = radius;
        const diff_adjust = 1.0 + difficulty * this.difficulty_mult;
        this.growth_rate = this.growth_base + diff_adjust;
    }

    update(dt) {
        this.energy += dt * this. growth_rate;
        if (this[this.state]) {
            this[this.state](dt);
        }
    }

    state_glowing(dt) {
        if (this.energy > cosmos.thresh_crit) {
            this.state = 'state_critical';
        }
    }

    // Multiply the energy by a random value
    // If the result is over the threshold, dump that energy into a pulse
    state_critical(dt) {
        var rand = 0.1 + 0.8 * Math.random();
        var strength = Math.min(rand * this.energy, cosmos.pulse_max_str);
        if (strength > cosmos.pulse_min_str) {
            this.energy -= strength;
            cosmos.pulses.push(Pulse.StrengthPulse(this.radius, strength));
        }
    }

    getColor() {
        var color = Color.StarColor;
        switch (this.state) {
        case 'state_glowing':
            color = Color.interpolate(Color.StarDim,
                                      Color.StarBright,
                                      this.energy / cosmos.thresh_crit);
            break;
        case 'state_critical':
            color = Color.StarBright;
            break;
        }
        return color.to_string();
    }

    render(ctx) {
        const view = globalView();
        var s_pos = view.project(this.pos);
        var surface_vec = view.project(new Vec2(this.radius, this.pos.y));
        var s_rad = surface_vec.x - s_pos.x;
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.arc(s_pos.x, s_pos.y, s_rad, 0, 2 * Math.PI);
        ctx.fill();
    }
}

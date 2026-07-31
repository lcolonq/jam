
import { getCosmos } from './cosmos.js';
import { randomAngle, toDegreesInt, normalizeAngle } from './util.js';
import { globalView } from './view.js';
import Vec2 from './vec2.js';
import Color from './color.js';

var cosmos;

export default class Pulse {
    angle0;
    angle1;
    radius;
    maxradius = Math.sqrt((gameCanvas.width * gameCanvas.width) +
                          (gameCanvas.height * gameCanvas.height)) / 2;
    velocity;
    state = 'state_growing';
    energy;

    constructor(angle0, arcLength, radius, velocity, energy) {
        this.angle0 = normalizeAngle(angle0);
        this.angle1 = normalizeAngle(angle0 + arcLength);
        this.radius = radius;
        this.velocity = velocity;
        this.energy = energy;
        if (!cosmos) {
            cosmos = getCosmos();
        }
    }

    static StrengthPulse(radius, strength) {
        if (!cosmos) {
            cosmos = getCosmos();
        }
        // console.log('pulse strength',strength);
        var str_factor = 0.8 * (strength / cosmos.pulse_max_str);
        return new Pulse(cosmos.angle,
                         (2 * Math.PI) * str_factor,
                         radius,
                         cosmos.pulse_vel_base * str_factor,
                         strength
                        );
    }


    contains(p, tolerance) {
        var angle = Math.atan2(p.y, p.x);
        if (Math.abs(p.length() - this.radius) < 2) {
            var da1 = toDegreesInt(normalizeAngle(angle - this.angle0));
            var da2 = toDegreesInt(normalizeAngle(this.angle1 - angle));
            // console.log('da1:', da1, 'da2:', da2);
            if (da1 > 0 && da2 > 0) {
                return true;
            }
        }
        return false;
    }


    render(ctx) {
        const view = globalView();
        const center = view.project(Vec2.zero());
        ctx.strokeStyle = Color.PulseColor.to_string();
        ctx.beginPath();
        ctx.arc(center.x, center.y, this.radius, -this.angle0, -this.angle1, true);
        ctx.stroke();
    }

    update(dt) {
        if (this[this.state]) {
            this[this.state](dt);
        }
    }

    intensity = 0;
    launch_intensity = 2;

    state_birth(dt) {
        this.intensity += dt;
        if (this.intensity > this.launch_intensity) {
            this.state = 'state_growing';
        }
    }

    state_growing(dt) {
        this.radius += this.velocity * dt;
        if (this.radius > this.maxradius) {
            this.state = 'state_dying';
        }
    }

    state_dying(dt) {
        cosmos.dissipate(this.energy);
        this.state = 'state_dead';
    }

    state_dead(dt) {
    }

    is_alive() {
        return this.state !== 'state_dead';
    }
}

window.Pulse = Pulse;

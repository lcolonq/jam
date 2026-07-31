
import Vec2 from './vec2.js';
import { randomAngle, toDegreesInt, normalizeAngle, drawSquare } from './util.js';
import { getCosmos } from './cosmos.js';
import { globalView } from './view.js';
import Color from './color.js';
import { death, debugKey } from './control.js';

var cosmos;
var view;

window.testAngle = Math.PI / 4;

const max_thrust_factor = 6;

class Ship {
    pos;
    vel;
    thrust = 0;
    max_thrust;
    heading = 0;

    state = 'state_living';
    death_counter = 0;
    death_thresh = 0.3;

    constructor(pos, vel, heading) {
        cosmos = getCosmos();
        view = globalView();
        this.pos = pos;
        this.heading = heading;
        this.vel = vel;
        this.max_thrust = cosmos.gravity * max_thrust_factor;
        debugKey('ship', this);
    }

    static AboveRadius(radius, max_size) {
        cosmos = getCosmos();
        // var altitude = radius + Math.random() * (max_size - radius)
        var altitude = radius + (0.25 + Math.random() * 0.125) * (max_size - radius)
        var angle = randomAngle();
        // var angle = Math.PI / 2;
        var pos = Vec2.fromHeadingLength(angle, altitude);
        var vel = pos.ofLength(cosmos.gravity * 70.0);
        var ship = new Ship(pos, vel, angle);
        return ship;
    }



    /// Behavior
    update(dt) {
        if (this[this.state]) {
            this[this.state](dt);
        }
    }

    state_living(dt) {
        this.applyPhysics(dt);
        var death = this.checkDeath();
        if (death) {
            this.state = 'state_dying';
        }
    }

    state_dying(dt) {
        this.death_counter += dt;
        // console.log('death_counter', this.death_counter);
        if (this.death_counter > this.death_thresh) {
            this.state = 'state_dead';
        }
    }

    state_dead(dt) {
        death();
    }


    start_testing(dt) {
        this.state = 'state_testing';
        this.pos = Vec2.fromHeadingLength(window.testAngle, 70);
        // this.pos = view.unproject(new Vec2(3 / 4 * gameCanvas.width, gameCanvas.height / 2));
        this.state_testing(dt);
    }

    state_testing(dt) {
        debugKey('ship', this);
        var death = this.checkDeath();
        debugKey('death', death);
    }



    /// Physics
    applyPhysics(dt) {
        var grav = this.pos.ofLength(-cosmos.gravity);
        var thrust = Vec2.fromHeadingLength(this.heading, this.thrust * this.max_thrust);
        var forces = grav.add(thrust);
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.add(forces);
    }

    checkDeath() {
        return this.checkBoundary() ||
            this.checkStar() ||
            this.checkPulses();
    }

    checkBoundary() {
        if (Math.max(Math.abs(this.pos.x), Math.abs(this.pos.y)) > cosmos.max_size) {
            return true;
        }
        return false;
    }

    checkStar() {
        const altitude = this.pos.length();
        if (altitude < cosmos.star.radius) {
            return true;
        }
        return false;
    }

    checkPulses() {
        var angle = this.pos.heading();
        var altitude = this.pos.length();
        for (var p of cosmos.pulses) {
            if (p.contains(this.pos, 2)) {
                return true;
            }
        }
        return false;
    }



    /// Control
    inputTarget(coord) {
        var rel = coord.sub(this.pos);
        debugKey('rel', rel);
        this.heading = rel.heading();
    }

    inputThrust(thrust) {
        this.thrust = thrust;
    }



    /// Rendering
    getColor() {
        var color = Color.PlayerColor.to_string();
        if (this.state === 'state_dying') {
            color = '#ff1515';
        }
        return color;
    }

    render(ctx) {
        var sPos = view.project(this.pos);
        var color = this.getColor();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        drawSquare(ctx, sPos, 3);

        var sHeading = new Vec2(Math.cos(this.heading), Math.sin(this.heading)).add(sPos);
        drawSquare(ctx, sHeading, 2);
        ctx.beginPath();
        ctx.moveTo(sPos.x, sPos.y);
        ctx.lineTo(sHeading.x, sHeading.y);
        ctx.stroke();
    }
}



export default Ship;

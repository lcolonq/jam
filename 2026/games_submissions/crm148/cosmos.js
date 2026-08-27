import {
    victory,
    getDebugInfo,
    debugKey,
} from './control.js';
import Ship from './ship.js';
import Star from './star.js';

import Vec2 from './vec2.js';
import { drawSquare } from './util.js';
import { globalView } from './view.js';

var view;

class Cosmos {
    pulses = [];
    star;
    player;
    running;

    dissipated;
    dissipated_target;
    dissipated_target_base = 50;

    gravity = .008;
    thresh_crit = 5.00;
    max_size = (Math.min(gameCanvas.width, gameCanvas.height) / 2) + 100;
    pulse_min_str = 7;
    pulse_max_str = 20;
    pulse_vel_base = 70.0;

    angle = 1;
    omega = 1.0;

    init(difficulty) {
        view = globalView();
        const STRAD = 9;
        const DIFFMUL = 3;
        var starRadius = STRAD + difficulty * DIFFMUL;
        this.star = new Star(starRadius, difficulty);
        this.pulses = [];
        this.player = Ship.AboveRadius(starRadius, this.max_size);
        this.dissipated = 0;
        this.dissipated_target = this.dissipated_target_base + 1 * (difficulty * 1.2);
        this.omega = 1.0 + (0.2 * difficulty);
        this.running = true;
    }

    stop() {
        this.running = false;
        // console.log('stop the world');
    }

    dissipate(energy) {
        this.dissipated += energy;
        debugKey('dissipated', this.dissipated);
    }

    update(dt) {
        this.angle = (this.angle + this.omega * dt) % (2 * Math.PI);
        this.player.update(dt);
        this.star.update(dt);
        this.pulses.forEach((p) => p.update(dt));
        this.pulses = this.pulses.filter((p) => { return p.is_alive() });
        if (this.dissipated > this.dissipated_target) {
            victory();
        }
    }

    render() {
        ctx.fillStyle = "#151515";
        ctx.strokeStyle = "#eeeeee";
        ctx.fillRect(0,0, gameCanvas.width, gameCanvas.height);
        this.star.render(ctx);
        this.pulses.forEach((p) => p.render(ctx));
        this.player.render(ctx);
        // debugP.textContent = JSON.stringify(getDebugInfo());

        // this.renderSpin();
    }

    renderSpin() {
        ctx.fillStyle = "#ff1515";
        ctx.strokeStyle = "#ff1515";
        var p = view.project(new Vec2(Math.cos(this.angle),
                                      Math.sin(this.angle)).scale(this.star.radius + 5));
        drawSquare(ctx, p, 4);
        var center = view.project(Vec2.zero());
        var radius = center.sub(p).length();

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, -this.angle, -this.angle - 0.4, true);
        ctx.stroke();
    }
}

var theCosmos = new Cosmos();
var ctx = gameCanvas.getContext("2d");

window.cosmos = theCosmos;

function getCosmos() {
    return theCosmos;
}

export {
    Cosmos,
    getCosmos,
}

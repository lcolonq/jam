
import { View, globalView } from './view.js';
import { getCosmos } from './cosmos.js';
import Vec2 from './vec2.js';

import { victory, death, initInput, getDebugInfo } from './control.js';

startButton.onclick = function (ev) {
    window.postMessage({op:"start", difficulty: 1});
}

plusButton.onclick = function(ev) {
    window.testAngle += 0.1;
}

minusButton.onclick = function(ev) {
    window.testAngle -= 0.1;
}

testButton.onclick = function (ev) {
    if (!cosmos) {
        cosmos = getCosmos();
        cosmos.init(1);
        initInput(cosmos);
    }

    cosmos.running = false;
    cosmos.player.state = 'start_testing';

    cosmos.pulses = [
        new Pulse(Math.PI / 4, Math.PI, 70, 0, 30),
    ];

    cosmos.update(0);
    cosmos.render();

    //     if (!cosmos.running) {
    //         if (lasttime === undefined) {
    //             render(0);
    //             lasttime = undefined;
    //             starttime = undefined;
    //         } else {
    //             render(lasttime);
    //         }
    //     }
}

var cosmos;

function start(difficulty) {
    cosmos = getCosmos();
    cosmos.init(difficulty);
    initInput(cosmos);

    window.requestAnimationFrame(render);
    // TODO: set up mouse input listener, remove it on game over
    window.parent.postMessage({op: "started", verb: "dodge!"});
}

// input - mouse click
// point the ship and thrust
// add particle (time, position, velocity)
// expire the particles - maybe wait until all of them are over time limit so
// new ones keep the old ones alive
// fade to black and keep it there
// smoke on the grey background of space

// TODO: game is over after some amount of energy (increases with difficulty) is
// expelled from the star
function nop() {
    ;
}

var starttime;
var lasttime;
// var start = startGame;

function render(timestamp) {
    if (starttime === undefined) {
        starttime = timestamp;
        lasttime = starttime;
    } else {
        nop();
    }
    // const elapsed = timestamp - starttime;
    const dt = (timestamp - lasttime) / 1000.0;
    cosmos.update(dt);
    cosmos.render();
    lasttime = timestamp;
    if (cosmos.running) {
        window.requestAnimationFrame(render);
    } else {
        // console.log('over');
    }
}


export {
    start,
}


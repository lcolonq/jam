
import Vec2 from './vec2.js';
import { globalView } from './view.js';

var gCosmos;
var view;



/// Game state
function victory() {
    window.parent.postMessage({op: "done", win: true});
    shutdown();
}

function death() {
    window.parent.postMessage({op: "done", win: false});
    shutdown();
}

function shutdown() {
    gCosmos.stop();
    gameCanvas.removeEventListener('mousedown', mousedown);
    gameCanvas.removeEventListener('mouseup', mouseup);
}



/// Input
function initInput(cosmos) {
    gameCanvas.addEventListener('mousedown', mousedown);
    gameCanvas.addEventListener('mouseup', mouseup);
    gCosmos = cosmos;
    view = globalView();
}

function mousedown(ev) {
    var ship = gCosmos.player;
    ship.inputTarget(getMouseCoord(ev));
    ship.inputThrust(1.0);
    gameCanvas.addEventListener('mousemove', mousemove);
}

function mouseup(ev) {
    var ship = gCosmos.player;
    gameCanvas.removeEventListener('mousemove', mousemove);
    ship.inputThrust(0.0);
}

function mousemove(ev) {
    var ship = gCosmos.player;
    ship.inputTarget(getMouseCoord(ev));
}

function getMouseCoord(ev) {
    var coord = view.unproject(new Vec2(ev.clientX, ev.clientY));
    return coord;
}


var debugInfo = {};
function debugKey(k, v) {
    debugInfo[k] = v;
}
function getDebugInfo() {
    return debugInfo;
}



/// Exports
export {
    initInput,
    victory,
    death,
    debugKey,
    getDebugInfo,
}

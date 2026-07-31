
import Vec2 from './vec2.js';

class View {
    center = Vec2.zero();
    zoom = 1.0;

    // Convert game coordinate to canvas coordinate
    project(vec2) {
        return new Vec2(
            (gameCanvas.width / 2) + ((vec2.x - this.center.x) * this.zoom),
            (gameCanvas.height / 2) - ((vec2.y - this.center.y) * this.zoom));
    }
    // Covert canvas coordinate to game coordinate
    unproject(vec2) {
        return new Vec2(
            this.center.x + (vec2.x - (gameCanvas.width / 2)) / this.zoom,
            this.center.y - (vec2.y - (gameCanvas.height/2)) / this.zoom);
    }
}

function globalView() {
    return gView;
}

var gView = new View();
window.view = gView;

export {
    View,
    globalView,
}

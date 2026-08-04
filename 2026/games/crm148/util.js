function randomAngle() {
    return Math.random() * Math.PI * 2;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

function toDegreesInt(radians) {
    return Math.floor(toDegrees(radians));
}

function normalizeAngle(radians) {
    return (radians + Math.PI) % (2 * Math.PI) - Math.PI;
}

function drawSquare(ctx, v2, size) {
    const off = size / 2;
    ctx.fillRect(v2.x - off, v2.y - off, size, size);
}

export {
    randomAngle,
    toDegrees,
    toDegreesInt,
    normalizeAngle,
    drawSquare,
}

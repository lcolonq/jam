
export default class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static zero() {
        return new Vec2(0, 0);
    }

    static fromHeading(radians) {
        return new Vec2(Math.cos(radians), Math.sin(radians));
    }

    static fromHeadingLength(radians, length) {
        return Vec2.fromHeading(radians).scale(length);
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }

    scale(factor) {
        this.x *= factor;
        this.y *= factor;
        return this;
    }

    scaled(factor) {
        return new Vec2(this.x * factor, this.y * factor);
    }

    ofLength(newLength) {
        return this.normalized().scale(newLength);
    }

    add(v2) {
        return new Vec2(this.x + v2.x, this.y + v2.y);
    }

    sub(v2) {
        return new Vec2(this.x - v2.x, this.y - v2.y);
    }

    normalize() {
        var len = this.length();
        this.x = this.x / len;
        this.y = this.y / len;
        return this;
    }

    normalized() {
        var len = this.length();
        return new Vec2(this.x / len, this.y / len);
    }
}

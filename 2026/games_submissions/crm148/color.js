
const lerp = (start, end, t) => start + (end - start) * t;

export default class Color {
    r = 0;
    g = 0;
    b = 0;
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    to_string() {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;

    }

    static interpolate(color1, color2, t) {
        const r = Math.round(lerp(color1.r, color2.r, t));
        const g = Math.round(lerp(color1.g, color2.g, t));
        const b = Math.round(lerp(color1.b, color2.b, t));

        return new Color(r,g,b);
    }
    static PlayerColor = new Color(150, 200, 150);
    static StarDim = new Color(0x77, 0x11, 0x11);
    static StarColor = new Color(0xbb, 0x33, 0x33);
    static StarBright = new Color(0xbb, 0x33, 0x33);
    static PulseColor = new Color(0xcc, 0x22, 0x22);
}

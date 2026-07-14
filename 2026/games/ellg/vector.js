export class Vector {
  static of([x, y]) {
    return new Vector(x, y)
  }

  constructor(x, y) {
    this.x = x
    this.y = y
  }

  add(val) {
    return new Vector(this.x + val.x, this.y + val.y)
  }

  subtract(val) {
    return new Vector(this.x - val.x, this.y - val.y)
  }

  multiply(scalar) {
    return new Vector(this.x * scalar, this.y * scalar)
  }

  divide(scalar) {
    return new Vector(this.x / scalar, this.y / scalar)
  }

  dot(other) {
    return this.x * other.x + this.y * other.y
  }

  cross(other) {
    return this.x * other.y - other.x * this.y
  }

  hadamard(other) {
    return new Vector(this.x * other.x, this.y * other.y)
  }

  length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  distance(other) {
    return this.subtract(other).length()
  }

  normalize() {
    const length = this.length()
    if (length === 0) {
      return new Vector(0, 0)
    }
    return new Vector(this.x / length, this.y / length)
  }

  rotateByRadians(radians) {
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos)
  }

  rotateByDegrees(degrees) {
    return this.rotateByRadians((degrees * Math.PI) / 180)
  }
}

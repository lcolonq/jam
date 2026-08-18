const WIDTH = 240;
const HEIGHT = 160;

const HOOK_WIDTH = 24;
const HOOK_HEIGHT = 40;

// TODO: Misters of size 24 are tweaking.
const MISTER_SIZES = [16, 20, 28, 32];

class AssetManager {
  /** @type {HTMLImageElement[]} */
  images = [];
  /** @type {HTMLAudioElement[]} */
  sounds = [];

  /** @type {HTMLImageElement} */
  green;
  /** @type {HTMLImageElement} */
  hook;
  /** @type {HTMLImageElement} */
  red;
  /** @type {HTMLImageElement} */
  water;

  /** @type {HTMLAudioElement} */
  lose;
  /** @type {HTMLAudioElement} */
  win;

  constructor() {
    this.green = new Image();
    this.green.src = "assets/green.webp";
    this.images.push(this.green);

    this.hook = new Image();
    this.hook.src = "assets/hook.png";
    this.images.push(this.hook);

    this.numbers = new Image();
    this.numbers.src = "assets/numbers.png";
    this.images.push(this.numbers);

    this.red = new Image();
    this.red.src = "assets/red.webp";
    this.images.push(this.red);

    this.water = new Image();
    this.water.src = "assets/water.png";
    this.images.push(this.water);

    this.lose = new Audio();
    this.lose.src = "assets/lose.wav";
    this.lose.load();
    this.sounds.push(this.lose);

    this.win = new Audio();
    this.win.src = "assets/win.wav";
    this.win.load();
    this.sounds.push(this.win);
  }
}

const state = {
  /** @type {?HTMLCanvasElement} */
  canvas: null,
  /** @type {?CanvasRenderingContext2D} */
  ctx: null,

  /** @type {boolean} */
  ready: false,

  /** @type {boolean} */
  started: false,
  /** @type {number} */
  difficulty: 0,

  /** @type {number} */
  frameCounter: 0,
  /** @type {number} */
  previousFrameTime: 0,
  /** @type {boolean} */
  resetPreviousFrameTime: false,
  /** @type {number} */
  targetFrameTime: 1000 / 60,

  /** @type {number} */
  mousePosX: 0,
  /** @type {boolean} */
  lmbPressed: false,
  /** @type {boolean} */
  rmbPressed: false,

  /** @type {AssetManager} */
  assetManager: new AssetManager(),

  /** @type {number} */
  hookX: 0,
  /** @type {number} */
  hookY: 0,
  /** @type {number} */
  hookVelocity: -1,

  /** @type {Mister[]} */
  misters: [],
  /** @type {boolean} */
  yoinkingMister: false,
  /** @type {boolean} */
  ceaseYoinkage: false,

  /** @type {number} */
  elapsed: 0,
  /** @type {number} */
  timer: 7,

  /** @type {boolean} */
  won: false,
  /** @type {number} */
  wonFrames: 0,
  /** @type {boolean} */
  lost: false,
  /** @type {number} */
  lostFrames: 0,
};

const resetState = () => {
  state.ceaseYoinkage = false;
  state.difficulty = 0;
  state.elapsed = 0;
  state.hookVelocity = -1;
  state.lmbPressed = false;
  state.lost = false;
  state.lostFrames = 0;
  state.misters = [];
  state.previousFrameTime = 0;
  state.rmbPressed = false;
  state.started = false;
  state.timer = 7;
  state.won = false;
  state.wonFrames = 0;
  state.yoinkingMister = false;
};

class Mister {
  /** @type {HTMLImageElement} */
  image;

  /** @type {boolean} */
  isBad;

  /** @type {number} */
  size;

  /** @type {number} */
  x;
  /** @type {number} */
  y;

  /** @type {number} */
  velocity;

  /** @type {boolean} */
  canBeYoinked;
  /** @type {number} */
  yoinkCooldown;
  /** @type {boolean} */
  isBeingYoinked;

  /** @type {boolean} */
  shouldBePurged;

  /**
   * @param {HTMLImageElement} image
   * @param {boolean} isBad
   */
  constructor(image, isBad) {
    this.image = image;
    this.isBad = isBad;

    this.size = MISTER_SIZES[Math.floor(Math.random() * MISTER_SIZES.length)];

    const left = Math.random() < 0.5;
    this.x = left ? -this.size : WIDTH;

    const minY = this.isBad ? HOOK_HEIGHT + 15 : HEIGHT - 64;
    this.y = getRandomInt(minY, HEIGHT - this.size / 2);

    const maxSpeed = 2 + Math.floor(state.difficulty / 5);
    const speed = getRandomInt(1, maxSpeed);
    this.velocity = left ? speed : -speed;

    this.canBeYoinked = true;
    this.yoinkCooldown = 0;
    this.isBeingYoinked = false;

    this.shouldBePurged = false;
  }

  draw() {
    state.ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }

  async update() {
    this.yoinkCooldown -= 1;
    if (this.yoinkCooldown < 0) {
      this.canBeYoinked = true;
    }

    if (!this.isBeingYoinked) {
      this.x += this.velocity;
    } else {
      if (state.ceaseYoinkage) {
        state.yoinkingMister = false;
        state.ceaseYoinkage = false;

        this.canBeYoinked = false;
        this.yoinkCooldown = 60;
        this.isBeingYoinked = false;

        this.x += this.velocity;
      } else {
        this.x = state.hookX - this.size / 4;
        this.y = state.hookY + HOOK_HEIGHT / 2;
      }
    }

    if (this.isBeingYoinked && this.y <= -5) {
      if (this.isBad) {
        state.assetManager.lose.play();
        state.lost = true;
        state.lostFrames = 5;
      } else {
        state.assetManager.win.play();
        state.won = true;
        state.wonFrames = 5;
      }

      return;
    }

    if (
      !state.yoinkingMister &&
      this.canBeYoinked &&
      state.hookVelocity < 0 &&
      aabb(
        this.x,
        this.x + this.size,
        this.y,
        this.y + this.size,
        state.hookX,
        state.hookX + 15,
        state.hookY + 20,
        state.hookY + 30,
      )
    ) {
      state.yoinkingMister = true;
      this.isBeingYoinked = true;
    }

    this.shouldBePurged = this.x < 0 - this.size || this.x > WIDTH;
  }
}

const getRandom = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * @param {number} min
 * @param {number} max
 */
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * @param {number} left1
 * @param {number} right1
 * @param {number} top1
 * @param {number} bottom1
 * @param {number} left2
 * @param {number} right2
 * @param {number} top2
 * @param {number} bottom2
 */
const aabb = (left1, right1, top1, bottom1, left2, right2, top2, bottom2) => {
  return left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2;
};

/**
 * @param {number} currentTime
 */
const update = (currentTime) => {
  state.frameCounter += 1;

  if (state.resetPreviousFrameTime) {
    state.previousFrameTime = currentTime;
    state.resetPreviousFrameTime = false;
  }

  state.elapsed += (currentTime - state.previousFrameTime) / 1000;

  if (state.won && state.wonFrames <= 0) {
    window.parent.postMessage({ op: "done", win: true });
    resetState();
    return;
  }

  if (state.lost && state.lostFrames <= 0) {
    window.parent.postMessage({ op: "done", win: false });
    resetState();
    return;
  }

  if (state.wonFrames > 0 || state.lostFrames > 0) {
    state.misters = [];

    if (state.frameCounter % 24 === 0) {
      state.wonFrames -= 1;
      state.lostFrames -= 1;
    }

    return;
  }

  if (state.timer - Math.floor(state.elapsed) <= 0) {
    state.assetManager.lose.play();
    state.lost = true;
    state.lostFrames = 5;
    return;
  }

  state.hookY = Math.max(
    Math.min(state.hookY + state.hookVelocity, 160 - HOOK_HEIGHT),
    -((HOOK_HEIGHT / 4) * 3),
  );

  const spawnRate = 0.03 + Math.min(state.difficulty, 10) * 0.01;
  if (Math.random() < 0.03 + spawnRate) {
    const isBad =
      Math.random() >
      0.3 -
        (state.difficulty > 10 ? 0.1 : 0) +
        Math.floor(state.elapsed / 3) * 0.05;
    state.misters.push(
      new Mister(
        isBad ? state.assetManager.red : state.assetManager.green,
        isBad,
      ),
    );
  }

  state.misters.forEach((mister) => mister.update());
  state.misters = state.misters.filter((mister) => !mister.shouldBePurged);

  state.previousFrameTime = currentTime;
};

const draw = () => {
  state.ctx.drawImage(state.assetManager.water, 0, 0);

  if (state.lostFrames > 0 || state.wonFrames > 0) {
    const size =
      16 * 2 ** (5 - (state.won ? state.wonFrames : state.lostFrames));
    state.ctx.drawImage(
      state.won ? state.assetManager.green : state.assetManager.red,
      WIDTH / 2 - size / 2,
      HEIGHT / 2 - size / 2,
      size,
      size,
    );
    return;
  }

  const hook = state.assetManager.hook;
  state.hookX = Math.max(state.mousePosX - hook.width / 2, 0);
  state.hookX = Math.floor(Math.min(WIDTH - hook.width, state.hookX));
  state.ctx.drawImage(hook, state.hookX, state.hookY);

  if (state.hookY > 0) {
    state.ctx.lineWidth = 1;
    state.ctx.beginPath();
    state.ctx.moveTo(state.hookX + 18 - 0.5, 0);
    state.ctx.lineTo(state.hookX + 18 - 0.5, state.hookY);
    state.ctx.stroke();
  }

  state.misters.forEach((mister) => mister.draw());

  const timerStr = (state.timer - Math.floor(state.elapsed)).toString();

  // The magic `4` is the padding between digits so that they're not glued together.
  let x = WIDTH - 4 - (timerStr.length * 16 + (timerStr.length - 1) * 4);
  for (const strDigit of timerStr) {
    const digit = Number(strDigit);
    state.ctx.drawImage(
      state.assetManager.numbers,
      digit * 16,
      0,
      16,
      24,
      x,
      4,
      16,
      24,
    );
    x += 16 + 4;
  }
};

/**
 * @param {number} currentTime
 */
const frame = (currentTime) => {
  if (
    !state.ready &&
    state.assetManager.images.every((img) => img.complete) &&
    state.assetManager.sounds.every((sound) => sound.readyState === 4)
  ) {
    window.parent.postMessage({ op: "ready" });
    state.ready = true;

    state.previousFrameTime = currentTime;
  }

  if (state.started) {
    if (currentTime - state.previousFrameTime >= state.targetFrameTime) {
      update(currentTime);
    }

    draw();
  }

  requestAnimationFrame(frame);
};

const initialize = () => {
  window.addEventListener("message", (ev) => {
    switch (ev.data.op) {
      case "start":
        state.started = true;
        state.difficulty = ev.data.difficulty;
        state.timer = 10 + Math.floor(state.difficulty / 5);
        // This makes sure the countdown is correct. Ugly and there's probably a better solution.
        state.resetPreviousFrameTime = true;

        window.parent.postMessage({ op: "started", verb: "yoink!" });
        break;
      default:
        console.log(`[dżem] Unexpected event: ${ev}`);
        break;
    }
  });

  state.canvas = document.getElementById("dzem");
  state.ctx = state.canvas.getContext("2d");
  state.ctx.imageSmoothingEnabled = false;

  state.canvas.addEventListener("mousemove", (e) => {
    state.mousePosX = e.clientX;
  });

  state.canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      state.hookVelocity = 2;
    }
  });

  state.canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
      state.hookVelocity = -2;
    } else if (e.button === 2) {
      state.ceaseYoinkage = true;
    }
  });

  state.canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  frame(0);
};

initialize();

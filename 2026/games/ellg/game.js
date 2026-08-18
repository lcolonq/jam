import { Vector } from "./vector.js";

const WIDTH = 240;
const HEIGHT = 160;
const STANDALONE = window.self === window.top;
const DIFFICULTY = 4;

const canvas = document.getElementById("game");

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function notifyHarness(msg) {
  if (!STANDALONE) window.parent.postMessage(msg);
}

const music = new Audio("./assets/song.mp3");
music.loop = true;
music.volume = 0.5;

function playMusic() {
  music.currentTime = 0;
  music.play().catch(() => { });
}

function stopMusic() {
  music.pause();
}

export async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export async function loadAssets() {
  const [guy1, guy2, guy3, guy4, pot, table, beef1, beef2, hat, win, lose, hungry] = await Promise.all([
    loadImage("./assets/guy1.png"),
    loadImage("./assets/guy2.png"),
    loadImage("./assets/guy3.png"),
    loadImage("./assets/guy4.png"),
    loadImage("./assets/pot.png"),
    loadImage("./assets/table.png"),
    loadImage("./assets/beef1.png"),
    loadImage("./assets/beef2.png"),
    loadImage("./assets/chefhat.png"),
    loadImage("./assets/win.png"),
    loadImage("./assets/lose.png"),
    loadImage("./assets/hungry.png"),
  ]);

  return {
    guy1,
    guy2,
    guy3,
    guy4,
    pot,
    table,
    beef1,
    beef2,
    hat,
    win,
    lose,
    hungry
  };
};

let lastTime = 0;
let assets = {};
let state = {
  scene: null,
};

class Scene {
  constructor() { }

  draw(dt) { }
  update(dt) { }
  handleInput(dt) { }
  onClick(p) { }
}

const END_SCREEN_TIME = 3;

class EndScreen extends Scene {
  constructor(win) {
    super();

    stopMusic();

    this.win = win;
    this.t = 0;
    this.sent = false;
  }

  update(dt) {
    this.t += dt;

    if (!this.sent && this.t >= END_SCREEN_TIME) {
      this.sent = true;
      notifyHarness({ op: "done", win: this.win });
    }
  }
}

class WinScreen extends EndScreen {
  constructor() { super(true) }

  draw() {
    ctx.drawImage(assets.win, 0, 0);
  }
}

class GameOverScreen extends EndScreen {
  constructor(endType = "death") {
    super(false);
    this.endType = endType;
  }

  draw() {
    ctx.drawImage(this.endType === "death" ? assets.lose : assets.hungry, 0, 0);
    ctx.drawImage(assets.guy4, 50, 75);
  }
}

const POT = { x: 25, y: 90, size: 64 };
const POT_CENTER = Vector.of([POT.x + POT.size / 2, POT.y + POT.size / 2]);
const COLLECT_TIME = 0.4;

const BOUNDS = { x: 8, y: 8, w: 125, h: 96 };

class Icon {
  constructor(img, pos, correct) {
    this.img = img;
    this.pos = pos;
    this.size = 32;
    this.correct = correct;
    this.vel = new Vector(0, 0);
    this.collect = null;
    this.dead = false;
  }

  static spawn(img, correct, speed) {
    const icon = new Icon(img, Vector.of([0, 0]), correct);
    icon.pos = Vector.of([
      BOUNDS.x + Math.random() * (BOUNDS.w - icon.size),
      BOUNDS.y + Math.random() * (BOUNDS.h - icon.size),
    ]);
    const a = Math.random() * Math.PI * 2;
    icon.vel = new Vector(Math.cos(a), Math.sin(a)).multiply(speed);
    return icon;
  }

  center() { return this.pos.add(new Vector(this.size / 2, this.size / 2)); }

  contains(p) {
    return p.x >= this.pos.x && p.x <= this.pos.x + this.size &&
      p.y >= this.pos.y && p.y <= this.pos.y + this.size;
  }

  startCollect() {
    if (this.collect) return;
    this.collect = { t: 0, fromCenter: this.center() };
  }

  update(dt) {
    if (this.collect) {
      this.collect.t += dt;
      const k = Math.min(1, this.collect.t / COLLECT_TIME);
      const e = k * k;
      this._drawCenter = this.collect.fromCenter.add(
        POT_CENTER.subtract(this.collect.fromCenter).multiply(e));
      this._scale = 1 - k;
      if (k >= 1) this.dead = true;
      return;
    }

    this.pos = this.pos.add(this.vel.multiply(dt));
    const maxX = BOUNDS.x + BOUNDS.w - this.size;
    const maxY = BOUNDS.y + BOUNDS.h - this.size;
    if (this.pos.x < BOUNDS.x) { this.pos.x = BOUNDS.x; this.vel.x *= -1; }
    if (this.pos.x > maxX) { this.pos.x = maxX; this.vel.x *= -1; }
    if (this.pos.y < BOUNDS.y) { this.pos.y = BOUNDS.y; this.vel.y *= -1; }
    if (this.pos.y > maxY) { this.pos.y = maxY; this.vel.y *= -1; }
  }

  draw(ctx) {
    const c = this._drawCenter ?? this.center();
    const s = this.size * (this._scale ?? 1);
    ctx.drawImage(
      this.img,
      Math.round(c.x - s / 2), Math.round(c.y - s / 2),
      Math.round(s), Math.round(s),
    );
  }
}

function difficultyConfig(raw) {
  const K = 5;
  const d = raw / (raw + K);
  const lerp = (a, b) => a + (b - a) * d;
  return {
    correct: Math.round(lerp(3, 5)),
    decoys: Math.round(lerp(3, 10)),
    speed: lerp(20, 90),
    timeLimit: lerp(8, 4),
  };
}

function spawnIcons(cfg) {
  const icons = [];
  for (let i = 0; i < cfg.correct; i++) icons.push(Icon.spawn(assets.beef1, true, cfg.speed));
  for (let i = 0; i < cfg.decoys; i++) icons.push(Icon.spawn(assets.beef2, false, cfg.speed));
  return icons;
}

class GameScreen extends Scene {
  constructor(cfg) {
    super();
    this.cfg = cfg;
    this.timeTotal = cfg.timeLimit;
    this.timeLeft = cfg.timeLimit;
    this.state = {
      guy: {
        img: assets.guy2,
        pos: Vector.of([125, 50]),
        reactImg: null,
        reactT: 0,
      },
      icons: spawnIcons(cfg),
    };
  }

  draw() {
    const guy = this.state.guy;

    ctx.drawImage(guy.reactImg ?? guy.img, guy.pos.x, guy.pos.y);
    ctx.drawImage(assets.hat, guy.pos.x + 45, guy.pos.y - 25, 50, 50);
    ctx.drawImage(assets.table, 0, 50);

    for (const icon of this.state.icons) icon.draw(ctx);

    ctx.drawImage(assets.pot, POT.x, POT.y, POT.size, POT.size);

    const frac = this.timeLeft / this.timeTotal;
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(0, 0, WIDTH, 6);
    ctx.fillStyle = frac < 0.25 ? "#e44" : "#f2c14e";
    ctx.fillRect(0, 0, Math.round(WIDTH * frac), 6);
  }

  update(dt, ct) {
    if (this.state.guy.reactT > 0) {
      this.state.guy.reactT -= dt;
      if (this.state.guy.reactT <= 0) this.state.guy.reactImg = null;
    }

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.lose("hungry");
      return;
    }

    const baseY = 50;
    const amp = 4;
    const speed = 0.01;
    this.state.guy.pos.y = baseY + Math.round(Math.sin(ct * speed) * amp);

    for (const icon of this.state.icons) icon.update(dt);
    this.state.icons = this.state.icons.filter(i => !i.dead);
  }

  lose(endType = "death") {
    state.scene = new GameOverScreen(endType);
  }

  win() {
    state.scene = new WinScreen();
  }

  onClick(p) {
    for (let i = this.state.icons.length - 1; i >= 0; i--) {
      const icon = this.state.icons[i];
      if (icon.collect) continue;
      if (icon.contains(p)) {
        if (!icon.correct) { this.lose() }

        icon.startCollect();

        const correctLeft = this.state.icons.filter(x => x.correct && !x.collect).length;
        if (correctLeft === 0) this.win()

        if (icon.correct) {
          this.state.guy.reactImg = assets.guy3;
          this.state.guy.reactT = 2;
        };

        return;
      }
    }
  }
}

async function init() {
  assets = await loadAssets();
  notifyHarness({ op: "ready" });
}

function update(dt, ct) {
  if (state.scene) {
    state.scene.update(dt, Math.floor(ct));
  }
}

function draw(dt) {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (state.scene) {
    state.scene.draw(dt);
  }
}

function handleInput(dt) {
  if (state.scene) {
    state.scene.handleInput(dt);
  }
}

function main(currentTime) {
  if (!lastTime) lastTime = currentTime;
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);

  lastTime = currentTime;

  handleInput(dt);
  update(dt, currentTime);
  draw(dt);

  requestAnimationFrame(main);
}

function startGame(difficulty = DIFFICULTY) {
  state.scene = new GameScreen(difficultyConfig(difficulty));
  notifyHarness({ op: "started", verb: "make some chili!" });
  playMusic();
}

canvas.addEventListener("click", (ev) => {
  if (music.paused && state.scene instanceof GameScreen) music.play().catch(() => { });

  const r = canvas.getBoundingClientRect();
  const p = Vector.of([
    (ev.clientX - r.left) / r.width * WIDTH,
    (ev.clientY - r.top) / r.height * HEIGHT,
  ]);
  state.scene?.onClick(p);
});

window.addEventListener("message", ev => {
  switch (ev.data.op) {
    case "start":
      startGame(ev.data.difficulty ?? 0);
      break;
    default: console.log(`unknown event: ${ev}`); break;
  }
});

await init();

requestAnimationFrame(main);

if (STANDALONE) startGame();


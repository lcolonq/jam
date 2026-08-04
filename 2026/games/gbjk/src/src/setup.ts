export type Elements = {
  main: HTMLCanvasElement;
  right: HTMLButtonElement;
  left: HTMLButtonElement;
  rotateRight: HTMLButtonElement;
  rotateLeft: HTMLButtonElement;
  speedUp: HTMLButtonElement;
};

const WIDTH = 160;
const HEIGHT = 240;

const GRID_HEIGHT = HEIGHT - 10;
const ROWS = 15;
const COLS = 10;
const GRID_WIDTH = (GRID_HEIGHT / ROWS) * 10;
const GRID_X = 5;
const GRID_Y = 5;
const MARGIN = 2;
const CELL_WIDTH = GRID_HEIGHT / ROWS - MARGIN;
const FALLTIME = 600;
const MIN_FALLTIME = 300;

let rotation = 0;

type Block =
  | "void"
  | "red"
  | "green"
  | "blue"
  | "fallingRed"
  | "fallingGreen"
  | "fallingBlue";

const board: Block[][] = [];

function resetBoard() {
  board.length = 0;

  for (let height = 0; height < ROWS; height++) {
    const row: Block[] = [];
    for (let width = 0; width < COLS; width++) {
      row.push("void");
    }
    board.push(row);
  }
}

resetBoard();

function random<T>(elements: T[]): T {
  return elements[Math.floor(Math.random() * elements.length)];
}

let addedShapeNumber = 1;
function addSquares(): boolean {
  const color = random(["fallingRed", "fallingGreen", "fallingBlue"] as const);
  let w = COLS / 2;
  let h = 1;
  for (let i = 0; i < 4; i++) {
    board[h][w] = color;

    if (i === 3) break;

    let move: "up" | "down" | "left" | "right" | null = null;
    let j = 0;
    for (; j < 20; j++) {
      move =
        addedShapeNumber % 6 === 0
          ? "down"
          : random(["up", "down", "left", "right"] as const);

      if (move === "up" && (h === 0 || board[h - 1][w] !== "void")) continue;
      if (move === "down" && (h === ROWS - 1 || board[h + 1][w] !== "void"))
        continue;

      if (move === "left" && (w === 0 || board[h][w - 1] !== "void")) continue;
      if (move === "right" && (w === COLS - 1 || board[h][w + 1] !== "void"))
        continue;

      break;
    }
    if (j === 20) {
      return false;
    }

    switch (move) {
      case "up":
        h--;
        break;
      case "down":
        h++;
        break;
      case "left":
        w--;
        break;
      case "right":
        w++;
        break;
    }
  }

  addedShapeNumber++;
  return true;
}

function clearFilledRows(): number {
  let lastClearedRow = ROWS;
  let clearedRows = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (
      !board[row].some(
        (cell) =>
          cell === "void" ||
          cell === "fallingBlue" ||
          cell === "fallingGreen" ||
          cell === "fallingRed",
      )
    ) {
      for (let col = 0; col < COLS; col++) {
        board[row][col] = "void";
      }
      lastClearedRow = row;
      clearedRows++;
    } else if (lastClearedRow !== ROWS) {
      for (let col = 0; col < COLS; col++) {
        switch (board[row][col]) {
          case "red":
            board[row][col] = "fallingRed";
            break;
          case "green":
            board[row][col] = "fallingGreen";
            break;
          case "blue":
            board[row][col] = "fallingBlue";
            break;
        }
      }
    }
  }

  return clearedRows;
}

export function setup(elements: Elements) {
  const ctx = elements.main.getContext("2d")!;

  let gameRunning = false;
  let animationFrameId: number | null = null;
  let lastFrame = 0;
  let fallTime = FALLTIME;

  let speedUpPressed = false;

  elements.left.addEventListener("click", () => moveFalling("left"));
  elements.right.addEventListener("click", () => moveFalling("right"));

  elements.rotateLeft.addEventListener("click", () => {
    if (!gameRunning) return;

    rotation -= 30 * Math.random();
    elements.main.style.transform = `rotate(${rotation}deg)`;
  });
  elements.rotateRight.addEventListener("click", () => {
    if (!gameRunning) return;

    rotation += 30 * Math.random();
    elements.main.style.transform = `rotate(${rotation}deg)`;
  });

  elements.speedUp.addEventListener(
    "mousedown",
    () => (speedUpPressed = gameRunning),
  );
  elements.speedUp.addEventListener("mouseup", () => (speedUpPressed = false));

  window.addEventListener("message", (ev: MessageEvent<unknown>) => {
    const message = ev.data;
    if (!isStartMessage(message)) return;

    startGame(message.difficulty);
  });

  window.parent.postMessage({ op: "ready" }, "*");

  draw();

  function isStartMessage(
    message: unknown,
  ): message is { op: "start"; difficulty: number } {
    if (typeof message !== "object" || message === null) return false;

    const candidate = message as { op?: unknown; difficulty?: unknown };
    return (
      candidate.op === "start" &&
      typeof candidate.difficulty === "number" &&
      Number.isFinite(candidate.difficulty)
    );
  }

  function resetGame(difficulty: number) {
    resetBoard();
    addedShapeNumber = 1;
    fallTime = Math.max(MIN_FALLTIME, FALLTIME - Math.max(0, difficulty) * 5);
    rotation = 0;
    elements.main.style.transform = "";
    speedUpPressed = false;
    lastFrame = 0;
  }

  function startGame(difficulty: number) {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    resetGame(difficulty);
    gameRunning = true;
    window.parent.postMessage({ op: "started", verb: "catch!" }, "*");
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function finishGame(win: boolean) {
    if (!gameRunning) return;

    gameRunning = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    window.parent.postMessage({ op: "done", win }, "*");
    resetGame(0);
    draw();
  }

  function moveFalling(move: "left" | "right") {
    if (!gameRunning) return;

    switch (move) {
      case "left":
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS - 1; col++) {
            if (board[row][col] === "void") {
              switch (board[row][col + 1]) {
                case "fallingRed":
                case "fallingGreen":
                case "fallingBlue":
                  board[row][col] = board[row][col + 1];
                  board[row][col + 1] = "void";
              }
            }
          }
        }
        break;
      case "right":
        for (let row = 0; row < ROWS; row++) {
          for (let col = COLS - 1; col > 0; col--) {
            if (board[row][col] === "void") {
              switch (board[row][col - 1]) {
                case "fallingRed":
                case "fallingGreen":
                case "fallingBlue":
                  board[row][col] = board[row][col - 1];
                  board[row][col - 1] = "void";
              }
            }
          }
        }
        break;
    }
  }

  function physics(): boolean {
    let somethingFell = false;

    for (let row = ROWS - 1; row >= 1; row--) {
      for (let col = 0; col < COLS; col++) {
        let space = board[row][col];
        let above = board[row - 1][col];
        switch (above) {
          case "fallingRed":
          case "fallingGreen":
          case "fallingBlue":
            if (space === "void") {
              somethingFell = true;
              board[row][col] = board[row - 1][col];
              board[row - 1][col] = "void";
            } else {
              switch (above) {
                case "fallingRed":
                  board[row - 1][col] = "red";
                  break;
                case "fallingGreen":
                  board[row - 1][col] = "green";
                  break;
                case "fallingBlue":
                  board[row - 1][col] = "blue";
                  break;
              }
            }
        }
      }
    }

    for (let col = 0; col < COLS; col++) {
      switch (board[ROWS - 1][col]) {
        case "fallingRed":
          board[ROWS - 1][col] = "red";
          break;
        case "fallingGreen":
          board[ROWS - 1][col] = "green";
          break;
        case "fallingBlue":
          board[ROWS - 1][col] = "blue";
          break;
      }
    }

    return somethingFell;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "black";
    ctx.fillRect(GRID_X, GRID_Y, GRID_WIDTH, GRID_HEIGHT);

    for (let h = 0; h < ROWS; h++) {
      for (let w = 0; w < COLS; w++) {
        switch (board[h][w]) {
          case "void":
            ctx.fillStyle = "#2e2e2e";
            break;
          case "red":
            ctx.fillStyle = "#994444";
            break;
          case "green":
            ctx.fillStyle = "#449944";
            break;
          case "blue":
            ctx.fillStyle = "#444499";
            break;
          case "fallingRed":
            ctx.fillStyle = "#bb3333";
            break;
          case "fallingGreen":
            ctx.fillStyle = "#33bb33";
            break;
          case "fallingBlue":
            ctx.fillStyle = "#3333bb";
            break;
        }

        const x = GRID_X + MARGIN * 1.5 + w * CELL_WIDTH + (w - 1) * MARGIN;
        const y = GRID_Y + MARGIN * 1.5 + h * CELL_WIDTH + (h - 1) * MARGIN;

        ctx.fillRect(x, y, CELL_WIDTH, CELL_WIDTH);
      }
    }
  }

  function gameLoop(time: number) {
    animationFrameId = null;

    if (!gameRunning) return;

    if (time - lastFrame > (speedUpPressed ? fallTime / 10 : fallTime)) {
      lastFrame = time;
      const somethingFell = physics();
      if (!somethingFell) {
        const clearedRows = clearFilledRows();
        if (clearedRows >= 4) {
          finishGame(true);
          return;
        } else if (clearedRows === 0) {
          if (!addSquares()) {
            finishGame(false);
            return;
          }
        }
      }
    }

    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

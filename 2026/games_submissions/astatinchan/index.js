var canvas = document.getElementById("game");
var globalCtx = canvas.getContext("2d");

const STATE_NOT_STARTED = 4;
const STATE_AIMING = 0;
const STATE_JUMPING = 1;
const STATE_WIN = 2;
const STATE_LOOSE = 3;

const gravity = 1;
const jumpingSpeed = 13;

const ground = 136;
const bunnySize = 20;

let imageLoaded = 0;
let imagesCount = 0;
const images = {};
var gameFrame,
  losecount,
  arrowAngle,
  arrowSpeed,
  bunnyPositionX,
  bunnyPositionY,
  bunnyJumpFramesCount,
  binHeight,
  bunnyVelocityX,
  bunnyVelocityY,
  isOverBin,
  isIn,
  endFrames;

var gameState = STATE_NOT_STARTED;

function init(difficulty) {
  gameFrame = 0;
  losecount = 0;

  arrowAngle = 0;
  arrowSpeed = 4;

  bunnyPositionX = 174;
  bunnyPositionY = ground;
  bunnyJumpFramesCount = 0;

  level1 = [55, 20, 20, 60, 35];
  level2 = [15, 25, 30, 40, 50];
  level3 = [30, 45, 65, 70, 75];
  level4 = [70, 75, 77, 65, 45];
  randomness = Math.floor(Math.random() * 5);
  if (difficulty < 5) {
    binHeight = level1[randomness];
  } else if (difficulty < 30) {
    binHeight = level2[randomness];
  } else if (difficulty < 50) {
    binHeight = level3[randomness];
  } else {
    binHeight = level4[randomness];
  }

  gameState = STATE_AIMING;

  bunnyVelocityX = 0;
  bunnyVelocityY = 0;

  isOverBin = false;
  isIn = false;
  endFrames = 30;
  window.parent.postMessage({ op: "started", verb: "jump!" });
  document.addEventListener("click", mouseClick);
}

function loadSprites(callback) {
  function imageLoadedListener() {
    imageLoaded += 1;
    if (imageLoaded == imagesCount) {
      callback();
    }
  }
  function addImg(key, src) {
    imagesCount += 1;
    images[key] = new Image();
    images[key].src = src;
    images[key].addEventListener("load", imageLoadedListener);
  }
  addImg("bunny1", "./sprites/bunny1.png");
  addImg("bunny2", "./sprites/bunny2.png");
  addImg("bunny3", "./sprites/bunny3.png");
  addImg("bunny4", "./sprites/bunny4.png");
  addImg("bunnysad", "./sprites/bunnysad.png");

  addImg("bintop", "./sprites/bin-top.png");
  addImg("binpattern", "./sprites/bin-pattern.png");

  addImg("bg", "./sprites/background.png");
  addImg("fg", "./sprites/foreground.png");

  addImg("carrot1", "./sprites/carrot1.png");
  addImg("carrot2", "./sprites/carrot2.png");
  addImg("carrot3", "./sprites/carrot3.png");
  addImg("carrot4", "./sprites/carrot4.png");
  addImg("carrot5", "./sprites/carrot5.png");
  addImg("carrot6", "./sprites/carrot6.png");
  addImg("carrot7", "./sprites/carrot7.png");
  addImg("carrot8", "./sprites/carrot8.png");
  addImg("carrot9", "./sprites/carrot9.png");

  addImg("jump1", "./sprites/jump-text1.png");
  addImg("jump2", "./sprites/jump-text2.png");
  addImg("jump3", "./sprites/jump-text3.png");
  addImg("jump4", "./sprites/jump-text4.png");
  addImg("jump5", "./sprites/jump-text5.png");
  addImg("toobad", "./sprites/toobad.png");
  addImg("nice", "./sprites/nice.png");
}

function drawBnuy(ctx) {
  ctx.fillStyle = "#081820";
  let bunnySprite = images.bunny1;

  if (gameState == STATE_LOOSE) {
    bunnySprite = images.bunnysad;
  } else if (bunnyJumpFramesCount != 0 && bunnyJumpFramesCount < 5) {
    bunnySprite = images.bunny2;
  } else if (bunnyVelocityY > 0) {
    bunnySprite = images.bunny3;
  } else if (bunnyVelocityY < 0) {
    bunnySprite = images.bunny4;
  }
  ctx.drawImage(bunnySprite, bunnyPositionX - 36 / 2, bunnyPositionY - 48);
}

// always top to bottom
function drawVerticalLine(ctx, fromX, fromY, toX, toY, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < toY - fromY; i++) {
    x = (i * (toX - fromX)) / (toY - fromY) + fromX;
    ctx.fillRect(Math.round(x), Math.round(i + fromY), 1, 1);
  }
}

function drawBin(ctx, height) {
  ctx.fillStyle = "#a6859f";
  ctx.fillRect(49, ground - 2, 47, 1);
  ctx.fillStyle = "#1f102a";
  ctx.fillRect(49, ground - 1, 47, 1);
  drawVerticalLine(
    ctx,
    72 - 56 / 2,
    ground - height,
    72 - 46 / 2,
    ground - 1,
    "#a6859f",
  );
  drawVerticalLine(
    ctx,
    71 + 56 / 2,
    ground - height,
    71 + 46 / 2,
    ground - 1,
    "#a6859f",
  );
  drawVerticalLine(
    ctx,
    72 - 58 / 2,
    ground - height,
    72 - 48 / 2,
    ground - 1,
    "#1f102a",
  );
  drawVerticalLine(
    ctx,
    71 + 58 / 2,
    ground - height,
    71 + 48 / 2,
    ground - 1,
    "#1f102a",
  );

  const insideBin = new Path2D();
  insideBin.moveTo(72 - 56 / 2, ground - height);
  insideBin.lineTo(72 - 46 / 2, ground - 1);
  insideBin.lineTo(72 + 46 / 2, ground - 1);
  insideBin.lineTo(72 + 56 / 2, ground - height);
  insideBin.closePath;
  ctx.fillStyle = ctx.createPattern(images.binpattern, "repeat");
  ctx.fill(insideBin);

  ctx.drawImage(images.bintop, 72 - 58 / 2, ground - height);
  // ctx.fillRect(48, ground - height, 1, height);
  // ctx.fillRect(95, ground - height, 1, height);
}

function drawBg(ctx) {
  ctx.drawImage(images.bg, 0, 0);
}

function drawFg(ctx) {
  ctx.drawImage(images.fg, 0, 0);
}

function drawJumpText(ctx) {
  const startsAfter = 5;
  const endsAfter = 60;
  const fadeoutTime = 5;
  if (gameState == STATE_WIN) {
    ctx.drawImage(images.nice, 78, 10);
  } else if (gameState == STATE_LOOSE) {
    ctx.drawImage(images.toobad, 42, 10);
  } else if (gameFrame >= startsAfter && gameFrame < endsAfter) {
    const jumpTextNum = Math.min(
      5,
      Math.floor((gameFrame - startsAfter) / 2) + 1,
    );

    if (gameFrame > endsAfter - fadeoutTime) {
      ctx.globalAlpha =
        1 - (gameFrame - (endsAfter - fadeoutTime)) / fadeoutTime;
    }
    ctx.drawImage(images["jump" + jumpTextNum], 68, 10);
    ctx.globalAlpha = 1;
  }
}

// angle can be 0 and 90
function drawArrow(ctx, angle) {
  const arrowSize = 24;
  const bunnyCenterOffset = 35;
  const angleRadiant = (angle * Math.PI) / 180;
  const bunnyCenterOffsetX = Math.round(
    Math.cos(angleRadiant) * bunnyCenterOffset,
  );
  const bunnyCenterOffsetY = Math.round(
    Math.sin(angleRadiant) * bunnyCenterOffset,
  );

  const carrot_img_nb = Math.min(Math.round((9 * angle) / 90) + 1, 9);
  ctx.drawImage(
    images["carrot" + carrot_img_nb],
    bunnyPositionX - bunnyCenterOffsetX - arrowSize / 2,
    bunnyPositionY - 12 - bunnySize / 2 - bunnyCenterOffsetY - arrowSize / 2,
  );
}

function rotateAimingArrow() {
  arrowAngle += arrowSpeed;
  if (arrowAngle >= 90) {
    arrowAngle = 90;
    arrowSpeed *= -1;
  } else if (arrowAngle <= 0) {
    arrowAngle = 0;
    arrowSpeed *= -1;
  }
}

function moveBunny() {
  bunnyPositionX -= Math.round(bunnyVelocityX);
  bunnyPositionY -= Math.round(bunnyVelocityY);
  bunnyVelocityY -= gravity;
  if (bunnyPositionY >= ground) {
    bunnyPositionY = ground;
    bunnyVelocityX /= 2;
    bunnyVelocityY = 0;
  }
  if (
    bunnyPositionX > 48 - bunnySize / 2 &&
    bunnyPositionX < 96 + bunnySize / 2
  ) {
    if (bunnyPositionY < ground - binHeight) {
      isOverBin = true;
    } else if (bunnyPositionY > ground - binHeight) {
      if (!isOverBin) {
        bunnyVelocityX *= -0.5;
        bunnyPositionX = Math.ceil(97 + bunnySize / 2);
      } else if (
        bunnyPositionX < 48 + bunnySize / 2 ||
        bunnyPositionX > 96 - bunnySize / 2
      ) {
        binBorderHeight =
          ground - (Math.abs(bunnyPositionX - 72) / 42) * binHeight;
        if (bunnyPositionY >= binBorderHeight) {
          bunnyVelocityY = 0;
          bunnyPositionY = binBorderHeight;
          bunnyVelocityX =
            bunnyVelocityX * 0.3 + Math.sign(bunnyPositionX - 72) * 1.5;
        }
      } else {
        isIn = true;
        if (bunnyPositionY == ground) {
          bunnyVelocityX = 0;
          gameState = STATE_WIN;
        }
      }
    }
  } else {
    isOverBin = false;
  }

  if (
    bunnyPositionY == ground &&
    bunnyVelocityY == 0 &&
    bunnyVelocityX < 0.1 &&
    gameState == STATE_JUMPING
  ) {
    losecount += 1;
    if (losecount > 10) {
      gameState = STATE_LOOSE;
      bunnyVelocityX = 0;
    }
  }
}

function drawFrame(ctx) {
  // Logic
  if (gameState == STATE_AIMING) {
    rotateAimingArrow();
    bunnyJumpFramesCount = 0;
  }
  if (gameState == STATE_JUMPING) {
    moveBunny();
    bunnyJumpFramesCount += 1;
  }
  if (gameState == STATE_WIN || gameState == STATE_LOOSE) {
    endFrames -= 1;
    if (endFrames == 0) {
      window.parent.postMessage({ op: "done", win: gameState == STATE_WIN });
      document.removeEventListener("click", mouseClick);
    }
  }

  // Drawing
  drawBg(ctx);
  drawJumpText(ctx);
  drawBnuy(ctx);
  drawBin(ctx, binHeight);
  drawFg(ctx);
  if (gameState == STATE_AIMING) {
    drawArrow(ctx, arrowAngle);
  }
  gameFrame += 1;
}

function mouseClick() {
  if (gameState == STATE_AIMING) {
    gameState = STATE_JUMPING;

    const angleRadiant = (arrowAngle * Math.PI) / 180;
    bunnyVelocityX = Math.round(Math.cos(angleRadiant) * jumpingSpeed);
    bunnyVelocityY = Math.round(Math.sin(angleRadiant) * jumpingSpeed);
  }
}

// init(0);
loadSprites(() => {
  window.parent.postMessage({ op: "ready" });
  setInterval(() => drawFrame(globalCtx), 1000 / 30);
  window.addEventListener("message", (ev) => {
    if (ev.data.op == "start") {
      init(ev.data.difficulty || 0);
    }
  });
});

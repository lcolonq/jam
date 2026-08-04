import { setup } from "./setup";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="layout">

    <div class="game">
      <div class="title-bar">
        <h1>Tortis</h1>
        <p>(4row clear to win)</p>
      </div>

      <canvas height="240" width="160" id="main"></canvas>
    </div>

    <ul>
      <button id="move-left">move left</button>
      <button id="rotate-left">rotate left</button>
      <button id="move-right">move right</button>
      <button id="rotate-right">rotate right</button>
      <button id="speed-up">speed up</button>
    </ul>
  </div>
`;

setup({
  main: document.querySelector<HTMLCanvasElement>("#main")!,
  left: document.querySelector<HTMLButtonElement>("#move-left")!,
  right: document.querySelector<HTMLButtonElement>("#move-right")!,
  rotateLeft: document.querySelector<HTMLButtonElement>("#rotate-left")!,
  rotateRight: document.querySelector<HTMLButtonElement>("#rotate-right")!,
  speedUp: document.querySelector<HTMLButtonElement>("#speed-up")!,
});

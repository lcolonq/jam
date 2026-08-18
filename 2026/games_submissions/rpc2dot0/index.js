import init, { main_js, set_difficulty_js, receive_op_js } from './pkg/eatyourgreens.js';

let is_embedded = false;
let currentDifficulty = 1.0;

window.addEventListener("DOMContentLoaded", async (event) => {
  await init();
  is_embedded = window.parent !== window;
  main_js(is_embedded);
  window.addEventListener("message", (ev) => {
    if (ev.data && ev.data.op === 'play_video') {
      play_video(ev.data.video_url);
      return;
    }

    if (is_embedded && ev.data && ev.data.op) {
      currentDifficulty = ev.data.difficulty || currentDifficulty;
      set_difficulty_js(currentDifficulty);
      receive_op_js(ev.data.op);
    }
  });
});


// os (inside computer)
const osBox = document.getElementById('os-box');
const video = document.getElementById('ad-video');

video.addEventListener('ended', () => {
  osBox.style.display = 'none';
  receive_op_js('video_finished');
});

function play_video(videoUrl) {
  if (!videoUrl) {
    return;
  }
  osBox.style.display = 'block';
  video.src = videoUrl;
  video.muted = false;
  video.volume = 0.85;
  video.play().catch((e) => {
    console.error("Failed to play video with sound:", e);
    // fallback if autoplay policy blocked it
    video.muted = true;
    video.play();
  });
}

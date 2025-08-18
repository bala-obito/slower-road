// game.js - Slower Car Game (HTML/JS)
const normalBtn = document.getElementById('normalBtn');
const advBtn = document.getElementById('advBtn');
const buyBtn = document.getElementById('buyBtn');
const menu = document.getElementById('menu');
const gameArea = document.getElementById('gameArea');
const backBtn = document.getElementById('backBtn');
const scoreText = document.getElementById('score');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let advancedUnlocked = false;
let mode = 'normal';
let running = false;
let paused = false;
let score = 0;

let car = { x: 180, y: 430, w: 40, h: 50 };
let obstacles = [];
let animationId = null;
let spawnChance = 0.02;
let obstacleSpeed = 2;
let bgColor = 'lightblue';

normalBtn.onclick = () => start('normal');
advBtn.onclick = () => { if (advancedUnlocked) start('advance'); };
buyBtn.onclick = () => {
  advancedUnlocked = true;
  advBtn.disabled = false;
  advBtn.textContent = 'Advanced Mode';
  alert('Advanced unlocked!');
};

backBtn.onclick = () => {
  stopGame();
  gameArea.classList.add('hidden');
  menu.classList.remove('hidden');
};

function start(m) {
  mode = m;
  if (mode === 'normal') {
    obstacleSpeed = 2;
    spawnChance = 0.015;
    bgColor = 'lightblue';
  } else {
    obstacleSpeed = 4;
    spawnChance = 0.03;
    bgColor = 'black';
  }
  score = 0;
  scoreText.textContent = 'Score: 0';
  car.x = 180;
  obstacles = [];
  menu.classList.add('hidden');
  gameArea.classList.remove('hidden');
  running = true;
  paused = false;
  loop();
}

function stopGame() {
  running = false;
  paused = false;
  cancelAnimationFrame(animationId);
}

function loop() {
  if (!running) return;
  if (paused) {
    drawPaused();
    animationId = requestAnimationFrame(loop);
    return;
  }
  // draw
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // road
  ctx.fillStyle = (mode === 'normal') ? '#666' : '#222';
  ctx.fillRect(40, 0, 320, 500);

  // dashed center
  ctx.fillStyle = '#ddd';
  for (let y = 0; y < 500; y += 40) {
    ctx.fillRect(200 - 4, y + 10, 8, 20);
  }

  // car
  ctx.fillStyle = (mode === 'normal') ? '#D33' : '#4ae';
  ctx.fillRect(car.x, car.y, car.w, car.h);

  // spawn obstacles
  if (Math.random() < spawnChance) {
    let ox = 40 + Math.random() * (320 - 40);
    if (ox > 320) ox = 320;
    obstacles.push({ x: ox, y: -40, w: 40, h: 40 });
  }

  // update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.y += obstacleSpeed;
    if (mode === 'normal') {
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    } else {
      ctx.beginPath();
      ctx.fillStyle = '#FF6B6B';
      ctx.ellipse(obs.x + obs.w/2, obs.y + obs.h/2, obs.w/2, obs.h/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // collision
    if (obs.x < car.x + car.w && obs.x + obs.w > car.x &&
        obs.y < car.y + car.h && obs.y + obs.h > car.y) {
      alert('💥 Game Over! Score: ' + score);
      stopGame();
      menu.classList.remove('hidden');
      gameArea.classList.add('hidden');
      return;
    }

    if (obs.y > canvas.height) {
      obstacles.splice(i, 1);
      score += 1;
      scoreText.textContent = 'Score: ' + score;
    }
  }

  animationId = requestAnimationFrame(loop);
}

function drawPaused() {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '28px Trebuchet MS';
  ctx.fillText('PAUSED', canvas.width / 2 - 60, canvas.height / 2);
}

// input
window.addEventListener('keydown', (e) => {
  if (!running) return;
  if (e.key === 'ArrowLeft') {
    car.x = Math.max(40, car.x - 25);
  } else if (e.key === 'ArrowRight') {
    car.x = Math.min(320 - car.w + 40, car.x + 25);
  } else if (e.code === 'Space') {
    paused = !paused;
  } else if (e.key === 'Escape') {
    stopGame();
    menu.classList.remove('hidden');
    gameArea.classList.add('hidden');
  }
});

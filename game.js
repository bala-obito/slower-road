// game.js - Clean / fixed version (replace your old game.js with this)
// Works on laptop + mobile. Uses svg.png (place it next to index.html).

window.addEventListener('load', () => {
  // --- DOM elements (safe lookups) ---
  const normalBtn = document.getElementById('normalBtn');
  const advBtn = document.getElementById('advBtn');
  const buyBtn = document.getElementById('buyBtn');
  const menu = document.getElementById('menu');
  const gameArea = document.getElementById('gameArea');
  const backBtn = document.getElementById('backBtn');
  const scoreText = document.getElementById('score');

  const mobileControls = document.getElementById('mobileControls');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // --- Images / assets ---
  const carImg = new Image();
  carImg.src = 'svg.png'; // filename must match

  // --- Game state ---
  const ROAD_LEFT = 40;
  const ROAD_WIDTH = 320;
  let car = { x: 180, y: 400, width: 50, height: 80 };
  let advancedUnlocked = false;
  let mode = 'normal';
  let running = false;
  let paused = false;
  let score = 0;
  let obstacles = [];
  let spawnChance = 0.02;
  let obstacleSpeed = 2;
  let animationId = null;

  // --- Helpers ---
  function centerCarX() {
    car.x = ROAD_LEFT + (ROAD_WIDTH - car.width) / 2;
  }

  function showMenu() {
    stopGame();
    menu.classList.remove('hidden');
    gameArea.classList.add('hidden');
    if (mobileControls) mobileControls.classList.add('hidden');
  }

  function backToMenu() {
    showMenu();
  }

  // --- Buttons ---
  if (normalBtn) normalBtn.onclick = () => startMode('normal');
  if (advBtn) advBtn.onclick = () => { if (advancedUnlocked) startMode('advanced'); };
  if (buyBtn) buyBtn.onclick = () => {
    advancedUnlocked = true;
    if (advBtn) { advBtn.disabled = false; advBtn.textContent = 'Advanced Mode'; }
    if (buyBtn) buyBtn.hidden = true;
    alert('Advanced unlocked!');
  };
  if (backBtn) backBtn.onclick = backToMenu;

  // --- Start/Stop ---
  function startMode(m) {
    mode = m;
    if (mode === 'normal') {
      obstacleSpeed = 2;
      spawnChance = 0.015;
    } else {
      obstacleSpeed = 4;
      spawnChance = 0.03;
    }
    score = 0;
    scoreText.textContent = `Score: ${score}`;
    centerCarX();
    obstacles = [];
    menu.classList.add('hidden');
    gameArea.classList.remove('hidden');
    // show mobile controls on small screens
    if (mobileControls) {
      if (window.innerWidth < 768) mobileControls.classList.remove('hidden');
      else mobileControls.classList.add('hidden');
    }
    running = true;
    paused = false;
    // start loop only if image is loaded, else wait for onload:
    if (carImg.complete) {
      loop();
    } else {
      carImg.onload = () => { if (running) loop(); };
    }
  }

  function stopGame() {
    running = false;
    paused = false;
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    if (mobileControls) mobileControls.classList.add('hidden');
  }

  // --- Main loop ---
  function loop() {
    if (!running) return;

    // handle pause
    if (paused) {
      drawPaused();
      animationId = requestAnimationFrame(loop);
      return;
    }

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.fillStyle = (mode === 'normal') ? 'lightblue' : 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // road
    ctx.fillStyle = (mode === 'normal') ? '#666' : '#222';
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, canvas.height);

    // dashed center line
    ctx.fillStyle = '#ddd';
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.fillRect(200 - 4, y + 10, 8, 20);
    }

    // draw car (image if ready)
    if (carImg.complete && carImg.naturalWidth !== 0) {
      ctx.drawImage(carImg, car.x, car.y, car.width, car.height);
    } else {
      // fallback box while image loads
      ctx.fillStyle = '#09c';
      ctx.fillRect(car.x, car.y, car.width, car.height);
    }
    // border for hitbox
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(car.x, car.y, car.width, car.height);

    // spawn obstacles
    if (Math.random() < spawnChance) {
      const ox = ROAD_LEFT + Math.random() * (ROAD_WIDTH - 80); // keep width space
      obstacles.push({ x: ox, y: -40, width: 40, height: 40 });
    }

    // update obstacles (iterate backwards)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.y += obstacleSpeed;

      // draw obstacle
      if (mode === 'normal') {
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      } else {
        ctx.beginPath();
        ctx.fillStyle = '#FF6B6B';
        ctx.ellipse(
          obs.x + obs.width / 2,
          obs.y + obs.height / 2,
          obs.width / 2,
          obs.height / 2,
          0, 0, Math.PI * 2
        );
        ctx.fill();
      }

      // AABB collision
      if (
        obs.x < car.x + car.width &&
        obs.x + obs.width > car.x &&
        obs.y < car.y + car.height &&
        obs.y + obs.height > car.y
      ) {
        alert('💥 Game Over! Score: ' + score);
        backToMenu();
        return;
      }

      // remove off-screen
      if (obs.y > canvas.height) {
        obstacles.splice(i, 1);
        score += 1;
        scoreText.textContent = `Score: ${score}`;
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

  // --- Input: keyboard ---
  window.addEventListener('keydown', (e) => {
    if (!running) return;
    if (e.key === 'ArrowLeft') {
      car.x = Math.max(ROAD_LEFT, car.x - 25);
    } else if (e.key === 'ArrowRight') {
      car.x = Math.min(ROAD_LEFT + ROAD_WIDTH - car.width, car.x + 25);
    } else if (e.code === 'Space') {
      paused = !paused;
    } else if (e.key === 'Escape') {
      backToMenu();
    }
  });

  // --- Mobile touch buttons (tap & hold) ---
  let holdInterval = null;
  function startHold(dir) {
    stopHold();
    holdInterval = setInterval(() => {
      if (!running) return;
      if (dir === 'left') car.x = Math.max(ROAD_LEFT, car.x - 12);
      else car.x = Math.min(ROAD_LEFT + ROAD_WIDTH - car.width, car.x + 12);
    }, 60);
  }
  function stopHold() {
    if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
  }
  if (leftBtn && rightBtn) {
    leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold('left'); });
    rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold('right'); });
    leftBtn.addEventListener('touchend', stopHold);
    rightBtn.addEventListener('touchend', stopHold);
    leftBtn.addEventListener('touchcancel', stopHold);
    rightBtn.addEventListener('touchcancel', stopHold);
  }

  // --- Helpful: expose a quick debug function in case user needs it ---
  window.__gameDebug = {
    startMode,
    stopGame,
    car,
    obstacles,
    get running() { return running; },
  };

  // show menu at load
  showMenu();
});

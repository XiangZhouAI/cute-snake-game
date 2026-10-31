/* Starlight Snake — top-down 2D only.
   Segments are {x, y}. A later version could add z; this one never moves on a Z axis.
   Food score and length changes come only from the registry, not from hardcoded ids.
   Bot moods: lazy hunts food, aggressive hunts snakes, in between does both.
   server.py shares one board across browsers on the LAN. */
(function () {
  "use strict";

  // One place for the world and the camera. Buttons below use these sizes.
  var WORLD = {
    defaultSize: "large",
    sizes: {
      medium: { cols: 24, rows: 24 },
      large: { cols: 48, rows: 48 },
      huge: { cols: 72, rows: 72 }
    },
    minView: 11,
    viewMargin: 3,
    pumpkinEvery: 160
  };
  var worldSizeName = WORLD.defaultSize;
  var COLS = WORLD.sizes[worldSizeName].cols;
  var ROWS = WORLD.sizes[worldSizeName].rows;
  var TICK_MS = 150;
  var BOT_RESPAWN_MS = 2000;

  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var boardWrap = document.querySelector(".board-wrap");

  var cellSize = 32;
  var cssW = 480;
  var cssH = 480;
  var view = { left: 0, top: 0, span: WORLD.minView };
  var dpr = 1;

  var foodTypes = [];

  function registerFood(def) {
    foodTypes.push(def);
    return def;
  }

  function drawCandyApple(context, cx, cy, s) {
    context.save();
    context.translate(cx, cy);
    context.strokeStyle = "#f3e2c4";
    context.lineWidth = Math.max(2, s * 0.07);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(0, s * 0.06);
    context.lineTo(0, s * 0.4);
    context.stroke();
    context.fillStyle = "#ef3d4a";
    context.beginPath();
    context.arc(0, -s * 0.04, s * 0.24, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#c68642";
    context.lineWidth = Math.max(1.6, s * 0.055);
    context.beginPath();
    context.moveTo(-s * 0.14, -s * 0.08);
    context.quadraticCurveTo(-s * 0.02, s * 0.06, s * 0.14, -s * 0.02);
    context.stroke();
    context.fillStyle = "rgba(255,255,255,0.6)";
    context.beginPath();
    context.ellipse(-s * 0.08, -s * 0.12, s * 0.06, s * 0.035, -0.7, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#3f9a45";
    context.beginPath();
    context.ellipse(s * 0.09, -s * 0.26, s * 0.09, s * 0.045, 0.6, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawRottenApple(context, cx, cy, s) {
    context.save();
    context.translate(cx, cy);
    context.fillStyle = "#8d9a3e";
    context.beginPath();
    context.arc(0, s * 0.02, s * 0.26, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#6b5428";
    context.beginPath();
    context.arc(s * 0.1, s * 0.1, s * 0.09, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#5c4124";
    context.fillRect(-s * 0.025, -s * 0.32, s * 0.05, s * 0.12);
    context.strokeStyle = "#3a3216";
    context.lineWidth = 1.5;
    context.lineCap = "round";
    context.beginPath();
    context.arc(-s * 0.08, -s * 0.02, s * 0.045, Math.PI * 0.15, Math.PI * 0.85);
    context.stroke();
    context.beginPath();
    context.arc(s * 0.08, -s * 0.02, s * 0.045, Math.PI * 0.15, Math.PI * 0.85);
    context.stroke();
    context.strokeStyle = "#f0c56a";
    context.lineWidth = Math.max(2, s * 0.06);
    context.beginPath();
    context.arc(s * 0.18, s * 0.16, s * 0.08, 0.2, 1.35 * Math.PI);
    context.stroke();
    context.fillStyle = "#e07a8a";
    context.beginPath();
    context.arc(s * 0.24, s * 0.1, s * 0.03, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawChili(context, cx, cy, s, time) {
    var pulse = 0.5 + 0.5 * Math.sin(time / 70);
    context.save();
    context.translate(cx, cy);
    context.shadowColor = "rgba(255, 210, 60, " + (0.4 + pulse * 0.55) + ")";
    context.shadowBlur = 4 + pulse * 14;
    context.fillStyle = pulse > 0.45 ? "#ff2a1f" : "#ff6a14";
    context.beginPath();
    context.moveTo(-s * 0.02, -s * 0.4);
    context.bezierCurveTo(s * 0.26, -s * 0.3, s * 0.24, s * 0.02, s * 0.06, s * 0.3);
    context.bezierCurveTo(-s * 0.02, s * 0.44, -s * 0.2, s * 0.28, -s * 0.16, s * 0.08);
    context.bezierCurveTo(-s * 0.3, -s * 0.12, -s * 0.22, -s * 0.32, -s * 0.02, -s * 0.4);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "#248a38";
    context.lineWidth = Math.max(2, s * 0.07);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-s * 0.02, -s * 0.34);
    context.quadraticCurveTo(s * 0.08, -s * 0.5, s * 0.2, -s * 0.4);
    context.stroke();
    context.fillStyle = "rgba(255, 244, 150, " + (0.55 + pulse * 0.45) + ")";
    context.beginPath();
    context.moveTo(s * 0.22, -s * 0.16);
    context.lineTo(s * 0.3, -s * 0.02);
    context.lineTo(s * 0.4, -s * 0.12);
    context.lineTo(s * 0.3, -s * 0.16);
    context.lineTo(s * 0.32, -s * 0.3);
    context.closePath();
    context.fill();
    context.fillStyle = "#3a120f";
    context.beginPath();
    context.arc(-s * 0.02, -s * 0.02, s * 0.028, 0, Math.PI * 2);
    context.arc(s * 0.1, 0.02 * s, s * 0.028, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawSkullCandy(context, cx, cy, s) {
    context.save();
    context.translate(cx, cy);
    context.fillStyle = "#ff77c8";
    context.beginPath();
    context.moveTo(-s * 0.16, -s * 0.12);
    context.lineTo(-s * 0.42, 0);
    context.lineTo(-s * 0.16, s * 0.12);
    context.closePath();
    context.fill();
    context.fillStyle = "#7ad7ff";
    context.beginPath();
    context.moveTo(s * 0.16, -s * 0.12);
    context.lineTo(s * 0.42, 0);
    context.lineTo(s * 0.16, s * 0.12);
    context.closePath();
    context.fill();
    context.fillStyle = "#fffaf3";
    context.beginPath();
    context.arc(0, -s * 0.02, s * 0.22, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#e7d3c4";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#6a5b82";
    context.beginPath();
    context.ellipse(-s * 0.08, -s * 0.04, s * 0.045, s * 0.06, 0, 0, Math.PI * 2);
    context.ellipse(s * 0.08, -s * 0.04, s * 0.045, s * 0.06, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255, 160, 186, 0.9)";
    context.beginPath();
    context.arc(-s * 0.14, s * 0.05, s * 0.035, 0, Math.PI * 2);
    context.arc(s * 0.14, s * 0.05, s * 0.035, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#6a5b82";
    context.lineWidth = 1.4;
    context.lineCap = "round";
    context.beginPath();
    context.arc(0, s * 0.04, s * 0.06, 0.15 * Math.PI, 0.85 * Math.PI);
    context.stroke();
    context.restore();
  }

  function drawSlimeCan(context, cx, cy, s) {
    context.save();
    context.translate(cx, cy);
    var w = s * 0.26;
    var h = s * 0.36;
    context.fillStyle = "#aeb8a4";
    context.fillRect(-w, -h * 0.15, w * 2, h);
    context.fillStyle = "#e4f0df";
    context.beginPath();
    context.ellipse(0, -h * 0.15, w, s * 0.09, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#7e8e78";
    context.lineWidth = 1.5;
    context.stroke();
    context.fillStyle = "#6f8f72";
    context.fillRect(-w, s * 0.02, w * 2, s * 0.09);
    context.fillStyle = "#7CDE45";
    context.beginPath();
    context.ellipse(w * 0.85, s * 0.16, s * 0.07, s * 0.12, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(-w * 0.15, s * 0.32, s * 0.055, s * 0.09, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#314233";
    context.beginPath();
    context.arc(-s * 0.07, s * 0.02, s * 0.028, 0, Math.PI * 2);
    context.arc(s * 0.07, s * 0.02, s * 0.028, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  registerFood({
    id: "candy-apple",
    scoreDelta: 10,
    lengthDelta: 1,
    spawnWeight: 1,
    draw: function (context, cx, cy, s) { drawCandyApple(context, cx, cy, s); }
  });
  registerFood({
    id: "rotten-apple",
    scoreDelta: -5,
    lengthDelta: -1,
    spawnWeight: 1,
    draw: function (context, cx, cy, s) { drawRottenApple(context, cx, cy, s); }
  });
  registerFood({
    id: "chili",
    scoreDelta: -5,
    lengthDelta: -1,
    spawnWeight: 1,
    draw: function (context, cx, cy, s, time) { drawChili(context, cx, cy, s, time); }
  });
  registerFood({
    id: "skull-candy",
    scoreDelta: -5,
    lengthDelta: -1,
    spawnWeight: 1,
    draw: function (context, cx, cy, s) { drawSkullCandy(context, cx, cy, s); }
  });
  registerFood({
    id: "slime-can",
    scoreDelta: -5,
    lengthDelta: -1,
    spawnWeight: 1,
    draw: function (context, cx, cy, s) { drawSlimeCan(context, cx, cy, s); }
  });

  var pumpkins = [];
  var pumpkinSet = new Set();

  var PLAYER_LOOK = {
    body: "#ff9a3c",
    belly: "#ffe1bd",
    outline: "#9a4512",
    blush: "rgba(255, 120, 140, 0.9)",
    mark: "star"
  };
  var BOT_LOOK = {
    body: "#b69cff",
    belly: "#f3eaff",
    outline: "#5a3d9e",
    blush: "rgba(255, 176, 214, 0.95)",
    mark: "moon"
  };
  var NIB_LOOK = {
    body: "#7fd8c6",
    belly: "#e7fff8",
    outline: "#1d6d62",
    blush: "rgba(255, 176, 190, 0.95)",
    mark: "heart"
  };
  var LILAC_LOOK = {
    body: "#d7a4ff",
    belly: "#f7ecff",
    outline: "#6a3d93",
    blush: "rgba(255, 170, 200, 0.95)",
    mark: "heart"
  };
  var ROSE_LOOK = {
    body: "#ff8fb3",
    belly: "#ffe4ee",
    outline: "#9a3a5c",
    blush: "rgba(255, 180, 160, 0.95)",
    mark: "gem"
  };
  var GOLD_LOOK = {
    body: "#ffd56a",
    belly: "#fff6d4",
    outline: "#a07820",
    blush: "rgba(255, 160, 140, 0.9)",
    mark: "moon"
  };
  var LOOKS = {
    sunny: PLAYER_LOOK,
    pip: BOT_LOOK,
    nib: NIB_LOOK,
    lilac: LILAC_LOOK,
    rose: ROSE_LOOK,
    gold: GOLD_LOOK
  };
  var MODE_NOTE = {
    lazy: "Pip hunts treats and does not chase you.",
    between: "Pip and Nib hunt treats. A longer snake bites a shorter one, bots included.",
    aggressive: "Pip hunts you. If Pip is shorter, it grabs candy first, then comes after you."
  };

  var BOARD_STARS = [
    { fx: 0.12, fy: 0.08, r: 1.2, p: 0.2 },
    { fx: 0.3, fy: 0.16, r: 1.4, p: 1.1 },
    { fx: 0.55, fy: 0.06, r: 1.1, p: 2.2 },
    { fx: 0.78, fy: 0.14, r: 1.5, p: 0.7 },
    { fx: 0.9, fy: 0.28, r: 1.2, p: 1.8 },
    { fx: 0.18, fy: 0.42, r: 1.1, p: 2.8 },
    { fx: 0.42, fy: 0.62, r: 1.3, p: 0.4 },
    { fx: 0.66, fy: 0.48, r: 1.1, p: 1.5 },
    { fx: 0.84, fy: 0.7, r: 1.4, p: 2.4 },
    { fx: 0.08, fy: 0.78, r: 1.2, p: 0.9 },
    { fx: 0.5, fy: 0.88, r: 1.3, p: 1.9 },
    { fx: 0.93, fy: 0.9, r: 1.1, p: 2.6 }
  ];

  var ghosts = [
    { fx: 0.1, fy: 0.1, phase: 0.4, size: 1.15 },
    { fx: 0.88, fy: 0.34, phase: 1.8, size: 1 },
    { fx: 0.72, fy: 0.86, phase: 3.1, size: 1.05 }
  ];

  var score = 0;
  var foods = [];
  var particles = [];
  var floaters = [];
  var snakes = [];
  var player;
  var bot;
  var botMode = "lazy";
  var netTick = 0;
  var lan = { role: null, you: null, ws: null, ready: false, lastTick: 0, pendingDir: null, joins: [] };
  var PIP_SNACK_LENGTH = 9;
  var debug = { pause: false, manualBot: false, steps: 0 };
  var lastTime = 0;
  var acc = 0;
  var swipe = null;

  function snakeById(id) {
    for (var i = 0; i < snakes.length; i++) {
      if (snakes[i].id === id) return snakes[i];
    }
    return null;
  }

  function displayName(snake) {
    if (!snake) return "";
    if (lan.you && snake.id === lan.you) return "You";
    if (!lan.role && snake.kind === "human") return "You";
    return snake.name || "Snake";
  }

  function popColor(snake) {
    if (!snake) return "#ffb15e";
    if (snake.id === "player" || snake.lookId === "sunny") return "#ffb15e";
    if (snake.id === "bot" || snake.lookId === "pip") return "#d4c4ff";
    var look = LOOKS[snake.lookId];
    return look ? look.body : "#ffb15e";
  }

  function makePlayer() {
    return {
      id: "player",
      name: "You",
      kind: "human",
      lookId: "sunny",
      mode: null,
      score: 0,
      alive: true,
      dir: { x: 1, y: 0 },
      queued: null,
      respawnAt: 0,
      segments: (function () {
        var y = Math.floor(ROWS / 2);
        return [
          { x: 4, y: y },
          { x: 3, y: y },
          { x: 2, y: y },
          { x: 1, y: y }
        ];
      })()
    };
  }

  function makeBot() {
    var y = Math.max(1, Math.floor(ROWS / 5));
    var headX = Math.max(6, COLS - 5);
    return {
      id: "bot",
      name: "Pip",
      kind: "bot",
      lookId: "pip",
      mode: botMode === "between" ? "between" : botMode,
      score: 0,
      alive: true,
      dir: { x: -1, y: 0 },
      queued: null,
      respawnAt: 0,
      segments: [
        { x: headX, y: y },
        { x: headX + 1, y: y },
        { x: headX + 2, y: y },
        { x: headX + 3, y: y }
      ]
    };
  }

  function makeNib() {
    return {
      id: "nib",
      name: "Nib",
      kind: "bot",
      lookId: "nib",
      mode: "between",
      score: 0,
      alive: false,
      dir: { x: -1, y: 0 },
      queued: null,
      respawnAt: 0,
      segments: []
    };
  }

  function makeHuman(id, name, lookId) {
    return {
      id: id,
      name: name,
      kind: "human",
      lookId: lookId,
      mode: null,
      score: 0,
      alive: false,
      dir: { x: 1, y: 0 },
      queued: null,
      respawnAt: 0,
      segments: []
    };
  }

  function getType(id) {
    for (var i = 0; i < foodTypes.length; i++) {
      if (foodTypes[i].id === id) return foodTypes[i];
    }
    return null;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS;
  }

  function isPumpkin(x, y) {
    return pumpkinSet.has(x + "," + y);
  }

  function occupies(snake, x, y, ignoreTail) {
    if (!snake || !snake.alive) return false;
    var n = snake.segments.length;
    var last = ignoreTail ? n - 1 : n;
    if (last < 0) last = 0;
    for (var i = 0; i < last; i++) {
      if (snake.segments[i].x === x && snake.segments[i].y === y) return true;
    }
    return false;
  }

  function foodAt(x, y) {
    for (var i = 0; i < foods.length; i++) {
      if (foods[i].x === x && foods[i].y === y) return foods[i];
    }
    return null;
  }

  function occupiedByAny(x, y) {
    for (var i = 0; i < snakes.length; i++) {
      if (occupies(snakes[i], x, y, false)) return true;
    }
    return false;
  }

  function isFree(x, y) {
    if (!inBounds(x, y) || isPumpkin(x, y)) return false;
    if (occupiedByAny(x, y)) return false;
    if (foodAt(x, y)) return false;
    return true;
  }

  function othersOf(snake) {
    var list = [];
    for (var i = 0; i < snakes.length; i++) {
      var other = snakes[i];
      if (other !== snake && other.alive && other.segments.length) list.push(other);
    }
    return list;
  }

  function takeFoodAt(x, y) {
    for (var i = 0; i < foods.length; i++) {
      if (foods[i].x === x && foods[i].y === y) {
        return foods.splice(i, 1)[0];
      }
    }
    return null;
  }

  function pickWeighted(pool) {
    var total = 0;
    var i;
    for (i = 0; i < pool.length; i++) total += pool[i].spawnWeight;
    if (total <= 0) return pool[0];
    var r = Math.random() * total;
    for (i = 0; i < pool.length; i++) {
      r -= pool[i].spawnWeight;
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function randomEmpty() {
    var open = [];
    var x, y;
    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) {
        if (isFree(x, y)) open.push({ x: x, y: y });
      }
    }
    if (!open.length) return null;
    return open[Math.floor(Math.random() * open.length)];
  }

  function spawnFood(kind) {
    var pool = foodTypes.filter(function (t) {
      return kind === "good" ? t.lengthDelta > 0 : t.lengthDelta < 0;
    });
    if (!pool.length) return false;
    var type = pickWeighted(pool);
    var spot = randomEmpty();
    if (!spot || !type) return false;
    foods.push({ typeId: type.id, x: spot.x, y: spot.y });
    return true;
  }

  function countKind(kind) {
    var n = 0;
    for (var i = 0; i < foods.length; i++) {
      var type = getType(foods[i].typeId);
      if (!type) continue;
      if (kind === "good" && type.lengthDelta > 0) n++;
      if (kind === "bad" && type.lengthDelta < 0) n++;
    }
    return n;
  }

  function targetGood() {
    return Math.max(2, Math.round((COLS * ROWS) / 480));
  }

  function targetBad() {
    return Math.max(3, Math.round((COLS * ROWS) / 260));
  }

  function ensureFoods() {
    var guard = 0;
    var good = targetGood();
    var bad = targetBad();
    while (countKind("good") < good && guard++ < 80) {
      if (!spawnFood("good")) break;
    }
    guard = 0;
    while (countKind("bad") < bad && guard++ < 80) {
      if (!spawnFood("bad")) break;
    }
  }

  function setupFoods() {
    foods = [];
    if (!player || !player.segments.length) return;
    var head = player.segments[0];
    var ahead = { x: head.x + player.dir.x * 6, y: head.y + player.dir.y * 6 };
    if (inBounds(ahead.x, ahead.y) && !isPumpkin(ahead.x, ahead.y) && !occupiedByAny(ahead.x, ahead.y)) {
      foods.push({ typeId: "candy-apple", x: ahead.x, y: ahead.y });
    }
  }

  function usePumpkins(list) {
    pumpkins = list.map(function (p) { return { x: p.x, y: p.y }; });
    pumpkinSet = new Set(pumpkins.map(function (p) { return p.x + "," + p.y; }));
  }

  function buildPumpkins() {
    var count = Math.max(6, Math.round((COLS * ROWS) / WORLD.pumpkinEvery));
    var blocked = {};
    function blockSnake(snake, pad) {
      if (!snake) return;
      var i, dx, dy;
      for (i = 0; i < snake.segments.length; i++) {
        var seg = snake.segments[i];
        for (dy = -pad; dy <= pad; dy++) {
          for (dx = -pad; dx <= pad; dx++) {
            blocked[(seg.x + dx) + "," + (seg.y + dy)] = true;
          }
        }
      }
    }
    blockSnake(player, 2);
    blockSnake(bot, 2);
    var placed = [];
    var guard = 0;
    while (placed.length < count && guard++ < count * 80) {
      var x = Math.floor(Math.random() * COLS);
      var y = Math.floor(Math.random() * ROWS);
      if (blocked[x + "," + y]) continue;
      var spaced = true;
      var i;
      for (i = 0; i < placed.length; i++) {
        if (Math.max(Math.abs(placed[i].x - x), Math.abs(placed[i].y - y)) < 3) {
          spaced = false;
          break;
        }
      }
      if (!spaced) continue;
      placed.push({ x: x, y: y });
      blocked[x + "," + y] = true;
    }
    usePumpkins(placed);
  }

  function updateCamera() {
    var span = WORLD.minView;
    var cx = COLS / 2;
    var cy = ROWS / 2;
    var snake = player && player.alive && player.segments.length ? player : null;
    if (snake) {
      var head = snake.segments[0];
      var minX = head.x;
      var maxX = head.x;
      var minY = head.y;
      var maxY = head.y;
      var i;
      for (i = 1; i < snake.segments.length; i++) {
        var seg = snake.segments[i];
        if (seg.x < minX) minX = seg.x;
        if (seg.x > maxX) maxX = seg.x;
        if (seg.y < minY) minY = seg.y;
        if (seg.y > maxY) maxY = seg.y;
      }
      var pad = WORLD.viewMargin;
      var needX = (maxX - minX + 1) + pad * 2;
      var needY = (maxY - minY + 1) + pad * 2;
      span = Math.max(WORLD.minView, needX, needY);
      if (needX <= WORLD.minView && needY <= WORLD.minView) {
        cx = head.x + 0.5;
        cy = head.y + 0.5;
      } else {
        cx = (minX + maxX + 1) / 2;
        cy = (minY + maxY + 1) / 2;
      }
    }
    if (span > COLS) span = COLS;
    if (span > ROWS) span = ROWS;
    var left = cx - span / 2;
    var top = cy - span / 2;
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left + span > COLS) left = Math.max(0, COLS - span);
    if (top + span > ROWS) top = Math.max(0, ROWS - span);
    view.left = left;
    view.top = top;
    view.span = span;
    var side = Math.min(cssW || 1, cssH || 1);
    cellSize = side / span;
  }

  function cellCenter(x, y) {
    return {
      cx: (x - view.left) * cellSize + cellSize / 2,
      cy: (y - view.top) * cellSize + cellSize / 2
    };
  }

  function burst(x, y, color) {
    var c = cellCenter(x, y);
    var i;
    for (i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2;
      var speed = 0.55 + Math.random() * 1.5;
      particles.push({
        x: c.cx,
        y: c.cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 1,
        color: color,
        r: 2 + Math.random() * 2.2
      });
    }
  }

  function addFloater(x, y, text, color) {
    var c = cellCenter(x, y);
    floaters.push({ x: c.cx, y: c.cy, text: text, color: color, life: 1 });
  }

  function cleanDir(dir) {
    if (!dir) return null;
    var dx = Math.sign(Number(dir.x) || 0);
    var dy = dx !== 0 ? 0 : Math.sign(Number(dir.y) || 0);
    if (!dx && !dy) return null;
    return { x: dx, y: dy };
  }

  function setPlayerDir(dx, dy) {
    if (!player || !player.alive) return;
    var dir = cleanDir({ x: dx, y: dy });
    if (!dir) return;
    if (player.segments.length > 1 && dir.x === -player.dir.x && dir.y === -player.dir.y) return;
    if (lan.role === "guest") {
      lan.pendingDir = dir;
      send({ type: "input", dir: dir });
      return;
    }
    player.queued = dir;
  }

  function queueRemote(id, dir) {
    var snake = snakeById(id);
    var clean = cleanDir(dir);
    if (!snake || !clean || snake.kind !== "human" || !snake.alive) return;
    if (snake.segments.length > 1 && clean.x === -snake.dir.x && clean.y === -snake.dir.y) return;
    snake.queued = clean;
  }

  function applyQueued(snake) {
    if (!snake.queued) return;
    var q = snake.queued;
    var reverse = snake.segments.length > 1 && q.x === -snake.dir.x && q.y === -snake.dir.y;
    if (!reverse) snake.dir = { x: q.x, y: q.y };
    snake.queued = null;
  }

  function botCellBlocked(snake, nx, ny) {
    if (!inBounds(nx, ny) || isPumpkin(nx, ny)) return true;
    if (occupies(snake, nx, ny, true)) return true;
    var mode = snake.mode || "lazy";
    var others = othersOf(snake);
    var i;
    for (i = 0; i < others.length; i++) {
      var other = others[i];
      var head = other.segments[0];
      var longer = snake.segments.length > other.segments.length;
      if (mode === "lazy") {
        if (head.x === nx && head.y === ny) return true;
        if (snake.segments.length === other.segments.length && occupies(other, nx, ny, false)) return true;
      } else if (!longer && occupies(other, nx, ny, false)) {
        return true;
      }
    }
    return false;
  }

  function stepCost(snake, nx, ny) {
    var cost = 1;
    var food = foodAt(nx, ny);
    var mode = snake.mode || "lazy";
    if (food) {
      var type = getType(food.typeId);
      if (type && type.lengthDelta < 0 && snake.segments.length < PIP_SNACK_LENGTH) cost += 16;
      if (type && type.lengthDelta > 0 && snake.segments.length >= PIP_SNACK_LENGTH) cost += 12;
    }
    var others = othersOf(snake);
    var i, s;
    for (i = 0; i < others.length; i++) {
      var other = others[i];
      var prey = mode !== "lazy" && snake.segments.length > other.segments.length;
      if (prey) continue;
      var head = other.segments[0];
      if (Math.abs(head.x - nx) + Math.abs(head.y - ny) === 1) cost += 8;
      for (s = 1; s < other.segments.length; s++) {
        if (other.segments[s].x === nx && other.segments[s].y === ny) cost += 6;
      }
    }
    return cost;
  }

  function shortestDir(snake, head, goals) {
    var goalSet = {};
    var g;
    for (g = 0; g < goals.length; g++) goalSet[goals[g].x + "," + goals[g].y] = true;
    var startK = head.x + "," + head.y;
    var dist = {};
    var prev = {};
    dist[startK] = 0;
    var pq = [{ x: head.x, y: head.y, d: 0 }];
    var found = null;
    var dirs = [
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ];
    while (pq.length) {
      pq.sort(function (a, b) { return a.d - b.d; });
      var cur = pq.shift();
      var ck = cur.x + "," + cur.y;
      if (cur.d !== dist[ck]) continue;
      if (ck !== startK && goalSet[ck]) {
        found = ck;
        break;
      }
      for (var di = 0; di < dirs.length; di++) {
        var dir = dirs[di];
        if (ck === startK && snake.segments.length > 1 && dir.x === -snake.dir.x && dir.y === -snake.dir.y) continue;
        var nx = cur.x + dir.x;
        var ny = cur.y + dir.y;
        if (botCellBlocked(snake, nx, ny)) continue;
        var nk = nx + "," + ny;
        var nd = cur.d + stepCost(snake, nx, ny);
        if (dist[nk] === undefined || nd < dist[nk]) {
          dist[nk] = nd;
          prev[nk] = ck;
          pq.push({ x: nx, y: ny, d: nd });
        }
      }
    }
    if (!found) return null;
    var cursor = found;
    var parent = prev[cursor];
    while (parent && parent !== startK) {
      cursor = parent;
      parent = prev[cursor];
    }
    var parts = cursor.split(",");
    var x = Number(parts[0]);
    var y = Number(parts[1]);
    return { x: x - head.x, y: y - head.y };
  }

  function nearestPrey(snake) {
    var others = othersOf(snake);
    var best = null;
    var bestD = Infinity;
    var head = snake.segments[0];
    for (var i = 0; i < others.length; i++) {
      var other = others[i];
      if (snake.segments.length <= other.segments.length) continue;
      var oh = other.segments[0];
      var dist = Math.abs(oh.x - head.x) + Math.abs(oh.y - head.y);
      if (dist < bestD) {
        bestD = dist;
        best = oh;
      }
    }
    return best;
  }

  function fallbackDir(snake, head) {
    var mode = snake.mode || "lazy";
    var options = [
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ];
    var best = null;
    var bestScore = Infinity;
    var prey = mode === "lazy" ? null : nearestPrey(snake);
    var others = othersOf(snake);
    for (var i = 0; i < options.length; i++) {
      var d = options[i];
      if (snake.segments.length > 1 && d.x === -snake.dir.x && d.y === -snake.dir.y) continue;
      var nx = head.x + d.x;
      var ny = head.y + d.y;
      if (botCellBlocked(snake, nx, ny)) continue;
      var scoreHere = stepCost(snake, nx, ny);
      if (d.x === snake.dir.x && d.y === snake.dir.y) scoreHere -= 0.4;
      if (mode === "lazy") {
        var o;
        for (o = 0; o < others.length; o++) {
          var ph = others[o].segments[0];
          var now = Math.abs(ph.x - head.x) + Math.abs(ph.y - head.y);
          var next = Math.abs(ph.x - nx) + Math.abs(ph.y - ny);
          if (next < now) scoreHere += 4;
        }
      } else if (prey) {
        var preyNow = Math.abs(prey.x - head.x) + Math.abs(prey.y - head.y);
        var preyNext = Math.abs(prey.x - nx) + Math.abs(prey.y - ny);
        if (preyNext < preyNow) scoreHere -= 3;
      }
      if (scoreHere < bestScore) {
        bestScore = scoreHere;
        best = d;
      }
    }
    return best;
  }

  function foodGoals(snake) {
    var good = [];
    var bad = [];
    for (var i = 0; i < foods.length; i++) {
      var type = getType(foods[i].typeId);
      if (!type) continue;
      if (type.lengthDelta > 0) good.push(foods[i]);
      else if (type.lengthDelta < 0) bad.push(foods[i]);
    }
    // Hunt candy. Once a bot is long enough to crowd the board, nibble a bad treat first.
    if (snake.segments.length >= PIP_SNACK_LENGTH && bad.length) return bad;
    return good;
  }

  function preyGoals(snake) {
    var goals = [];
    var others = othersOf(snake);
    var i, s;
    for (i = 0; i < others.length; i++) {
      var other = others[i];
      if (snake.segments.length <= other.segments.length) continue;
      for (s = 0; s < other.segments.length; s++) {
        goals.push({ x: other.segments[s].x, y: other.segments[s].y });
      }
    }
    return goals;
  }

  function chooseBotDirection(snake) {
    if (!snake || !snake.alive || !snake.segments.length) return null;
    var mode = snake.mode || "lazy";
    var head = snake.segments[0];
    var goals;
    if (mode === "aggressive") {
      var prey = preyGoals(snake);
      goals = prey.length ? prey : foodGoals(snake);
    } else if (mode === "between") {
      goals = foodGoals(snake).concat(preyGoals(snake));
    } else {
      goals = foodGoals(snake);
    }
    var dir = goals.length ? shortestDir(snake, head, goals) : null;
    if (!dir) dir = fallbackDir(snake, head);
    if (!dir) return null;
    if (snake.segments.length > 1 && dir.x === -snake.dir.x && dir.y === -snake.dir.y) {
      return fallbackDir(snake, head);
    }
    return dir;
  }

  function planMove(snake) {
    var head = snake.segments[0];
    var nx = head.x + snake.dir.x;
    var ny = head.y + snake.dir.y;
    if (!inBounds(nx, ny) || isPumpkin(nx, ny) || occupies(snake, nx, ny, true)) {
      return { blocked: true, x: head.x, y: head.y };
    }
    return { blocked: false, x: nx, y: ny };
  }

  function futureCells(snake, plan) {
    if (!snake || !snake.alive || !snake.segments.length) return [];
    if (!plan || plan.blocked) {
      return snake.segments.map(function (s) { return { x: s.x, y: s.y }; });
    }
    var cells = [{ x: plan.x, y: plan.y }];
    for (var i = 0; i < snake.segments.length - 1; i++) {
      cells.push({ x: snake.segments[i].x, y: snake.segments[i].y });
    }
    return cells;
  }

  function cellsIntersect(a, b) {
    var set = {};
    for (var i = 0; i < a.length; i++) set[a[i].x + "," + a[i].y] = true;
    for (var j = 0; j < b.length; j++) {
      if (set[b[j].x + "," + b[j].y]) return true;
    }
    return false;
  }

  function headSwap(a, aPlan, b, bPlan) {
    if (!a.alive || !b.alive || !a.segments.length || !b.segments.length) return false;
    if (!aPlan || aPlan.blocked || !bPlan || bPlan.blocked) return false;
    var ah = a.segments[0];
    var bh = b.segments[0];
    return aPlan.x === bh.x && aPlan.y === bh.y && bPlan.x === ah.x && bPlan.y === ah.y;
  }

  function touches(a, aPlan, b, bPlan) {
    if (!a.alive || !b.alive) return false;
    if (cellsIntersect(futureCells(a, aPlan), futureCells(b, bPlan))) return true;
    return headSwap(a, aPlan, b, bPlan);
  }

  function hitsSolidOther(plan, other, otherPlan) {
    if (!plan || plan.blocked) return false;
    var i;
    for (i = 0; i < other.segments.length; i++) {
      if (other.segments[i].x === plan.x && other.segments[i].y === plan.y) return true;
    }
    if (otherPlan && !otherPlan.blocked && otherPlan.x === plan.x && otherPlan.y === plan.y) return true;
    return false;
  }

  function despawn(snake) {
    if (snake.segments.length) {
      burst(snake.segments[0].x, snake.segments[0].y, popColor(snake));
    }
    snake.alive = false;
    snake.segments = [];
    snake.queued = null;
    if (snake.kind === "bot") snake.respawnAt = performance.now() + BOT_RESPAWN_MS;
  }

  function cutHalf(snake) {
    var remove = Math.max(1, Math.floor(snake.segments.length / 2));
    var keep = snake.segments.length - remove;
    if (keep < 1) {
      despawn(snake);
      return;
    }
    var lost = snake.segments[keep];
    snake.segments = snake.segments.slice(0, keep);
    if (lost) burst(lost.x, lost.y, "#ffe08a");
  }

  function resolvePair(a, b, plans) {
    if (!a || !b || !a.alive || !b.alive) return;
    var aPlan = plans.get(a);
    var bPlan = plans.get(b);
    if (!aPlan || !bPlan) return;
    if (a.segments.length === b.segments.length) {
      var blockA = hitsSolidOther(aPlan, b, bPlan);
      var blockB = hitsSolidOther(bPlan, a, aPlan);
      if (blockA) aPlan.blocked = true;
      if (blockB) bPlan.blocked = true;
      return;
    }
    if (!touches(a, aPlan, b, bPlan)) return;
    var smaller = a.segments.length < b.segments.length ? a : b;
    cutHalf(smaller);
    if (!a.alive || !b.alive) return;
    for (var pass = 0; pass < 3; pass++) {
      var ap = plans.get(a);
      var bp = plans.get(b);
      if (!touches(a, ap, b, bp)) break;
      var small = a.segments.length <= b.segments.length ? a : b;
      var large = small === a ? b : a;
      var sp = plans.get(small);
      var lp = plans.get(large);
      if (sp && !sp.blocked) sp.blocked = true;
      else if (lp && !lp.blocked) lp.blocked = true;
      else break;
    }
  }

  function resolveMany(plans, live) {
    var ia, ib, a, b;
    for (ia = 0; ia < live.length; ia++) {
      for (ib = ia + 1; ib < live.length; ib++) {
        a = live[ia];
        b = live[ib];
        if (a.segments.length !== b.segments.length) continue;
        var ap = plans.get(a);
        var bp = plans.get(b);
        if (!ap || !bp) continue;
        if (hitsSolidOther(ap, b, bp)) ap.blocked = true;
        if (hitsSolidOther(bp, a, ap)) bp.blocked = true;
      }
    }
    var victims = [];
    var seen = {};
    for (ia = 0; ia < live.length; ia++) {
      for (ib = ia + 1; ib < live.length; ib++) {
        a = live[ia];
        b = live[ib];
        if (!a.alive || !b.alive) continue;
        if (a.segments.length === b.segments.length) continue;
        if (!touches(a, plans.get(a), b, plans.get(b))) continue;
        var smaller = a.segments.length < b.segments.length ? a : b;
        if (seen[smaller.id]) continue;
        seen[smaller.id] = true;
        victims.push(smaller);
      }
    }
    for (ia = 0; ia < victims.length; ia++) cutHalf(victims[ia]);
    var pass;
    for (pass = 0; pass < 3; pass++) {
      var changed = false;
      for (ia = 0; ia < live.length; ia++) {
        for (ib = ia + 1; ib < live.length; ib++) {
          a = live[ia];
          b = live[ib];
          if (!a.alive || !b.alive) continue;
          var ap2 = plans.get(a);
          var bp2 = plans.get(b);
          if (!touches(a, ap2, b, bp2)) continue;
          var small = null;
          if (a.segments.length < b.segments.length) small = a;
          else if (b.segments.length < a.segments.length) small = b;
          if (!small) {
            if (ap2 && !ap2.blocked) { ap2.blocked = true; changed = true; }
            if (bp2 && !bp2.blocked) { bp2.blocked = true; changed = true; }
            continue;
          }
          var sp = plans.get(small);
          var large = small === a ? b : a;
          var lp = plans.get(large);
          if (sp && !sp.blocked) { sp.blocked = true; changed = true; }
          else if (lp && !lp.blocked) { lp.blocked = true; changed = true; }
        }
      }
      if (!changed) break;
    }
  }

  function resolveContact(plans) {
    var live = [];
    for (var i = 0; i < snakes.length; i++) {
      if (snakes[i].alive && snakes[i].segments.length) live.push(snakes[i]);
    }
    if (live.length < 2) return;
    if (live.length === 2) {
      var a = live[0];
      var b = live[1];
      if (a === bot && b === player) {
        a = player;
        b = bot;
      }
      resolvePair(a, b, plans);
      return;
    }
    resolveMany(plans, live);
  }

  function moveSnake(snake, nx, ny) {
    var before = snake.segments.length;
    snake.segments.unshift({ x: nx, y: ny });
    var food = takeFoodAt(nx, ny);
    var lengthDelta = 0;
    if (food) {
      var type = getType(food.typeId);
      if (type) {
        lengthDelta = type.lengthDelta;
        if (snake.kind === "human") {
          snake.score = Math.max(0, (snake.score || 0) + type.scoreDelta);
          if (snake === player) score = snake.score;
          addFloater(
            nx,
            ny,
            (type.scoreDelta > 0 ? "+" : "") + type.scoreDelta,
            type.scoreDelta >= 0 ? "#ffe08a" : "#ff9bb5"
          );
        }
        burst(nx, ny, type.lengthDelta >= 0 ? "#ffd56a" : "#b6ff6a");
      }
    }
    var target = Math.max(1, before + lengthDelta);
    while (snake.segments.length > target) snake.segments.pop();
    while (snake.segments.length < target) {
      var tail = snake.segments[snake.segments.length - 1];
      snake.segments.push({ x: tail.x, y: tail.y });
    }
  }

  function findSpawn(length) {
    var cells = [];
    var x, y, i;
    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) cells.push({ x: x, y: y });
    }
    for (i = cells.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = cells[i];
      cells[i] = cells[j];
      cells[j] = tmp;
    }
    var dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];
    function trySpot(head, dir, needFront) {
      var segs = [{ x: head.x, y: head.y }];
      if (!isFree(head.x, head.y)) return null;
      for (var n = 1; n < length; n++) {
        var sx = head.x - dir.x * n;
        var sy = head.y - dir.y * n;
        if (!isFree(sx, sy)) return null;
        segs.push({ x: sx, y: sy });
      }
      if (needFront) {
        var fx = head.x + dir.x;
        var fy = head.y + dir.y;
        if (!inBounds(fx, fy) || isPumpkin(fx, fy) || occupiedByAny(fx, fy)) {
          return null;
        }
      }
      return { segments: segs, dir: { x: dir.x, y: dir.y } };
    }
    var c, d;
    for (c = 0; c < cells.length; c++) {
      for (d = 0; d < dirs.length; d++) {
        var spot = trySpot(cells[c], dirs[d], true);
        if (spot) return spot;
      }
    }
    for (c = 0; c < cells.length; c++) {
      for (d = 0; d < dirs.length; d++) {
        var loose = trySpot(cells[c], dirs[d], false);
        if (loose) return loose;
      }
    }
    return null;
  }

  function respawnSnake(snake, length) {
    var spot = findSpawn(length) || (length > 1 ? findSpawn(1) : null);
    if (!spot) return false;
    snake.alive = true;
    snake.respawnAt = 0;
    snake.segments = spot.segments;
    snake.dir = spot.dir;
    snake.queued = null;
    burst(spot.segments[0].x, spot.segments[0].y, popColor(snake));
    return true;
  }

  function step() {
    var i;
    for (i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      if (!snake.alive) continue;
      if (snake.kind === "bot") {
        if (!debug.manualBot) {
          var choice = chooseBotDirection(snake);
          if (choice) snake.dir = { x: choice.x, y: choice.y };
        }
      } else {
        applyQueued(snake);
      }
    }

    var plans = new Map();
    for (i = 0; i < snakes.length; i++) {
      var planned = snakes[i];
      if (planned.alive && planned.segments.length) plans.set(planned, planMove(planned));
    }
    resolveContact(plans);

    for (i = 0; i < snakes.length; i++) {
      var moving = snakes[i];
      if (!moving.alive) continue;
      var plan = plans.get(moving);
      if (!plan || plan.blocked) continue;
      moveSnake(moving, plan.x, plan.y);
    }

    for (i = 0; i < snakes.length; i++) {
      var human = snakes[i];
      if (human.kind === "human" && !human.alive) respawnSnake(human, 3);
    }
    ensureFoods();
    debug.steps += 1;
    if (player) score = player.score || 0;
  }

  function renderHud() {
    var shown = player ? (player.score || 0) : score;
    var scoreText = "Score " + shown;
    if (scoreEl.textContent !== scoreText) scoreEl.textContent = scoreText;
    var el = document.getElementById("lengths");
    if (!el) return;
    var frag = document.createDocumentFragment();
    var count = 0;
    for (var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      if (count) {
        var sep = document.createElement("span");
        sep.className = "sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "·";
        frag.appendChild(sep);
      }
      var sw = document.createElement("span");
      sw.className = "swatch";
      sw.setAttribute("aria-hidden", "true");
      var look = LOOKS[snake.lookId] || PLAYER_LOOK;
      sw.style.background = look.body;
      var label = document.createElement("span");
      var name = displayName(snake);
      if (snake.kind === "bot" && !snake.alive) label.textContent = name + " is coming back";
      else if (lan.role && snake.kind === "human") {
        label.textContent = name + " " + (snake.alive ? snake.segments.length : 0) + " · " + (snake.score || 0);
      } else label.textContent = name + " " + (snake.alive ? snake.segments.length : 0);
      frag.appendChild(sw);
      frag.appendChild(label);
      count++;
    }
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
  }

  function drawStar(context, x, y, r) {
    context.save();
    context.translate(x, y);
    context.fillStyle = "#ffe38a";
    context.beginPath();
    for (var i = 0; i < 5; i++) {
      var outer = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      var inner = outer + Math.PI / 5;
      if (i === 0) context.moveTo(Math.cos(outer) * r, Math.sin(outer) * r);
      else context.lineTo(Math.cos(outer) * r, Math.sin(outer) * r);
      context.lineTo(Math.cos(inner) * r * 0.42, Math.sin(inner) * r * 0.42);
    }
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawBoard(time) {
    var sky = ctx.createLinearGradient(0, 0, 0, cssH);
    sky.addColorStop(0, "#2a1d55");
    sky.addColorStop(0.5, "#1a1440");
    sky.addColorStop(1, "#14102c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cssW, cssH);

    var glow = ctx.createRadialGradient(cssW * 0.86, cssH * 0.08, 8, cssW * 0.86, cssH * 0.08, cssW * 0.75);
    glow.addColorStop(0, "rgba(255, 226, 170, 0.22)");
    glow.addColorStop(1, "rgba(255, 226, 170, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, cssW, cssH);

    var s;
    for (s = 0; s < BOARD_STARS.length; s++) {
      var star = BOARD_STARS[s];
      ctx.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time / 480 + star.p));
      ctx.fillStyle = "#fff8e6";
      ctx.beginPath();
      ctx.arc(star.fx * cssW, star.fy * cssH, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    var x0 = Math.max(0, Math.floor(view.left));
    var y0 = Math.max(0, Math.floor(view.top));
    var x1 = Math.min(COLS, Math.ceil(view.left + view.span));
    var y1 = Math.min(ROWS, Math.ceil(view.top + view.span));
    var x, y;
    for (y = y0; y < y1; y++) {
      for (x = x0; x < x1; x++) {
        var dot = cellCenter(x, y);
        ctx.beginPath();
        ctx.arc(dot.cx, dot.cy, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawWeb(x, y, size, flipX, flipY) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX, flipY);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    var i;
    for (i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, (size * i) / 4, 0, Math.PI / 2);
      ctx.stroke();
    }
    for (var a = 0; a <= Math.PI / 2 + 0.01; a += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhost(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(247, 244, 255, 0.9)";
    ctx.beginPath();
    var r = s * 0.46;
    ctx.arc(0, 0, r, Math.PI, 0);
    ctx.lineTo(r, r * 0.55);
    ctx.quadraticCurveTo(r * 0.66, r * 1.05, r * 0.33, r * 0.55);
    ctx.quadraticCurveTo(0, r * 1.05, -r * 0.33, r * 0.55);
    ctx.quadraticCurveTo(-r * 0.66, r * 1.05, -r, r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(120, 100, 170, 0.45)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#3a2d55";
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.02, s * 0.055, 0, Math.PI * 2);
    ctx.arc(s * 0.12, -s * 0.02, s * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 160, 190, 0.85)";
    ctx.beginPath();
    ctx.arc(-s * 0.2, s * 0.1, s * 0.045, 0, Math.PI * 2);
    ctx.arc(s * 0.2, s * 0.1, s * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6d5c90";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, s * 0.06, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  function drawPumpkin(p) {
    var c = cellCenter(p.x, p.y);
    var r = cellSize * 0.4;
    ctx.save();
    ctx.translate(c.cx, c.cy);
    ctx.shadowColor = "rgba(255, 160, 50, 0.9)";
    ctx.shadowBlur = cellSize * 0.28;
    ctx.fillStyle = "#f08a24";
    ctx.beginPath();
    ctx.ellipse(0, cellSize * 0.03, r, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(166, 72, 8, 0.75)";
    ctx.lineWidth = Math.max(1, cellSize * 0.035);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.quadraticCurveTo(r * 0.18, 0, 0, r * 0.82);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.55);
    ctx.quadraticCurveTo(-r * 0.2, 0, -r * 0.38, r * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.38, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.2, 0, r * 0.38, r * 0.6);
    ctx.stroke();
    ctx.fillStyle = "#3d7a34";
    ctx.fillRect(-cellSize * 0.055, -r - cellSize * 0.02, cellSize * 0.11, cellSize * 0.16);
    ctx.fillStyle = "#ffe7a0";
    ctx.shadowColor = "rgba(255, 220, 120, 0.95)";
    ctx.shadowBlur = cellSize * 0.12;
    function eye(cx) {
      ctx.beginPath();
      ctx.moveTo(cx - cellSize * 0.08, -cellSize * 0.02);
      ctx.lineTo(cx + cellSize * 0.08, -cellSize * 0.02);
      ctx.lineTo(cx, cellSize * 0.09);
      ctx.closePath();
      ctx.fill();
    }
    eye(-cellSize * 0.13);
    eye(cellSize * 0.13);
    ctx.beginPath();
    ctx.arc(0, cellSize * 0.15, cellSize * 0.09, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = Math.max(1.5, cellSize * 0.045);
    ctx.strokeStyle = "#ffe7a0";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  function traceSnake(snake) {
    ctx.beginPath();
    for (var i = 0; i < snake.segments.length; i++) {
      var c = cellCenter(snake.segments[i].x, snake.segments[i].y);
      if (i === 0) ctx.moveTo(c.cx, c.cy);
      else ctx.lineTo(c.cx, c.cy);
    }
  }

  function drawSnake(snake, look) {
    if (!snake.alive || !snake.segments.length) return;
    var width = cellSize * 1.08;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (snake.segments.length > 1) {
      ctx.strokeStyle = look.outline;
      ctx.lineWidth = width + Math.max(3, cellSize * 0.1);
      traceSnake(snake);
      ctx.stroke();
      ctx.strokeStyle = look.body;
      ctx.lineWidth = width;
      traceSnake(snake);
      ctx.stroke();
      ctx.strokeStyle = look.belly;
      ctx.lineWidth = width * 0.38;
      traceSnake(snake);
      ctx.stroke();
    }
    var head = snake.segments[0];
    var c = cellCenter(head.x, head.y);
    var hr = cellSize * 0.62;
    ctx.fillStyle = look.body;
    ctx.strokeStyle = look.outline;
    ctx.lineWidth = Math.max(2.5, cellSize * 0.08);
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    var ang = Math.atan2(snake.dir.y, snake.dir.x);
    ctx.save();
    ctx.translate(c.cx, c.cy);
    ctx.rotate(ang);
    var eyeX = hr * 0.28;
    var eyeY = hr * 0.36;
    var eyeR = hr * 0.28;
    var side;
    for (side = -1; side <= 1; side += 2) {
      ctx.fillStyle = "#fffdf8";
      ctx.beginPath();
      ctx.arc(eyeX, side * eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2c2144";
      ctx.beginPath();
      ctx.arc(eyeX + eyeR * 0.38, side * eyeY, eyeR * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(eyeX + eyeR * 0.15, side * eyeY - eyeR * 0.28, eyeR * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.blush;
      ctx.beginPath();
      ctx.ellipse(eyeX - hr * 0.05, side * (eyeY + eyeR * 0.95), hr * 0.12, hr * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = look.outline;
    ctx.lineWidth = Math.max(1.5, cellSize * 0.055);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hr * 0.22, -hr * 0.12);
    ctx.quadraticCurveTo(hr * 0.48, 0, hr * 0.22, hr * 0.12);
    ctx.stroke();
    ctx.restore();

    if (look.mark === "star") drawStar(ctx, c.cx, c.cy - cellSize * 0.78, cellSize * 0.16);
    if (look.mark === "moon") {
      ctx.fillStyle = "#fff6d2";
      ctx.beginPath();
      ctx.arc(c.cx, c.cy - cellSize * 0.78, cellSize * 0.12, 0.4, Math.PI * 1.7);
      ctx.arc(c.cx + cellSize * 0.06, c.cy - cellSize * 0.8, cellSize * 0.1, Math.PI * 1.55, 0.55, true);
      ctx.closePath();
      ctx.fill();
    }
    if (look.mark === "heart") {
      ctx.save();
      ctx.translate(c.cx, c.cy - cellSize * 0.78);
      ctx.fillStyle = "#ff8fb3";
      ctx.beginPath();
      ctx.moveTo(0, cellSize * 0.08);
      ctx.bezierCurveTo(-cellSize * 0.16, -cellSize * 0.08, -cellSize * 0.08, -cellSize * 0.16, 0, -cellSize * 0.05);
      ctx.bezierCurveTo(cellSize * 0.08, -cellSize * 0.16, cellSize * 0.16, -cellSize * 0.08, 0, cellSize * 0.08);
      ctx.fill();
      ctx.restore();
    }
    if (look.mark === "gem") {
      ctx.fillStyle = "#fff6ea";
      ctx.beginPath();
      ctx.arc(c.cx, c.cy - cellSize * 0.78, cellSize * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFoods(time) {
    var i;
    for (i = 0; i < foods.length; i++) {
      var food = foods[i];
      var type = getType(food.typeId);
      if (!type || !type.draw) continue;
      var c = cellCenter(food.x, food.y);
      type.draw(ctx, c.cx, c.cy, cellSize, time);
    }
  }

  function drawFx() {
    var i;
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.font = "700 " + Math.max(14, Math.round(cellSize * 0.42)) + "px Trebuchet MS, sans-serif";
    for (i = 0; i < floaters.length; i++) {
      var f = floaters[i];
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function draw(time) {
    updateCamera();
    if (!cellSize) return;
    drawBoard(time);
    var web = cellSize * 1.7;
    drawWeb(2, 2, web, 1, 1);
    drawWeb(cssW - 2, 2, web, -1, 1);
    drawWeb(2, cssH - 2, web, 1, -1);

    var g;
    for (g = 0; g < ghosts.length; g++) {
      var ghost = ghosts[g];
      var wobble = Math.sin(time / 520 + ghost.phase) * cellSize * 0.18;
      drawGhost(ghost.fx * cssW, ghost.fy * cssH + wobble, cellSize * ghost.size);
    }

    var p;
    for (p = 0; p < pumpkins.length; p++) drawPumpkin(pumpkins[p]);
    drawFoods(time);
    var si;
    for (si = 0; si < snakes.length; si++) {
      if (snakes[si].kind === "bot") drawSnake(snakes[si], LOOKS[snakes[si].lookId] || BOT_LOOK);
    }
    for (si = 0; si < snakes.length; si++) {
      if (snakes[si].kind === "human" && snakes[si] !== player) {
        drawSnake(snakes[si], LOOKS[snakes[si].lookId] || PLAYER_LOOK);
      }
    }
    if (player) drawSnake(player, LOOKS[player.lookId] || PLAYER_LOOK);
    drawFx();
  }

  function updateFx() {
    var i;
    for (i = 0; i < particles.length; i++) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].life -= 0.02;
    }
    particles = particles.filter(function (p) { return p.life > 0; });
    for (i = 0; i < floaters.length; i++) {
      floaters[i].y -= 0.45;
      floaters[i].life -= 0.016;
    }
    floaters = floaters.filter(function (f) { return f.life > 0; });
  }

  function paintSize(nextW, nextH) {
    cssW = nextW;
    cssH = nextH;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateCamera();
    boardWrap.style.width = Math.ceil(cssW + 12) + "px";
    boardWrap.style.marginLeft = "auto";
    boardWrap.style.marginRight = "auto";
  }

  function fitCanvas() {
    if (!boardWrap) return;
    var column = document.querySelector(".wrap") || boardWrap;
    var avail = column.clientWidth - 24;
    if (avail < 40) return;
    var top = document.querySelector(".top");
    var hint = document.querySelector(".hint");
    var modeNote = document.querySelector(".mode-note");
    var modes = document.querySelector(".modes");
    var sizes = document.querySelector(".sizes");
    var label = document.querySelector(".dpad-label");
    var dpad = document.querySelector(".dpad");
    var lengths = document.querySelector(".lengths");
    var lanEl = document.getElementById("lan");
    var used = 48;
    if (top) used += top.offsetHeight;
    if (hint) used += hint.offsetHeight;
    if (modeNote) used += modeNote.offsetHeight;
    if (modes) used += modes.offsetHeight;
    if (sizes) used += sizes.offsetHeight;
    if (label) used += label.offsetHeight;
    if (dpad) used += dpad.offsetHeight;
    if (lengths) used += lengths.offsetHeight;
    if (lanEl && !lanEl.hidden) used += lanEl.offsetHeight;
    var maxH = Math.max(160, window.innerHeight - used);
    var nextW = avail;
    var nextH = nextW;
    if (nextH > maxH) {
      nextH = maxH;
      nextW = nextH;
    }
    paintSize(nextW, nextH);
    var edge = (lanEl && !lanEl.hidden) ? lanEl : lengths;
    if (edge) {
      var overflow = edge.getBoundingClientRect().bottom - (window.innerHeight - 8);
      if (overflow > 1) {
        var shrunk = Math.max(160, nextH - overflow);
        paintSize(shrunk, shrunk);
      }
    }
    if (cellSize) draw(performance.now());
  }

  function frame(now) {
    if (document.hidden) {
      lastTime = 0;
    } else {
      if (!lastTime) lastTime = now;
      var dt = now - lastTime;
      lastTime = now;
      if (dt > 400) dt = 400;
      if (!lan.role && !debug.pause) {
        acc += dt;
        var spins = 0;
        while (acc >= TICK_MS && spins < 4) {
          acc -= TICK_MS;
          step();
          spins++;
        }
        reviveBots(now);
      }
    }
    updateFx();
    draw(now);
    renderHud();
    requestAnimationFrame(frame);
  }

  function cloneSnake(snake) {
    if (!snake) return null;
    return {
      id: snake.id,
      name: snake.name,
      kind: snake.kind,
      lookId: snake.lookId,
      mode: snake.mode,
      score: snake.score || 0,
      alive: snake.alive,
      dir: { x: snake.dir.x, y: snake.dir.y },
      queued: snake.queued ? { x: snake.queued.x, y: snake.queued.y } : null,
      respawnAt: snake.respawnAt,
      segments: snake.segments.map(function (s) { return { x: s.x, y: s.y }; })
    };
  }

  function reviveBots(now) {
    var n = 0;
    for (var i = 0; i < snakes.length; i++) {
      var snake = snakes[i];
      if (snake.kind === "bot" && !snake.alive && snake.respawnAt && now >= snake.respawnAt) {
        if (respawnSnake(snake, 3)) {
          snake.respawnAt = 0;
          n += 1;
        }
      }
    }
    return n;
  }

  function showMode(mode) {
    if (mode !== "lazy" && mode !== "between" && mode !== "aggressive") mode = "lazy";
    botMode = mode;
    var note = document.getElementById("mode-note");
    if (note) note.textContent = MODE_NOTE[mode];
    var buttons = document.querySelectorAll("[data-mode]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", buttons[i].getAttribute("data-mode") === mode ? "true" : "false");
    }
  }

  function dismissNib() {
    var nib = snakeById("nib");
    if (!nib) return;
    if (nib.alive && nib.segments.length) burst(nib.segments[0].x, nib.segments[0].y, popColor(nib));
    snakes = snakes.filter(function (s) { return s !== nib; });
  }

  function bringNib() {
    var nib = snakeById("nib");
    if (!nib) {
      nib = makeNib();
      snakes.push(nib);
    }
    nib.mode = "between";
    if (!nib.alive) {
      if (!respawnSnake(nib, 4) && !respawnSnake(nib, 3) && !respawnSnake(nib, 1)) {
        nib.respawnAt = performance.now() + BOT_RESPAWN_MS;
      }
    }
  }

  function applyMode(mode) {
    if (mode !== "lazy" && mode !== "between" && mode !== "aggressive") return;
    var prev = botMode;
    showMode(mode);
    if (bot) bot.mode = mode;
    if (mode === "between") bringNib();
    else if (prev === "between") dismissNib();
    renderHud();
  }

  function requestMode(mode) {
    if (lan.role === "guest") {
      showMode(mode);
      send({ type: "mode", mode: mode });
      return;
    }
    applyMode(mode);
    if (lan.role === "host") broadcast();
  }

  function showWorldSize(name) {
    if (!WORLD.sizes[name]) name = WORLD.defaultSize;
    worldSizeName = name;
    var buttons = document.querySelectorAll("[data-size]");
    var i;
    for (i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", buttons[i].getAttribute("data-size") === name ? "true" : "false");
    }
  }

  function requestWorldSize(name) {
    if (!WORLD.sizes[name]) return;
    if (lan.role === "guest") {
      send({ type: "size", size: name });
      return;
    }
    if (name === worldSizeName) return;
    worldSizeName = name;
    showWorldSize(name);
    reset();
    if (lan.role === "host") broadcast();
  }

  function reset() {
    var peers = [];
    var selfId = null;
    var selfName = null;
    var selfLook = null;
    var selfScore = 0;
    if (lan.role === "host" && player && player.id && player.id !== "player") {
      selfId = player.id;
      selfName = player.name;
      selfLook = player.lookId;
      selfScore = player.score || 0;
      var i;
      for (i = 0; i < snakes.length; i++) {
        var existing = snakes[i];
        if (existing.kind === "human" && existing.id !== player.id) {
          peers.push({
            id: existing.id,
            name: existing.name,
            lookId: existing.lookId,
            score: existing.score || 0
          });
        }
      }
    }
    var spec = WORLD.sizes[worldSizeName] || WORLD.sizes[WORLD.defaultSize];
    worldSizeName = WORLD.sizes[worldSizeName] ? worldSizeName : WORLD.defaultSize;
    COLS = spec.cols;
    ROWS = spec.rows;
    score = selfScore;
    foods = [];
    particles = [];
    floaters = [];
    debug.manualBot = false;
    debug.steps = 0;
    player = makePlayer();
    bot = makeBot();
    if (selfId) {
      player.id = selfId;
      player.name = selfName || player.name;
      player.lookId = selfLook || player.lookId;
      player.score = selfScore;
    }
    snakes = [player, bot];
    buildPumpkins();
    setupFoods();
    ensureFoods();
    var p;
    for (p = 0; p < peers.length; p++) {
      var human = makeHuman(peers[p].id, peers[p].name, peers[p].lookId);
      human.score = peers[p].score;
      snakes.push(human);
      if (!respawnSnake(human, 4) && !respawnSnake(human, 3)) respawnSnake(human, 1);
    }
    if (botMode === "between") bringNib();
    showMode(botMode);
    showWorldSize(worldSizeName);
    renderHud();
  }

  function send(obj) {
    if (!lan.ws || lan.ws.readyState !== 1) return;
    try {
      lan.ws.send(JSON.stringify(obj));
    } catch (err) {
      /* The socket is closing. */
    }
  }

  function netState() {
    return {
      type: "state",
      tick: netTick,
      mode: botMode,
      world: { name: worldSizeName, cols: COLS, rows: ROWS },
      pumpkins: pumpkins.map(function (p) { return { x: p.x, y: p.y }; }),
      foods: foods.map(function (f) { return { typeId: f.typeId, x: f.x, y: f.y }; }),
      snakes: snakes.map(function (s) {
        return {
          id: s.id,
          name: s.name,
          kind: s.kind,
          lookId: s.lookId,
          mode: s.mode,
          score: s.score || 0,
          alive: !!s.alive,
          dir: { x: s.dir.x, y: s.dir.y },
          respawnIn: s.respawnAt ? Math.max(0, s.respawnAt - performance.now()) : 0,
          segments: s.segments.map(function (seg) { return { x: seg.x, y: seg.y }; })
        };
      })
    };
  }

  function broadcast() {
    if (lan.role !== "host" || !lan.ready) return;
    netTick += 1;
    send(netState());
  }

  function lanHint() {
    if (lan.joins && lan.joins.length) {
      return "Same board. On the other phone, open " + lan.joins[0];
    }
    var host = location.host || "";
    if (host && host.indexOf("localhost") !== 0 && host.indexOf("127.0.0.1") !== 0) {
      return "Same board. Others on this Wi-Fi open http://" + host;
    }
    return "Same board. On the other phone, open this computer’s LAN address, port 8080.";
  }

  function setLanStatus(text) {
    var el = document.getElementById("lan");
    if (!el) return;
    var next = text || "";
    var hidden = !next;
    if (el.textContent === next && el.hidden === hidden) return;
    el.hidden = hidden;
    el.textContent = next;
    fitCanvas();
  }

  function reviveFromNet(raw) {
    var dir = cleanDir(raw.dir) || { x: 1, y: 0 };
    return {
      id: raw.id,
      name: raw.name || "Snake",
      kind: raw.kind === "bot" ? "bot" : "human",
      lookId: raw.lookId || "sunny",
      mode: raw.mode || null,
      score: raw.score || 0,
      alive: !!raw.alive && !!(raw.segments && raw.segments.length),
      dir: dir,
      queued: null,
      respawnAt: raw.respawnIn ? performance.now() + raw.respawnIn : 0,
      segments: (raw.segments || []).map(function (s) { return { x: s.x, y: s.y }; })
    };
  }

  function applyNetState(msg) {
    if (!msg || !msg.snakes) return;
    if (msg.tick && lan.lastTick && msg.tick < lan.lastTick) return;
    if (msg.tick) lan.lastTick = msg.tick;
    if (msg.world && msg.world.cols && msg.world.rows) {
      COLS = msg.world.cols;
      ROWS = msg.world.rows;
      if (msg.world.name && WORLD.sizes[msg.world.name]) worldSizeName = msg.world.name;
      showWorldSize(worldSizeName);
    }
    if (msg.pumpkins) usePumpkins(msg.pumpkins);
    var oldScore = player ? (player.score || 0) : 0;
    if (msg.mode) showMode(msg.mode);
    foods = (msg.foods || []).map(function (f) { return { typeId: f.typeId, x: f.x, y: f.y }; });
    snakes = msg.snakes.map(reviveFromNet);
    player = lan.you ? snakeById(lan.you) : null;
    bot = snakeById("bot");
    if (!player) {
      for (var i = 0; i < snakes.length; i++) {
        if (snakes[i].kind === "human") { player = snakes[i]; break; }
      }
    }
    if (player) score = player.score || 0;
    if (player && player.segments.length && (player.score || 0) !== oldScore) {
      var delta = (player.score || 0) - oldScore;
      var head = player.segments[0];
      addFloater(head.x, head.y, (delta > 0 ? "+" : "") + delta, delta >= 0 ? "#ffe08a" : "#ff9bb5");
    }
    renderHud();
    if (lan.role === "guest" && lan.pendingDir && player && player.alive) {
      send({ type: "input", dir: lan.pendingDir });
    }
  }

  function beginAsHost(msg) {
    lan.role = "host";
    lan.you = msg.id;
    lan.joins = msg.joins || [];
    lan.ready = false;
    reset();
    player.id = msg.id;
    player.name = msg.name || "Sunny";
    player.lookId = msg.look || "sunny";
    lan.ready = true;
    setLanStatus(lanHint());
    broadcast();
  }

  function beginAsGuest(msg) {
    lan.role = "guest";
    lan.you = msg.id;
    lan.joins = msg.joins || [];
    lan.ready = true;
    snakes = [];
    player = null;
    bot = null;
    foods = [];
    score = 0;
    setLanStatus("Joining the shared board…");
    renderHud();
  }

  function addPeer(peer) {
    if (!peer || !peer.id || snakeById(peer.id)) return;
    var snake = makeHuman(peer.id, peer.name || "Friend", peer.look || "lilac");
    snakes.push(snake);
    var placed = respawnSnake(snake, 4) || respawnSnake(snake, 3) || respawnSnake(snake, 1);
    if (!placed) {
      snakes = snakes.filter(function (s) { return s !== snake; });
      send({ type: "reject", id: peer.id });
      return;
    }
    broadcast();
  }

  function onLeave(id) {
    var snake = snakeById(id);
    if (!snake || snake.kind !== "human") return;
    snakes = snakes.filter(function (s) { return s.id !== id; });
    renderHud();
    broadcast();
  }

  function onPromote(msg) {
    lan.role = "host";
    lan.ready = false;
    if (msg.state && msg.state.snakes) {
      netTick = msg.state.tick || 0;
      lan.lastTick = 0;
      applyNetState(msg.state);
    } else if (!player) {
      reset();
      if (player && lan.you) player.id = lan.you;
    }
    lan.ready = true;
    setLanStatus(lanHint());
    broadcast();
  }

  function onSocketMessage(raw) {
    var msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      return;
    }
    if (!msg || !msg.type) return;
    if (msg.type === "welcome") {
      if (msg.role === "host") beginAsHost(msg);
      else beginAsGuest(msg);
      return;
    }
    if (msg.type === "full") {
      lan.role = null;
      lan.ready = false;
      if (!player) reset();
      setLanStatus("This table is full. This screen is its own game.");
      return;
    }
    if (msg.type === "peer" && lan.role === "host") {
      addPeer(msg);
      return;
    }
    if (msg.type === "leave" && lan.role === "host") {
      onLeave(msg.id);
      return;
    }
    if (msg.type === "input" && lan.role === "host") {
      queueRemote(msg.id, msg.dir);
      return;
    }
    if (msg.type === "mode" && lan.role === "host") {
      applyMode(msg.mode);
      broadcast();
      return;
    }
    if (msg.type === "size" && lan.role === "host") {
      requestWorldSize(msg.size);
      return;
    }
    if (msg.type === "state" && lan.role === "guest") {
      applyNetState(msg);
      if (player) setLanStatus(lanHint());
      return;
    }
    if (msg.type === "promote") onPromote(msg);
  }

  function tryLan() {
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    var proto = location.protocol === "https:" ? "wss://" : "ws://";
    var ws;
    try {
      ws = new WebSocket(proto + location.host + "/ws");
    } catch (err) {
      return;
    }
    lan.ws = ws;
    ws.onmessage = function (e) { onSocketMessage(e.data); };
    ws.onclose = function () {
      var was = lan.role;
      lan.role = null;
      lan.ready = false;
      lan.you = null;
      lan.ws = null;
      if (!was) return;
      reset();
      setLanStatus("The shared board disconnected. This screen is its own game again.");
    };
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }, { passive: false });

  window.addEventListener("pointerup", function (e) {
    if (!swipe || e.pointerId !== swipe.id) return;
    var dx = e.clientX - swipe.x;
    var dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.hypot(dx, dy) < 28) return;
    if (Math.abs(dx) > Math.abs(dy)) setPlayerDir(Math.sign(dx), 0);
    else setPlayerDir(0, Math.sign(dy));
  });

  window.addEventListener("pointercancel", function () { swipe = null; });

  document.querySelectorAll(".dpad button").forEach(function (btn) {
    btn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      setPlayerDir(Number(btn.getAttribute("data-dx")), Number(btn.getAttribute("data-dy")));
    }, { passive: false });
  });

  document.querySelectorAll("[data-mode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      requestMode(btn.getAttribute("data-mode"));
    });
  });

  document.querySelectorAll("[data-size]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      requestWorldSize(btn.getAttribute("data-size"));
    });
  });

  window.addEventListener("keydown", function (e) {
    var map = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      KeyW: [0, -1],
      KeyA: [-1, 0],
      KeyS: [0, 1],
      KeyD: [1, 0]
    };
    var byKey = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      w: [0, -1],
      a: [-1, 0],
      s: [0, 1],
      d: [1, 0],
      W: [0, -1],
      A: [-1, 0],
      S: [0, 1],
      D: [1, 0]
    };
    var dir = map[e.code] || byKey[e.key];
    if (!dir) return;
    e.preventDefault();
    setPlayerDir(dir[0], dir[1]);
  });

  window.addEventListener("resize", fitCanvas);
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(boardWrap);

  reset();
  fitCanvas();

  setInterval(function () {
    if (lan.role !== "host" || !lan.ready || debug.pause || !snakes.length) return;
    step();
    reviveBots(performance.now());
    broadcast();
  }, TICK_MS);

  tryLan();

  window.__snakeDebug = {
    pause: function (on) { debug.pause = !!on; },
    setManualBot: function (on) { debug.manualBot = !!on; },
    setDir: setPlayerDir,
    setBotDir: function (dx, dy) {
      if (!bot) return;
      bot.dir = { x: Math.sign(dx), y: dx ? 0 : Math.sign(dy) };
      bot.queued = null;
    },
    placePlayer: function (segments, dir) {
      if (!player) return;
      player.alive = true;
      player.respawnAt = 0;
      player.segments = segments.map(function (s) { return { x: s.x, y: s.y }; });
      player.dir = { x: dir.x, y: dir.y };
      player.queued = null;
    },
    placeBot: function (segments, dir) {
      if (!bot) return;
      bot.alive = true;
      bot.respawnAt = 0;
      bot.segments = segments.map(function (s) { return { x: s.x, y: s.y }; });
      bot.dir = { x: dir.x, y: dir.y };
      bot.queued = null;
    },
    placeSnake: function (id, segments, dir) {
      var snake = snakeById(id);
      if (!snake) return;
      snake.alive = true;
      snake.respawnAt = 0;
      snake.segments = segments.map(function (s) { return { x: s.x, y: s.y }; });
      snake.dir = { x: dir.x, y: dir.y };
      snake.queued = null;
    },
    setMode: function (mode) { requestMode(mode); },
    setWorld: function (name) { requestWorldSize(name); },
    usePumpkins: usePumpkins,
    clearFoods: function () { foods = []; },
    addFood: function (typeId, x, y) { foods.push({ typeId: typeId, x: x, y: y }); },
    setScore: function (n) {
      score = n;
      if (player) player.score = n;
      renderHud();
    },
    setWeight: function (id, w) {
      var type = getType(id);
      if (type) type.spawnWeight = w;
    },
    register: registerFood,
    spawn: spawnFood,
    tick: function (n) {
      var count = n || 1;
      var i;
      for (i = 0; i < count; i++) step();
      renderHud();
    },
    reset: reset,
    fit: fitCanvas,
    sync: function () { broadcast(); },
    dropLink: function () { if (lan.ws) lan.ws.close(); },
    snapshot: function () {
      updateCamera();
      return {
        score: player ? (player.score || 0) : score,
        steps: debug.steps,
        mode: botMode,
        size: worldSizeName,
        role: lan.role,
        you: lan.you,
        player: cloneSnake(player),
        bot: cloneSnake(bot),
        snakes: snakes.map(cloneSnake),
        foods: foods.map(function (f) { return { typeId: f.typeId, x: f.x, y: f.y }; }),
        pumpkins: pumpkins.map(function (p) { return { x: p.x, y: p.y }; }),
        cols: COLS,
        rows: ROWS,
        view: { left: view.left, top: view.top, span: view.span },
        paused: debug.pause,
        manualBot: debug.manualBot
      };
    },
    types: function () {
      return foodTypes.map(function (t) {
        return {
          id: t.id,
          scoreDelta: t.scoreDelta,
          lengthDelta: t.lengthDelta,
          spawnWeight: t.spawnWeight
        };
      });
    }
  };

  requestAnimationFrame(frame);
})();

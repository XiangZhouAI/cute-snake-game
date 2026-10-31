/* Starlight Snake — top-down 2D only.
   Segments are {x, y}. A later version could add z; this one never moves on a Z axis.
   Food score and length changes come only from the registry, not from hardcoded ids. */
(function () {
  "use strict";

  var COLS = 12;
  var ROWS = 12;
  var TICK_MS = 150;
  var BOT_RESPAWN_MS = 2000;
  var GOOD_KEEP = 1;
  var BAD_KEEP = 2;

  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var youEl = document.getElementById("you-len");
  var pipEl = document.getElementById("pip-len");
  var boardWrap = document.querySelector(".board-wrap");

  var cellSize = 32;
  var cssW = 480;
  var cssH = 480;
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

  var pumpkins = [
    [5, 2], [8, 4], [2, 5], [6, 6], [10, 5], [4, 9], [9, 10], [1, 8]
  ].map(function (pair) { return { x: pair[0], y: pair[1] }; });

  var pumpkinSet = new Set(pumpkins.map(function (p) { return p.x + "," + p.y; }));

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
  var player;
  var bot;
  var PIP_SNACK_LENGTH = 9;
  var debug = { pause: false, manualBot: false, steps: 0 };
  var lastTime = 0;
  var acc = 0;
  var swipe = null;

  function makePlayer() {
    return {
      id: "player",
      alive: true,
      dir: { x: 1, y: 0 },
      queued: null,
      respawnAt: 0,
      segments: [
        { x: 3, y: 7 },
        { x: 2, y: 7 },
        { x: 1, y: 7 },
        { x: 0, y: 7 }
      ]
    };
  }

  function makeBot() {
    return {
      id: "bot",
      alive: true,
      dir: { x: -1, y: 0 },
      queued: null,
      respawnAt: 0,
      segments: [
        { x: 8, y: 1 },
        { x: 9, y: 1 },
        { x: 10, y: 1 },
        { x: 11, y: 1 }
      ]
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

  function isFree(x, y) {
    if (!inBounds(x, y) || isPumpkin(x, y)) return false;
    if (occupies(player, x, y, false)) return false;
    if (occupies(bot, x, y, false)) return false;
    if (foodAt(x, y)) return false;
    return true;
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

  function ensureFoods() {
    var guard = 0;
    while (countKind("good") < GOOD_KEEP && guard++ < 30) {
      if (!spawnFood("good")) break;
    }
    guard = 0;
    while (countKind("bad") < BAD_KEEP && guard++ < 30) {
      if (!spawnFood("bad")) break;
    }
  }

  function setupFoods() {
    foods = [
      { typeId: "candy-apple", x: 1, y: 4 },
      { typeId: "rotten-apple", x: 8, y: 8 },
      { typeId: "chili", x: 4, y: 10 }
    ];
  }

  function cellCenter(x, y) {
    return {
      cx: x * cellSize + cellSize / 2,
      cy: y * cellSize + cellSize / 2
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

  function setPlayerDir(dx, dy) {
    if (!player || !player.alive) return;
    dx = Math.sign(dx);
    dy = dx !== 0 ? 0 : Math.sign(dy);
    if (!dx && !dy) return;
    if (player.segments.length > 1 && dx === -player.dir.x && dy === -player.dir.y) return;
    player.queued = { x: dx, y: dy };
  }

  function applyPlayerInput() {
    if (!player.queued) return;
    var q = player.queued;
    var reverse = player.segments.length > 1 && q.x === -player.dir.x && q.y === -player.dir.y;
    if (!reverse) player.dir = { x: q.x, y: q.y };
    player.queued = null;
  }

  function botCellBlocked(nx, ny) {
    if (!inBounds(nx, ny) || isPumpkin(nx, ny)) return true;
    if (occupies(bot, nx, ny, true)) return true;
    if (player && player.alive && player.segments.length) {
      var head = player.segments[0];
      if (head.x === nx && head.y === ny) return true;
      if (player.segments.length === bot.segments.length && occupies(player, nx, ny, false)) return true;
    }
    return false;
  }

  function stepCost(nx, ny) {
    var cost = 1;
    var food = foodAt(nx, ny);
    if (food) {
      var type = getType(food.typeId);
      if (type && type.lengthDelta < 0 && bot.segments.length < PIP_SNACK_LENGTH) cost += 16;
      if (type && type.lengthDelta > 0 && bot.segments.length >= PIP_SNACK_LENGTH) cost += 12;
    }
    if (player && player.alive && player.segments.length) {
      var head = player.segments[0];
      if (Math.abs(head.x - nx) + Math.abs(head.y - ny) === 1) cost += 8;
      var i;
      for (i = 1; i < player.segments.length; i++) {
        if (player.segments[i].x === nx && player.segments[i].y === ny) cost += 6;
      }
    }
    return cost;
  }

  function shortestDir(head, goals) {
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
        if (ck === startK && bot.segments.length > 1 && dir.x === -bot.dir.x && dir.y === -bot.dir.y) continue;
        var nx = cur.x + dir.x;
        var ny = cur.y + dir.y;
        if (botCellBlocked(nx, ny)) continue;
        var nk = nx + "," + ny;
        var nd = cur.d + stepCost(nx, ny);
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

  function fallbackDir(head) {
    var options = [
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ];
    var best = null;
    var bestScore = Infinity;
    for (var i = 0; i < options.length; i++) {
      var d = options[i];
      if (bot.segments.length > 1 && d.x === -bot.dir.x && d.y === -bot.dir.y) continue;
      var nx = head.x + d.x;
      var ny = head.y + d.y;
      if (botCellBlocked(nx, ny)) continue;
      var scoreHere = stepCost(nx, ny);
      if (d.x === bot.dir.x && d.y === bot.dir.y) scoreHere -= 0.4;
      if (player && player.alive && player.segments.length) {
        var ph = player.segments[0];
        var now = Math.abs(ph.x - head.x) + Math.abs(ph.y - head.y);
        var next = Math.abs(ph.x - nx) + Math.abs(ph.y - ny);
        if (next < now) scoreHere += 4;
      }
      if (scoreHere < bestScore) {
        bestScore = scoreHere;
        best = d;
      }
    }
    return best;
  }

  function chooseBotDirection() {
    if (!bot.alive || !bot.segments.length) return null;
    var head = bot.segments[0];
    var good = [];
    var bad = [];
    for (var i = 0; i < foods.length; i++) {
      var type = getType(foods[i].typeId);
      if (!type) continue;
      if (type.lengthDelta > 0) good.push(foods[i]);
      else if (type.lengthDelta < 0) bad.push(foods[i]);
    }
    // Hunt candy. Once Pip is long enough to crowd the board, nibble a bad treat first.
    var goals = (bot.segments.length >= PIP_SNACK_LENGTH && bad.length) ? bad : good;
    var dir = goals.length ? shortestDir(head, goals) : null;
    if (!dir) dir = fallbackDir(head);
    if (!dir) return null;
    if (bot.segments.length > 1 && dir.x === -bot.dir.x && dir.y === -bot.dir.y) {
      return fallbackDir(head);
    }
    return dir;
  }

  function applyBotAI() {
    if (debug.manualBot) return;
    var choice = chooseBotDirection();
    if (choice) bot.dir = { x: choice.x, y: choice.y };
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
      burst(snake.segments[0].x, snake.segments[0].y, snake.id === "player" ? "#ffb15e" : "#d4c4ff");
    }
    snake.alive = false;
    snake.segments = [];
    snake.queued = null;
    if (snake.id === "bot") snake.respawnAt = performance.now() + BOT_RESPAWN_MS;
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

  function resolveContact(plans) {
    if (!player.alive || !bot.alive) return;
    var pPlan = plans.get(player);
    var bPlan = plans.get(bot);
    if (player.segments.length === bot.segments.length) {
      var blockP = hitsSolidOther(pPlan, bot, bPlan);
      var blockB = hitsSolidOther(bPlan, player, pPlan);
      if (blockP) pPlan.blocked = true;
      if (blockB) bPlan.blocked = true;
      return;
    }
    if (!touches(player, pPlan, bot, bPlan)) return;
    var smaller = player.segments.length < bot.segments.length ? player : bot;
    cutHalf(smaller);
    if (!player.alive || !bot.alive) return;
    for (var pass = 0; pass < 3; pass++) {
      var pp = plans.get(player);
      var bp = plans.get(bot);
      if (!touches(player, pp, bot, bp)) break;
      var small = player.segments.length <= bot.segments.length ? player : bot;
      var large = small === player ? bot : player;
      var sp = plans.get(small);
      var lp = plans.get(large);
      if (sp && !sp.blocked) sp.blocked = true;
      else if (lp && !lp.blocked) lp.blocked = true;
      else break;
    }
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
        if (snake.id === "player") {
          score = Math.max(0, score + type.scoreDelta);
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
        if (!inBounds(fx, fy) || isPumpkin(fx, fy) || occupies(player, fx, fy, false) || occupies(bot, fx, fy, false)) {
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
    burst(spot.segments[0].x, spot.segments[0].y, snake.id === "player" ? "#ffb15e" : "#d4c4ff");
    return true;
  }

  function step() {
    if (player.alive) applyPlayerInput();
    if (bot.alive) applyBotAI();

    var plans = new Map();
    if (player.alive && player.segments.length) plans.set(player, planMove(player));
    if (bot.alive && bot.segments.length) plans.set(bot, planMove(bot));
    resolveContact(plans);

    [player, bot].forEach(function (snake) {
      if (!snake.alive) return;
      var plan = plans.get(snake);
      if (!plan || plan.blocked) return;
      moveSnake(snake, plan.x, plan.y);
    });

    if (!player.alive) respawnSnake(player, 3);
    ensureFoods();
    debug.steps += 1;
  }

  function renderHud() {
    var scoreText = "Score " + score;
    if (scoreEl.textContent !== scoreText) scoreEl.textContent = scoreText;
    var youText = "You " + (player && player.alive ? player.segments.length : 0);
    var pipText = bot && bot.alive ? "Pip " + bot.segments.length : "Pip is coming back";
    if (youEl.textContent !== youText) youEl.textContent = youText;
    if (pipEl.textContent !== pipText) pipEl.textContent = pipText;
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
    var x, y;
    for (y = 0; y < ROWS; y++) {
      for (x = 0; x < COLS; x++) {
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
    drawSnake(bot, BOT_LOOK);
    drawSnake(player, PLAYER_LOOK);
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

  function fitCanvas() {
    if (!boardWrap) return;
    var avail = boardWrap.clientWidth - 4;
    if (avail < 40) return;
    var top = document.querySelector(".top");
    var hint = document.querySelector(".hint");
    var label = document.querySelector(".dpad-label");
    var dpad = document.querySelector(".dpad");
    var lengths = document.querySelector(".lengths");
    var used = 36;
    if (top) used += top.offsetHeight;
    if (hint) used += hint.offsetHeight;
    if (label) used += label.offsetHeight;
    if (dpad) used += dpad.offsetHeight;
    if (lengths) used += lengths.offsetHeight;
    var maxH = Math.max(180, window.innerHeight - used);
    var nextW = avail;
    var nextH = nextW * (ROWS / COLS);
    if (nextH > maxH) {
      nextH = maxH;
      nextW = nextH * (COLS / ROWS);
    }
    cssW = nextW;
    cssH = nextH;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cellSize = cssW / COLS;
  }

  function frame(now) {
    if (document.hidden) {
      lastTime = 0;
      requestAnimationFrame(frame);
      return;
    }
    if (!lastTime) lastTime = now;
    var dt = now - lastTime;
    lastTime = now;
    if (dt > 400) dt = 400;
    if (!debug.pause) {
      acc += dt;
      var spins = 0;
      while (acc >= TICK_MS && spins < 4) {
        acc -= TICK_MS;
        step();
        spins++;
      }
      if (!bot.alive && bot.respawnAt && now >= bot.respawnAt) {
        if (respawnSnake(bot, 3)) bot.respawnAt = 0;
      }
    }
    updateFx();
    draw(now);
    renderHud();
    requestAnimationFrame(frame);
  }

  function cloneSnake(snake) {
    return {
      id: snake.id,
      alive: snake.alive,
      dir: { x: snake.dir.x, y: snake.dir.y },
      queued: snake.queued ? { x: snake.queued.x, y: snake.queued.y } : null,
      respawnAt: snake.respawnAt,
      segments: snake.segments.map(function (s) { return { x: s.x, y: s.y }; })
    };
  }

  function reset() {
    score = 0;
    foods = [];
    particles = [];
    floaters = [];
    debug.manualBot = false;
    debug.steps = 0;
    player = makePlayer();
    bot = makeBot();
    setupFoods();
    ensureFoods();
    renderHud();
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

  window.__snakeDebug = {
    pause: function (on) { debug.pause = !!on; },
    setManualBot: function (on) { debug.manualBot = !!on; },
    setDir: setPlayerDir,
    setBotDir: function (dx, dy) {
      bot.dir = { x: Math.sign(dx), y: dx ? 0 : Math.sign(dy) };
      bot.queued = null;
    },
    placePlayer: function (segments, dir) {
      player.alive = true;
      player.respawnAt = 0;
      player.segments = segments.map(function (s) { return { x: s.x, y: s.y }; });
      player.dir = { x: dir.x, y: dir.y };
      player.queued = null;
    },
    placeBot: function (segments, dir) {
      bot.alive = true;
      bot.respawnAt = 0;
      bot.segments = segments.map(function (s) { return { x: s.x, y: s.y }; });
      bot.dir = { x: dir.x, y: dir.y };
      bot.queued = null;
    },
    clearFoods: function () { foods = []; },
    addFood: function (typeId, x, y) { foods.push({ typeId: typeId, x: x, y: y }); },
    setScore: function (n) { score = n; renderHud(); },
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
    snapshot: function () {
      return {
        score: score,
        steps: debug.steps,
        player: cloneSnake(player),
        bot: cloneSnake(bot),
        foods: foods.map(function (f) { return { typeId: f.typeId, x: f.x, y: f.y }; }),
        pumpkins: pumpkins.map(function (p) { return { x: p.x, y: p.y }; }),
        cols: COLS,
        rows: ROWS,
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

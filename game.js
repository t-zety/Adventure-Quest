const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hudTitle = document.getElementById("title");
const hudStats = document.getElementById("stats");
const dialogueBox = document.getElementById("dialogue");

const TILE = 16;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 24;

const world = [
  "########################################",
  "#..............#......................#",
  "#..####........#.............####.....#",
  "#..............#..............#........#",
  "#..##..........#......................#",
  "#..............#......####.............#",
  "#..###.........#......................#",
  "#..............#........#####..........#",
  "#..##....#.....#.......................#",
  "#.......#......#......####.............#",
  "#.......#......#.......................#",
  "#.......####...#.......##..............#",
  "#..............#......................#",
  "#..............####..##.................#",
  "#..............#..............#........#",
  "#....####.......#..............#......##",
  "#..............#....####................#",
  "#....#.........#....................#....#",
  "#....#.........#...@....................#",
  "#....#...................###............#",
  "#....#.............##..................#",
  "#..............######..................#",
  "#......................#................#",
  "########################################",
];

const player = {
  x: 6.5,
  y: 6.5,
  w: 12,
  h: 12,
  speed: 1.4,
  color: "#f0d9ba",
};

const inventory = {
  ledger: false,
  key: false,
};

const quest = {
  status: "Find the blood ledger in the alley.",
  complete: false,
};

const items = [
  {
    id: "ledger",
    x: 17,
    y: 10,
    color: "#d1a17d",
    name: "blood ledger",
    message: "You take the blood ledger. It smells of ash and old secrets.",
  },
  {
    id: "key",
    x: 29,
    y: 15,
    color: "#d0c17b",
    name: "rusted key",
    message: "A rusted key. It fits a lock you do not yet understand.",
  },
];

const npcs = [
  {
    id: "mara",
    name: "Mara",
    x: 20,
    y: 18,
    color: "#9a6d4d",
    dialog: [
      "The city isn't dead. It's just learned to breathe in secrets.",
      "If you're looking for work, you can start by finding the ledger in the alley.",
      "The ledger belongs to the Council. Bring it to me and I will tell you what it means.",
    ],
  },
  {
    id: "sable",
    name: "Sable",
    x: 29,
    y: 8,
    color: "#7d8ac8",
    dialog: [
      "Every war leaves a room behind. This one is full of ghosts.",
      "The people in power do not fear the dead. They fear the ones who remember.",
    ],
  },
];

let lastMessage = "Move with WASD. Press Space near people or objects to interact.";

const keys = {};

document.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.code === "Space") {
    interact();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function isWall(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);

  if (ty < 0 || ty >= world.length || tx < 0 || tx >= world[0].length) {
    return true;
  }

  return world[ty][tx] === "#";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function movePlayer() {
  let dx = 0;
  let dy = 0;

  if (keys["w"]) dy -= 1;
  if (keys["s"]) dy += 1;
  if (keys["a"]) dx -= 1;
  if (keys["d"]) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy) || 1;
    const moveX = (dx / length) * player.speed;
    const moveY = (dy / length) * player.speed;

    const nextX = player.x + moveX;
    const nextY = player.y + moveY;

    if (!isWall(nextX, player.y)) {
      player.x = clamp(nextX, 0, WORLD_WIDTH);
    }

    if (!isWall(player.x, nextY)) {
      player.y = clamp(nextY, 0, WORLD_HEIGHT);
    }
  }
}

function getDistance(aX, aY, bX, bY) {
  return Math.hypot(aX - bX, aY - bY);
}

function interact() {
  // item interaction
  for (const item of items) {
    const dist = getDistance(player.x, player.y, item.x + 0.5, item.y + 0.5);

    if (dist < 1.2) {
      if (!inventory[item.id]) {
        inventory[item.id] = true;
        lastMessage = item.message;

        if (item.id === "ledger") {
          quest.status = "Bring the blood ledger to Mara.";
          quest.complete = false;
        }

        if (item.id === "key") {
          quest.status = "The key glints in your hand, but the right door remains hidden.";
        }

        return;
      }
    }
  }

  // NPC interaction
  for (const npc of npcs) {
    const dist = getDistance(player.x, player.y, npc.x + 0.5, npc.y + 0.5);

    if (dist < 1.5) {
      if (npc.id === "mara") {
        if (inventory.ledger) {
          quest.complete = true;
          quest.status = "Quest complete: Mara has opened the truth for you.";
          lastMessage = "Mara: 'The Council kept a list of names and debts. Someone in this city paid dearly to bury it.'";
          inventory.ledger = false;
          return;
        }

        lastMessage = "Mara: " + npc.dialog[Math.floor(Math.random() * npc.dialog.length)];
        return;
      }

      if (npc.id === "sable") {
        lastMessage = "Sable: " + npc.dialog[Math.floor(Math.random() * npc.dialog.length)];
        return;
      }
    }
  }

  lastMessage = "Nothing here. The silence feels alive.";
}

function drawMap() {
  for (let y = 0; y < world.length; y++) {
    for (let x = 0; x < world[y].length; x++) {
      const tile = world[y][x];
      const px = x * TILE;
      const py = y * TILE;

      if (tile === "#") {
        ctx.fillStyle = "#262e38";
        ctx.fillRect(px, py, TILE, TILE);
      } else {
        ctx.fillStyle = "#1b2128";
        ctx.fillRect(px, py, TILE, TILE);

        // subtle floor detail
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.02)";
          ctx.fillRect(px + 3, py + 3, 3, 3);
        }
      }
    }
  }
}

function drawItems() {
  for (const item of items) {
    if (inventory[item.id]) continue;

    ctx.fillStyle = item.color;
    ctx.fillRect(item.x * TILE + 4, item.y * TILE + 4, 8, 8);

    ctx.fillStyle = "#2d1d18";
    ctx.fillRect(item.x * TILE + 3, item.y * TILE, 10, 3);
  }
}

function drawNPCs() {
  for (const npc of npcs) {
    const px = npc.x * TILE;
    const py = npc.y * TILE;

    ctx.fillStyle = npc.color;
    ctx.fillRect(px + 3, py + 3, 10, 10);

    ctx.fillStyle = "#120d0b";
    ctx.fillRect(px + 5, py + 2, 5, 3);
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x * TILE - 5, player.y * TILE - 5, 12, 12);

  ctx.fillStyle = "#2a2019";
  ctx.fillRect(player.x * TILE - 2, player.y * TILE - 9, 5, 5);
}

function drawPlayerShadow() {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(player.x * TILE - 8, player.y * TILE + 8, 18, 5);
}

function drawUI() {
  const inventoryText = 
    "Inventory: " +
    (inventory.ledger ? "Ledger, " : "") +
    (inventory.key ? "Key" : (inventory.ledger ? "" : "Empty"));

  hudTitle.textContent = "ASH & EMBER";
  hudStats.textContent = "Quest: " + quest.status + " | " + inventoryText;
  dialogueBox.textContent = lastMessage;
}

function update() {
  movePlayer();
  drawUI();
}

function render() {
  drawMap();
  drawItems();
  drawNPCs();
  drawPlayerShadow();
  drawPlayer();
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();

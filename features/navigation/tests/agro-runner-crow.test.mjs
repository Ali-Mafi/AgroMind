import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const html = readFileSync("public/offline.html", "utf8");

function body(from, to) {
  const start = html.indexOf(from);
  const end = html.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, `Missing game function: ${from}`);
  return html.slice(start, end);
}

function gameplay() {
  // Exercise the actual game's spawn and collision functions with fixed geometry.
  const source = `
    const CROW_FLIGHT_HEIGHT = 114;
    let spawnedObstacles = 0;
    let lastCrowSpawn = -3;
    let width = 900;
    let ground = 300;
    let player = { x: 105, y: ground - 72, w: 56, h: 72 };
    function crowTop() { return ground - CROW_FLIGHT_HEIGHT; }
    ${body("function randomObstacle() {", "function resetGame() {")}
    ${body("function collide(obstacle) {", "function gameOver() {")}
    ({ randomObstacle, collide, setY(y) { player.y = y; } })
  `;
  return vm.runInNewContext(source, { Math });
}

test("Farmer Dino sees a flying crow on the fourth obstacle", () => {
  const game = gameplay();
  const spawned = Array.from({ length: 4 }, () => game.randomObstacle());
  assert.equal(spawned[3].type, "crow");
  assert.equal(spawned[3].w, 40);
  assert.equal(spawned[3].h, 26);
  assert.ok(spawned.slice(0, 3).every(o => o.type !== "crow"));
});

test("crow passes above a grounded Dino but can hit a jumping Dino", () => {
  const game = gameplay();
  const crow = { type: "crow", x: 110, w: 40, h: 26 };
  assert.equal(game.collide(crow), false, "Grounded Dino should be safe");
  game.setY(190);
  assert.equal(game.collide(crow), true, "Crow should collide while Dino jumps into its flight path");
  assert.equal(game.collide({ type: "crate", x: 110, w: 42, h: 42 }), false, "Jump still clears a crate");
  game.setY(228);
  assert.equal(game.collide({ type: "crate", x: 110, w: 42, h: 42 }), true, "Ground obstacles still collide");
  assert.equal(game.collide({ type: "crow", x: 880, w: 40, h: 26 }), false, "Distant crow must not collide");
});

test("crow is self-contained pixel art, animated without external assets", () => {
  const crow = body("function drawCrow(obstacle, p) {", "function drawObstacle(obstacle, p) {");
  assert.match(crow, /wingsUp/);
  assert.match(crow, /ctx\.fillRect/);
  assert.match(html, /obstacle\.type === "crow"/);
  assert.match(html, /stay down when a crow flies over you/);
  assert.match(html, /وقتی کلاغ از بالای سرت رد می‌شه/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
});

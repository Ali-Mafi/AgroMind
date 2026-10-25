import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

// Keep this regression independent of the runtime renderer: the sprite itself
// must have connected leg pixels before Canvas receives it.
function decodeSprite(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  let position = 8;
  let width = 0;
  let height = 0;
  const compressed = [];
  while (position < bytes.length) {
    const size = bytes.readUInt32BE(position);
    const type = bytes.toString("ascii", position + 4, position + 8);
    const chunk = bytes.subarray(position + 8, position + 8 + size);
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      assert.equal(chunk[8], 8, "Expected 8-bit sprite");
      assert.equal(chunk[9], 6, "Expected RGBA sprite");
    }
    if (type === "IDAT") compressed.push(chunk);
    position += size + 12;
    if (type === "IEND") break;
  }
  assert.equal(width, 336);
  assert.equal(height, 84);
  const data = inflateSync(Buffer.concat(compressed));
  const stride = width * 4;
  assert.equal(data.length, height * (stride + 1));
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = data[y * (stride + 1)];
    assert.ok(filter >= 0 && filter <= 4, "Unknown PNG filter");
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const b = y ? pixels[(y - 1) * stride + x] : 0;
      const c = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      if (filter === 2) predictor = b;
      if (filter === 3) predictor = Math.floor((a + b) / 2);
      if (filter === 4) {
        const p = a + b - c;
        predictor =
          Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c)
            ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      }
      pixels[y * stride + x] = (data[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  return (frame, x, y) =>
    pixels.subarray((y * width + frame * 84 + x) * 4, (y * width + frame * 84 + x) * 4 + 4);
}

test("repaired Farmer Dino running frames keep both legs attached to the torso", () => {
  const color = decodeSprite("public/offline/agro-runner/farmer-dino-sheet-v5.png");
  for (const [frame, first, last] of [[1, 49, 54], [2, 39, 44]]) {
    for (let x = first; x <= last; x++) {
      for (const y of [56, 57, 58]) {
        const rgba = color(frame, x, y);
        assert.ok(rgba[3] > 200, `Frame ${frame} has a gap at (${x},${y})`);
        assert.ok(rgba[2] > rgba[0] * 1.1, `Frame ${frame} has non-blue leg pixels at (${x},${y})`);
      }
    }
  }
});

test("offline renderer draws exactly one complete Dino sprite frame", () => {
  const html = readFileSync("public/offline.html", "utf8");
  const renderer = html.split("function drawDino() {")[1]?.split("function drawObstacle")[0];
  assert.ok(renderer);
  assert.equal((renderer.match(/ctx\.drawImage\(/g) ?? []).length, 1);
  assert.doesNotMatch(renderer, /bodyCut|lowerShift/);
  assert.match(html, /farmer-dino-sheet-v5\.png/);
  assert.match(html, /return 1 \+ \(Math\.floor\(runPhase \/ DINO_RUN_FRAME_STEP\) % 2\)/);
});

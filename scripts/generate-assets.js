// Dependency-free pixel-art asset generator.
// Produces public/assets/tileset.png, player.png, npcs.png using a pure-Node
// PNG encoder (built-in zlib). No native modules — reliable on Windows.
//
// NOTE: The spec prefers Tuxemon GitHub assets, but those are large composite
// spritesheets with bespoke layouts. Generating here gives us full control over
// tile indices + frame layout so the renderer stays simple and deterministic.
// Tile size = 16px. Sprite frame = 16x24px (8px head above the tile).

import zlib from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'assets')
mkdirSync(OUT, { recursive: true })

// ---------- tiny image buffer ----------
function makeImg(w, h) {
  return { w, h, data: new Uint8Array(w * h * 4) }
}
function setPx(img, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return
  const i = (y * img.w + x) * 4
  img.data[i] = r
  img.data[i + 1] = g
  img.data[i + 2] = b
  img.data[i + 3] = a
}
function fillRect(img, x, y, w, h, c) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) setPx(img, xx, yy, c[0], c[1], c[2], c[3] ?? 255)
}
// blit a sub-image at offset
function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4
      const a = src.data[i + 3]
      if (a === 0) continue
      setPx(dst, ox + x, oy + y, src.data[i], src.data[i + 1], src.data[i + 2], a)
    }
}

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePng(img) {
  const { w, h, data } = img
  const raw = Buffer.alloc(h * (w * 4 + 1))
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0 // filter: none
    for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = data[y * w * 4 + x]
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- palette ----------
const C = {
  grass: [104, 176, 96],
  grass2: [88, 160, 84],
  grass3: [124, 196, 112],
  path: [216, 190, 140],
  path2: [196, 168, 116],
  pathEdge: [170, 142, 92],
  flowerR: [220, 70, 70],
  flowerY: [240, 216, 80],
  flowerP: [200, 110, 210],
  trunk: [120, 78, 44],
  trunkDark: [92, 58, 32],
  leaf: [56, 132, 60],
  leafLt: [84, 168, 84],
  leafDk: [38, 100, 44],
  water: [80, 150, 220],
  waterLt: [128, 188, 240],
  wood: [160, 110, 60],
  woodDk: [120, 80, 42],
  wall: [232, 216, 180],
  wallDk: [200, 182, 146],
  wallLine: [180, 160, 124],
  door: [110, 72, 44],
  doorDk: [80, 50, 30],
  knob: [240, 210, 90],
  glass: [150, 210, 235],
  glassDk: [96, 160, 200],
  roofRed: [206, 76, 70],
  roofRedDk: [168, 52, 50],
  roofRedLt: [230, 110, 102],
  roofBlue: [78, 120, 200],
  roofBlueDk: [54, 90, 162],
  roofBlueLt: [110, 156, 224],
  roofGray: [150, 154, 162],
  roofGrayDk: [112, 116, 126],
  roofGrayLt: [186, 190, 198],
  black: [40, 36, 48],
}

// deterministic pseudo-random for speckles
let seed = 1234567
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

// ---------- tile painters (16x16) ----------
function tGrass(t) {
  fillRect(t, 0, 0, 16, 16, C.grass)
  for (let i = 0; i < 14; i++) {
    const x = (rnd() * 16) | 0, y = (rnd() * 16) | 0
    setPx(t, x, y, ...(rnd() > 0.5 ? C.grass2 : C.grass3))
  }
}
function tPath(t) {
  fillRect(t, 0, 0, 16, 16, C.path)
  for (let i = 0; i < 18; i++) {
    const x = (rnd() * 16) | 0, y = (rnd() * 16) | 0
    setPx(t, x, y, ...C.path2)
  }
}
function tFlowers(t) {
  tGrass(t)
  const spots = [[3, 4], [10, 3], [5, 11], [12, 10], [8, 7]]
  const cols = [C.flowerR, C.flowerY, C.flowerP, C.flowerY, C.flowerR]
  spots.forEach(([x, y], i) => {
    const c = cols[i]
    setPx(t, x, y, ...c)
    setPx(t, x + 1, y, ...c)
    setPx(t, x, y + 1, ...c)
    setPx(t, x + 1, y + 1, ...c)
    setPx(t, x, y, 255, 255, 255) // tiny highlight
  })
}
function tWater(t) {
  fillRect(t, 0, 0, 16, 16, C.water)
  for (let y = 2; y < 16; y += 4)
    for (let x = 0; x < 16; x += 6) {
      setPx(t, x, y, ...C.waterLt)
      setPx(t, x + 1, y, ...C.waterLt)
    }
}
function tTree(t) {
  // transparent corners, trunk + round canopy
  fillRect(t, 7, 11, 2, 5, C.trunk)
  setPx(t, 7, 11, ...C.trunkDark)
  setPx(t, 7, 15, ...C.trunkDark)
  // canopy
  for (let y = 0; y < 13; y++)
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 6.5
      const d = Math.sqrt(dx * dx + dy * dy * 1.05)
      if (d <= 7.2) {
        let c = C.leaf
        if (d > 6.1) c = C.leafDk
        else if (dx + dy < -3) c = C.leafLt
        setPx(t, x, y, ...c)
      }
    }
}
function tFence(t) {
  // posts + rail
  fillRect(t, 0, 6, 16, 2, C.woodDk) // rail
  for (const x of [2, 8, 14]) {
    fillRect(t, x, 2, 2, 12, C.wood)
    setPx(t, x, 2, ...C.woodDk)
  }
}
function tSign(t) {
  fillRect(t, 7, 9, 2, 7, C.woodDk) // post
  fillRect(t, 2, 3, 12, 7, C.wood) // board
  fillRect(t, 3, 4, 10, 5, C.woodDk)
  fillRect(t, 4, 5, 8, 1, C.wood) // text lines
  fillRect(t, 4, 7, 6, 1, C.wood)
}
function wallBase(t) {
  fillRect(t, 0, 0, 16, 16, C.wall)
  // brick lines
  for (let y = 3; y < 16; y += 4) fillRect(t, 0, y, 16, 1, C.wallLine)
  for (let y = 0; y < 16; y += 4) {
    const off = ((y / 4) | 0) % 2 ? 8 : 0
    for (let x = off; x < 16; x += 8) fillRect(t, x, y, 1, 4, C.wallLine)
  }
  fillRect(t, 0, 0, 16, 1, C.wallDk)
}
function tWall(t) {
  wallBase(t)
}
function tDoor(t) {
  fillRect(t, 0, 0, 16, 16, C.wall)
  fillRect(t, 3, 2, 10, 14, C.door)
  fillRect(t, 3, 2, 10, 1, C.doorDk)
  fillRect(t, 3, 2, 1, 14, C.doorDk)
  fillRect(t, 12, 2, 1, 14, C.doorDk)
  fillRect(t, 7, 2, 1, 14, C.doorDk) // double-door split
  setPx(t, 5, 9, ...C.knob)
  setPx(t, 9, 9, ...C.knob)
}
function tWindow(t) {
  wallBase(t)
  fillRect(t, 3, 4, 10, 8, C.glassDk)
  fillRect(t, 4, 5, 8, 6, C.glass)
  fillRect(t, 8, 5, 1, 6, C.glassDk)
  fillRect(t, 4, 8, 8, 1, C.glassDk)
}
function roof(t, base, dk, lt) {
  fillRect(t, 0, 0, 16, 16, base)
  // shingle rows
  for (let y = 3; y < 16; y += 4) fillRect(t, 0, y, 16, 1, dk)
  for (let y = 1; y < 16; y += 4) fillRect(t, 0, y, 16, 1, lt)
}
function roofTop(t, base, dk, lt) {
  // darker eave/ridge row tile (top edge of roof)
  fillRect(t, 0, 0, 16, 16, base)
  for (let y = 3; y < 16; y += 4) fillRect(t, 0, y, 16, 1, dk)
  fillRect(t, 0, 0, 16, 3, dk) // ridge shadow
  fillRect(t, 0, 0, 16, 1, lt)
}

const TILE_PAINTERS = [
  tGrass, // 0
  tPath, // 1
  tFlowers, // 2
  tTree, // 3
  tFence, // 4
  tWater, // 5
  tSign, // 6
  tWall, // 7
  tDoor, // 8
  tWindow, // 9
  (t) => roof(t, C.roofRed, C.roofRedDk, C.roofRedLt), // 10 ROOF_RED
  (t) => roof(t, C.roofBlue, C.roofBlueDk, C.roofBlueLt), // 11 ROOF_BLUE
  (t) => roof(t, C.roofGray, C.roofGrayDk, C.roofGrayLt), // 12 ROOF_GRAY
  (t) => roofTop(t, C.roofRed, C.roofRedDk, C.roofRedLt), // 13 ROOF_RED_TOP
  (t) => roofTop(t, C.roofBlue, C.roofBlueDk, C.roofBlueLt), // 14 ROOF_BLUE_TOP
  (t) => roofTop(t, C.roofGray, C.roofGrayDk, C.roofGrayLt), // 15 ROOF_GRAY_TOP
]

function buildTileset() {
  const cols = 8
  const rows = Math.ceil(TILE_PAINTERS.length / cols)
  const sheet = makeImg(cols * 16, rows * 16)
  TILE_PAINTERS.forEach((paint, idx) => {
    const tile = makeImg(16, 16)
    paint(tile)
    const cx = (idx % cols) * 16
    const cy = ((idx / cols) | 0) * 16
    blit(sheet, tile, cx, cy)
  })
  writeFileSync(resolve(OUT, 'tileset.png'), encodePng(sheet))
  console.log(`tileset.png  ${sheet.w}x${sheet.h}  (${TILE_PAINTERS.length} tiles)`)
}

// ---------- character sprites (16x24) ----------
// 4 rows = directions [down, up, left, right], 3 cols = frames [stepL, idle, stepR]
function drawChar(frame, dir, step, pal) {
  // pal: {cap, hair, skin, shirt, pants, shoe}
  const f = frame
  const cx = 8 // center x
  // legs: y 19..23, animate
  const legOff = step === 0 ? -1 : step === 2 ? 1 : 0
  // shoes / pants
  function leg(x, off) {
    fillRect(f, x, 18, 3, 4, pal.pants)
    fillRect(f, x, 22 + 0, 3, 2, pal.shoe)
    // shift one leg for walk
  }
  // body block
  fillRect(f, 4, 12, 8, 7, pal.shirt) // torso
  // arms hint
  fillRect(f, 3, 13, 1, 4, pal.shirt)
  fillRect(f, 12, 13, 1, 4, pal.shirt)
  // legs with step animation
  if (step === 1) {
    fillRect(f, 5, 19, 3, 4, pal.pants)
    fillRect(f, 8, 19, 3, 4, pal.pants)
    fillRect(f, 5, 22, 3, 2, pal.shoe)
    fillRect(f, 8, 22, 3, 2, pal.shoe)
  } else if (step === 0) {
    fillRect(f, 4, 19, 3, 4, pal.pants)
    fillRect(f, 9, 20, 3, 3, pal.pants)
    fillRect(f, 4, 22, 3, 2, pal.shoe)
    fillRect(f, 9, 22, 3, 2, pal.shoe)
  } else {
    fillRect(f, 5, 20, 3, 3, pal.pants)
    fillRect(f, 9, 19, 3, 4, pal.pants)
    fillRect(f, 5, 22, 3, 2, pal.shoe)
    fillRect(f, 9, 22, 3, 2, pal.shoe)
  }
  // head
  fillRect(f, 4, 4, 8, 8, pal.skin) // face block
  // hair / cap depends on direction
  fillRect(f, 4, 3, 8, 3, pal.cap) // cap front brim
  fillRect(f, 4, 1, 8, 3, pal.hair) // top
  fillRect(f, 3, 4, 1, 3, pal.hair)
  fillRect(f, 12, 4, 1, 3, pal.hair)

  if (dir === 0) {
    // down: face + eyes + cap brim
    fillRect(f, 3, 5, 10, 2, pal.cap) // brim
    setPx(f, 6, 8, ...C.black)
    setPx(f, 9, 8, ...C.black)
    fillRect(f, 6, 10, 4, 1, [190, 120, 90]) // mouth/chin shade
  } else if (dir === 1) {
    // up: back of head, mostly hair, no face features
    fillRect(f, 4, 4, 8, 8, pal.hair)
    fillRect(f, 4, 1, 8, 4, pal.hair)
  } else if (dir === 2) {
    // left
    fillRect(f, 3, 5, 8, 2, pal.cap)
    fillRect(f, 4, 4, 4, 8, pal.skin)
    fillRect(f, 8, 4, 4, 8, pal.hair)
    setPx(f, 6, 8, ...C.black)
  } else {
    // right
    fillRect(f, 5, 5, 8, 2, pal.cap)
    fillRect(f, 8, 4, 4, 8, pal.skin)
    fillRect(f, 4, 4, 4, 8, pal.hair)
    setPx(f, 9, 8, ...C.black)
  }
}

function buildCharSheet(filename, pal) {
  const sheet = makeImg(48, 96) // 3 cols x 4 rows of 16x24
  for (let dir = 0; dir < 4; dir++)
    for (let step = 0; step < 3; step++) {
      const f = makeImg(16, 24)
      drawChar(f, dir, step, pal)
      blit(sheet, f, step * 16, dir * 24)
    }
  writeFileSync(resolve(OUT, filename), encodePng(sheet))
  console.log(`${filename}  ${sheet.w}x${sheet.h}`)
}

function buildNpcs() {
  // two NPCs, each a single down-facing idle frame, side by side (16x24)
  const sheet = makeImg(32, 24)
  const npc1 = makeImg(16, 24)
  drawChar(npc1, 0, 1, {
    cap: [60, 140, 80], hair: [60, 40, 30], skin: [232, 196, 160],
    shirt: [70, 160, 90], pants: [60, 70, 90], shoe: [40, 40, 50],
  })
  const npc2 = makeImg(16, 24)
  drawChar(npc2, 0, 1, {
    cap: [200, 120, 50], hair: [40, 30, 24], skin: [224, 184, 150],
    shirt: [220, 140, 60], pants: [90, 60, 50], shoe: [50, 40, 36],
  })
  blit(sheet, npc1, 0, 0)
  blit(sheet, npc2, 16, 0)
  writeFileSync(resolve(OUT, 'npcs.png'), encodePng(sheet))
  console.log(`npcs.png  ${sheet.w}x${sheet.h}  (2 npcs)`)
}

buildTileset()
buildCharSheet('player.png', {
  cap: [210, 60, 60], hair: [54, 38, 28], skin: [236, 198, 162],
  shirt: [70, 110, 200], pants: [60, 60, 72], shoe: [40, 40, 48],
})
buildNpcs()
console.log('Assets written to', OUT)

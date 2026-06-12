// Town map definition — 20 wide x 15 tall.
// Three layers per spec: ground (tile ids), collision (0/1), interaction (trigger ids).
// ground[][] holds the full visible tile id; the renderer draws FLOOR_TILES flat
// and treats every other tile as a "tall" object for y-sorting.

import { MAP_W, MAP_H, T, INT, FLOOR_TILES } from './constants.js'

function grid(fill) {
  return Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => fill))
}

const ground = grid(T.GRASS)
const interaction = grid(0)

// ---- helpers ----
function set(layer, c, r, v) {
  if (r < 0 || r >= MAP_H || c < 0 || c >= MAP_W) return
  layer[r][c] = v
}
function hPath(r, c0, c1) {
  for (let c = c0; c <= c1; c++) set(ground, c, r, T.PATH)
}
function vPath(c, r0, r1) {
  for (let r = r0; r <= r1; r++) set(ground, c, r, T.PATH)
}

// Roof tile sets keyed by color.
const ROOF = {
  red: { top: T.ROOF_RED_TOP, body: T.ROOF_RED },
  blue: { top: T.ROOF_BLUE_TOP, body: T.ROOF_BLUE },
  gray: { top: T.ROOF_GRAY_TOP, body: T.ROOF_GRAY },
}

// Place a 4-wide x 3-tall building. (c,r) = top-left.
// Rows: roof-top, roof-body, wall-with-door. Door at local col `doorLC`.
// Returns {doorCol, doorRow} for wiring interaction + approach tile.
function building(c, r, color, doorLC, intId) {
  const roof = ROOF[color]
  for (let i = 0; i < 4; i++) {
    set(ground, c + i, r, roof.top)
    set(ground, c + i, r + 1, roof.body)
  }
  // wall row
  const wallRow = r + 2
  for (let i = 0; i < 4; i++) set(ground, c + i, wallRow, T.WALL)
  const doorCol = c + doorLC
  set(ground, doorCol, wallRow, T.DOOR)
  // a window on the wall (avoid the door column)
  const winLC = doorLC === 1 ? 2 : 1
  set(ground, c + winLC, wallRow, T.WINDOW)
  set(interaction, doorCol, wallRow, intId)
  return { doorCol, doorRow: wallRow }
}

// ---- border trees ----
for (let c = 0; c < MAP_W; c++) {
  set(ground, c, 0, T.TREE)
  set(ground, c, MAP_H - 1, T.TREE)
}
for (let r = 0; r < MAP_H; r++) {
  set(ground, 0, r, T.TREE)
  set(ground, MAP_W - 1, r, T.TREE)
}

// ---- top row buildings (rows 1-3) ----
const house = building(2, 1, 'red', 1, INT.HOUSE) // HOME
const lab = building(8, 1, 'blue', 1, INT.LAB) // LAB
const gym = building(14, 1, 'gray', 1, INT.GYM) // GYM

// ---- bottom row buildings (rows 10-12) ----
const center = building(4, 10, 'red', 1, INT.CENTER) // POKECENTER
const mart = building(12, 10, 'blue', 1, INT.MART) // POKEMART

// ---- paths ----
// main horizontal avenue
hPath(7, 1, 18)
// vertical connectors from top building doors down to the avenue
for (const b of [house, lab, gym]) vPath(b.doorCol, b.doorRow + 1, 7)
// central vertical connector down to the lower plaza
vPath(10, 7, 12)
// lower plaza walkway in front of bottom buildings
hPath(13, 4, 15)
// connectors from bottom doors down to the plaza walkway
for (const b of [center, mart]) vPath(b.doorCol, b.doorRow + 1, 13)
// link central connector into the plaza walkway
hPath(13, 10, 13)

// ---- decoration ----
// flower beds in the open lower-center area
const flowerSpots = [[8, 8], [9, 9], [11, 9], [8, 12], [10, 11]]
for (const [c, r] of flowerSpots) if (ground[r][c] === T.GRASS) set(ground, c, r, T.FLOWERS)

// town sign in the central plaza
set(ground, 10, 9, T.SIGN)
set(interaction, 10, 9, INT.SIGN)

// a little decorative fence + pond accent near the lab/gym gap
set(ground, 12, 4, T.FENCE)
set(ground, 13, 4, T.FENCE)
set(ground, 6, 4, T.FENCE)
set(ground, 7, 4, T.FENCE)

// ---- collision derived from tiles (walkable: grass/path/flowers) ----
const WALKABLE = new Set([T.GRASS, T.PATH, T.FLOWERS])
const collision = ground.map((row) => row.map((t) => (WALKABLE.has(t) ? 0 : 1)))

// ---- NPC tiles (blocked + interactable; sprite drawn separately) ----
// Place on grass tiles with a walkable neighbour the player can stand on.
function placeNpc(c, r, intId) {
  set(collision, c, r, 1)
  set(interaction, c, r, intId)
}
placeNpc(5, 6, INT.NPC1) // on grass beside the main avenue
placeNpc(14, 6, INT.NPC2) // on grass near the gym front

export const mapData = { ground, collision, interaction }
export const SPAWN = { col: 10, row: 8 } // on the central connector path
export { FLOOR_TILES }

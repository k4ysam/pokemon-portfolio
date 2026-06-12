// Town map — 20 wide x 15 tall, laid out to match the reference art:
// three buildings on top (HOME / LAB / GYM), two on the bottom (CONTACT
// center / LINKS mart), sandy autotiled paths, a fountain, a welcome sign,
// a picket fence along the bottom and a dense pine border all around.
//
// Layers: ground (tile ids), collision (0/1), interaction (trigger ids), and a
// list of multi-tile `objects` (buildings, trees, fountain, sign) drawn from
// objects.png and y-sorted against the player by their base row.

import { MAP_W, MAP_H, T, INT, PATH_AUTO_BASE, WALKABLE_FLOOR } from './constants.js'
import { BUILDING_DOORS } from './objectAtlas.js'

function grid(fill) {
  return Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => fill))
}

const ground = grid(T.GRASS)
const interaction = grid(0)
const isPath = grid(false)
const objects = []

function set(layer, c, r, v) {
  if (r < 0 || r >= MAP_H || c < 0 || c >= MAP_W) return
  layer[r][c] = v
}
function rect(layer, c0, r0, c1, r1, v) {
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(layer, c, r, v)
}
function hPath(r, c0, c1) {
  for (let c = c0; c <= c1; c++) set(isPath, c, r, true)
}
function vPath(c, r0, r1) {
  for (let r = r0; r <= r1; r++) set(isPath, c, r, true)
}

// ---- buildings (5 wide x 4 tall stamps from objects.png) ----
function building(key, col, row, intId) {
  const w = 5
  const h = 4
  objects.push({ key, col, row, w, h, solid: 'box' })
  const [dlc, dlr] = BUILDING_DOORS[key]
  const doorCol = col + dlc
  const doorRow = row + dlr
  set(interaction, doorCol, doorRow, intId)
  return { doorCol, doorRow }
}

// top row (rows 1-4)
const home = building('bld_home', 1, 1, INT.HOUSE)
const lab = building('bld_lab', 7, 1, INT.LAB)
const gym = building('bld_gym', 13, 1, INT.GYM)
// bottom row (rows 8-11)
const center = building('bld_center', 2, 8, INT.CENTER)
const mart = building('bld_mart', 13, 8, INT.MART)

// ---- paths (1 tile wide; autotiled below) ----
hPath(6, 2, 17) // main avenue
vPath(home.doorCol, 5, 6) // HOME door -> avenue
vPath(gym.doorCol, 5, 6) // GYM door -> avenue
vPath(lab.doorCol, 5, 14) // LAB door -> avenue -> town exit at the bottom
hPath(12, center.doorCol, mart.doorCol) // lower walkway in front of CONTACT/LINKS

// resolve path cells into autotile variants (off-map neighbours count as path
// so border-touching path reads as continuing off screen)
function pathAt(c, r) {
  if (r < 0 || r >= MAP_H || c < 0 || c >= MAP_W) return true
  return isPath[r][c]
}
for (let r = 0; r < MAP_H; r++) {
  for (let c = 0; c < MAP_W; c++) {
    if (!isPath[r][c]) continue
    const mask =
      (pathAt(c, r - 1) ? 1 : 0) |
      (pathAt(c + 1, r) ? 2 : 0) |
      (pathAt(c, r + 1) ? 4 : 0) |
      (pathAt(c - 1, r) ? 8 : 0)
    ground[r][c] = PATH_AUTO_BASE + mask
  }
}

// ---- fountain (2x2 pond, west of the LAB path) + welcome sign ----
objects.push({ key: 'fountain', col: 8, row: 9, w: 2, h: 2, solid: 'box' })

objects.push({ key: 'sign_town', col: 8, row: 13, w: 2, h: 1, solid: 'box' })
set(interaction, 8, 13, INT.SIGN)
set(interaction, 9, 13, INT.SIGN)

// ---- border: foliage along the top, pine columns on the sides, fence below ----
for (let c = 0; c < MAP_W; c++) set(ground, c, 0, T.TREETOP)

// stacked pines down both side columns (each canopy overlaps the pine above)
function pine(key, trunkCol, trunkRow, w = 1) {
  objects.push({ key, col: trunkCol, row: trunkRow - 1, w, h: 2, solid: 'base' })
}
for (let r = 1; r <= 12; r++) {
  pine('pine', 0, r)
  pine('pine', MAP_W - 1, r)
}
// broad pines anchor the bottom corners
objects.push({ key: 'pine_big', col: 0, row: 13, w: 2, h: 2, solid: 'box' })
objects.push({ key: 'pine_big', col: MAP_W - 2, row: 13, w: 2, h: 2, solid: 'box' })

// picket fence along the bottom (the LAB path exits through the gap)
for (let c = 2; c <= MAP_W - 3; c++) {
  if (c === lab.doorCol) continue
  if (ground[MAP_H - 1][c] === T.GRASS) set(ground, c, MAP_H - 1, T.FENCE_H)
}

// ---- decoration: flower beds, shrubs, accent trees, grass variation ----
// round trees flanking the avenue like the reference art
pine('tree_round', 1, 7)
pine('tree_round', 18, 7)

// flower beds (intentional clusters, not confetti)
const flowerBeds = [
  [6, 2, T.FLOWERS2], [6, 4, T.FLOWERS],
  [12, 2, T.FLOWERS], [12, 4, T.FLOWERS2],
  [2, 5, T.FLOWERS], [17, 5, T.FLOWERS2],
  [7, 5, T.FLOWERS2], [13, 5, T.FLOWERS],
  [7, 8, T.FLOWERS], [11, 9, T.FLOWERS2],
  [7, 11, T.FLOWERS2], [12, 10, T.FLOWERS],
  [2, 13, T.FLOWERS], [17, 13, T.FLOWERS2],
  [11, 13, T.FLOWERS],
]
for (const [c, r, t] of flowerBeds) {
  if (ground[r][c] === T.GRASS) set(ground, c, r, t)
}

// shrubs
for (const [c, r] of [[2, 7], [17, 7], [12, 13], [7, 13]]) {
  if (ground[r][c] === T.GRASS) set(ground, c, r, T.BUSH)
}

// grass tuft variation
const tufts = [
  [3, 5], [9, 2], [11, 3], [6, 3], [12, 3], [15, 5], [4, 7], [8, 7],
  [11, 7], [14, 7], [1, 9], [11, 8], [12, 9], [7, 9], [1, 11], [18, 9],
  [18, 11], [11, 11], [3, 13], [5, 13], [14, 13], [16, 13], [10, 13],
]
for (const [c, r] of tufts) {
  if (ground[r][c] === T.GRASS) set(ground, c, r, T.GRASS2)
}

// ---- collision: derive from ground, then OR in object footprints ----
const collision = ground.map((row) => row.map((t) => (WALKABLE_FLOOR.has(t) ? 0 : 1)))
for (const o of objects) {
  if (o.solid === 'box') {
    rect(collision, o.col, o.row, o.col + o.w - 1, o.row + o.h - 1, 1)
  } else if (o.solid === 'base') {
    rect(collision, o.col, o.row + o.h - 1, o.col + o.w - 1, o.row + o.h - 1, 1) // trunk row
  }
}
// the map border is never walkable (tree wall / fence / off-screen exit)
rect(collision, 0, 0, MAP_W - 1, 0, 1)
rect(collision, 0, MAP_H - 1, MAP_W - 1, MAP_H - 1, 1)
rect(collision, 0, 0, 0, MAP_H - 1, 1)
rect(collision, MAP_W - 1, 0, MAP_W - 1, MAP_H - 1, 1)

// ---- NPCs (blocked + interactable; sprite drawn separately) ----
function placeNpc(c, r, intId) {
  set(collision, c, r, 1)
  set(interaction, c, r, intId)
}
placeNpc(6, 6, INT.NPC1) // on the avenue, west of the LAB path
placeNpc(14, 6, INT.NPC2) // on the avenue, near the GYM

export const mapData = { ground, collision, interaction, objects }
export const SPAWN = { col: 10, row: 8 } // on the central path below the avenue

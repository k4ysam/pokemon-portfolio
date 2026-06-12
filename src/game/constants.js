// Shared game constants and tile index map.
// Tile indices MUST match the packing order in scripts/pack-assets.py.

export const TILE = 16 // source tile size in px
export const MAP_W = 20
export const MAP_H = 15
export const MOVE_MS = 150 // ms to traverse one tile

// Overworld character frame size (matches CHAR_W/CHAR_H in pack-assets.py).
export const CHAR_W = 24
export const CHAR_H = 32

// tileset.png tile ids (8 columns).
export const T = {
  GRASS: 0,
  GRASS2: 1, // grass with white tuft accents
  PATH: 2, // plain sandy center (autotile variants live at PATH_AUTO_BASE+)
  SAND: 3,
  WATER: 4,
  COBBLE: 5,
  FLOWERS: 6, // mixed colours
  FLOWERS2: 7, // white/yellow
  TREETOP: 8, // dense foliage — used for the map border tree wall
  BUSH: 9,
  ROCK: 10,
  FENCE_H: 11,
  FENCE_POST: 12,
  SIGN: 13,
  TREE_TOP: 14, // legacy slot (pine top); trees are objects
  TREE_BOT: 15, // legacy slot (pine trunk)
}

// Path autotile variants: id = PATH_AUTO_BASE + mask, where mask bits mark
// which orthogonal neighbours are also path (N=1, E=2, S=4, W=8).
export const PATH_AUTO_BASE = 16

export const TILESET_COLS = 8 // columns in tileset.png

const PATH_AUTO_IDS = Array.from({ length: 16 }, (_, m) => PATH_AUTO_BASE + m)

// Floor tiles are drawn flat in the ground pass. Everything else in ground[][]
// is a "tall" object that participates in y-sorting against the player.
export const FLOOR_TILES = new Set([
  T.GRASS,
  T.GRASS2,
  T.PATH,
  T.SAND,
  T.WATER,
  T.COBBLE,
  T.FLOWERS,
  T.FLOWERS2,
  ...PATH_AUTO_IDS,
])

// Floor tiles the player may stand on (water is floor-drawn but blocked).
export const WALKABLE_FLOOR = new Set([
  T.GRASS,
  T.GRASS2,
  T.PATH,
  T.SAND,
  T.COBBLE,
  T.FLOWERS,
  T.FLOWERS2,
  ...PATH_AUTO_IDS,
])

// Direction indices — must match player.png / npcs.png row order.
export const DIR = { DOWN: 0, UP: 1, LEFT: 2, RIGHT: 3 }

// Interaction trigger IDs (interaction[][] values).
export const INT = {
  HOUSE: 1, // about
  LAB: 2, // skills
  GYM: 3, // projects
  CENTER: 4, // contact
  MART: 5, // placeholder dialogue
  SIGN: 6, // town sign
  NPC1: 10,
  NPC2: 11,
}

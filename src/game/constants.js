// Shared game constants and tile index map.
// Tile indices MUST match scripts/generate-assets.js TILE_PAINTERS order.

export const TILE = 16 // source tile size in px
export const MAP_W = 20
export const MAP_H = 15
export const MOVE_MS = 150 // ms to traverse one tile

export const T = {
  GRASS: 0,
  PATH: 1,
  FLOWERS: 2,
  TREE: 3,
  FENCE: 4,
  WATER: 5,
  SIGN: 6,
  WALL: 7,
  DOOR: 8,
  WINDOW: 9,
  ROOF_RED: 10,
  ROOF_BLUE: 11,
  ROOF_GRAY: 12,
  ROOF_RED_TOP: 13,
  ROOF_BLUE_TOP: 14,
  ROOF_GRAY_TOP: 15,
}

// Tiles drawn flat in the ground pass (everything else is a "tall" object
// that participates in y-sorting against the player).
export const FLOOR_TILES = new Set([T.GRASS, T.PATH, T.FLOWERS, T.WATER])

export const TILESET_COLS = 8 // columns in tileset.png

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

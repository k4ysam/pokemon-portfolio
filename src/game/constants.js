// Shared game constants.
// Every map is a pre-rendered background over a grid of 32px tiles; each map
// carries its own cols/rows/collision (see src/game/maps/).

export const TILE = 32 // tile size in px on the background image
export const MOVE_MS = 150 // ms to traverse one tile

// Overworld character frame size in the source sheets (player.png / npcs.png),
// drawn scaled by CHAR_SCALE so sprites match the 32px tile art.
export const CHAR_W = 24
export const CHAR_H = 32
export const CHAR_SCALE = 2

// Direction indices — must match player.png / npcs.png row order.
export const DIR = { DOWN: 0, UP: 1, LEFT: 2, RIGHT: 3 }

// Pokemon overworld frame size in pokemon.png (see pack-assets.py).
export const POKE_W = 32
export const POKE_H = 32

// Interaction trigger IDs (interaction[][] values; NPC/MON ids are carried by
// the wanderers themselves, not the grid).
export const INT = {
  HOUSE: 1, // about
  LAB: 2, // skills
  GYM: 3, // projects
  CENTER: 4, // warp into the Center interior
  MART: 5, // placeholder dialogue
  SIGN: 6, // town sign
  NPC1: 10,
  NPC2: 11,
  MON1: 12,
  MON2: 13,
  MON3: 14,
  MON4: 15, // Center interior Eevee
  NPC3: 16, // nurse (visual; spoken to via the NURSE counter tiles)
  // Center interior triggers
  NURSE: 20, // counter tiles in front of the nurse -> contact modal
  CENTER_PC: 21, // counter PC -> mailto
  BOOKSHELF: 22,
  CENTER_TV: 23,
  PAINTING: 24,
  CENTER_EXIT: 25, // door tiles, step-on warp back to town
}

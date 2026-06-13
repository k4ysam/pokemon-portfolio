// Town map: pre-rendered background (public/assets/town-bg.png, 1536x1024 =
// 48x32 tiles @ 32px) with image-derived collision.
//
// The collision grid below was derived from the image by
// scripts/derive-collision.py (color classification + hand-measured overrides
// + flood fill from spawn) — rerun that script after editing the image.
//
// Layout: HOME (cols 8-13, door 10-11,8) / LAB (19-26, door 22-23,8) /
// GYM (31-39, door 35-36,8) on top; CONTACT (9-16, door 12-13,23) and
// MISC->MART (31-36, door 33-34,23) below; fountain pool at (21-24, 15-17)
// with a walkable ring; notice board (town sign) right of the LAB door at
// (25-26, 8); pond by the GYM and a garden plot west of HOME are blocked.
// South stairs (cols 22-23) lead off-map and stay closed at the tree line.

import { INT, DIR } from '../constants.js'

const COLS = 48
const ROWS = 32

const COLLISION_ROWS = [
  '111111111111111111111111111111111111111111111111',
  '111111111111111111111111111111111111111111111111',
  '111111111111111111111111111111111111111111111111',
  '111111111111111111011111111000111111111111111111',
  '111111111111111110011111111001111111111111111111',
  '111111111111111101011111111010111111111111111111',
  '111111111111111100011111111000111111111111111111',
  '111111111111111100011111111010111111111111111111',
  '111111111111111001011111111110111111111111111111',
  '111111111100100010001100110000001110011111111111',
  '111111111100000100011000010000000100001111111111',
  '111111111000011001110000000101000000000011111111',
  '111111111000000000010000010000010000000011111111',
  '111111111000100101010000011101100100001011111111',
  '111111110000000100000000000001000000000011110111',
  '111110000000000000000111100000000000000000000111',
  '111100000000000000000111100000000000000000000111',
  '111100000000000000000111100000000000000000000011',
  '111100010111111111000000000010011111100010000111',
  '111111001111111110100000001001111111100100001111',
  '111101010111111110001000011011111111100010101111',
  '111100000111111111101000110001111111111001101111',
  '111101110111111111100000000100011111111111111111',
  '111100000111111110001000000000011111110000111111',
  '111101101110001100100000010011000001100010111111',
  '111101000010000000000000000000000000000111111111',
  '111111110100000000000000000000000001101111111111',
  '111111110011111110000000000001111111101111111111',
  '111111110001111110110000010000111111111111111111',
  '111111111111111111111111111111111111111111111111',
  '111111111111111111111111111111111111111111111111',
  '111111111111111111111111111111111111111111111111',
]

const collision = COLLISION_ROWS.map((row) => [...row].map(Number))

// ---- interaction triggers ----
const interaction = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 0),
)

function set(c, r, id) {
  interaction[r][c] = id
}

set(10, 8, INT.HOUSE) // HOME door (2 tiles wide)
set(11, 8, INT.HOUSE)
set(22, 8, INT.LAB) // LAB door
set(23, 8, INT.LAB)
set(35, 8, INT.GYM) // GYM door
set(36, 8, INT.GYM)
set(12, 23, INT.CENTER) // CONTACT door
set(13, 23, INT.CENTER)
set(33, 23, INT.MART) // MISC door
set(34, 23, INT.MART)
set(25, 8, INT.SIGN) // notice board right of the LAB door
set(26, 8, INT.SIGN)
// NPCs/Pokemon are dynamic — collision + interaction come from the wanderers

// ---- what each interaction id does on this map ----
const actions = {
  [INT.HOUSE]: { kind: 'modal', content: 'about', name: 'HOME' },
  [INT.LAB]: { kind: 'modal', content: 'skills', name: 'LAB' },
  [INT.GYM]: { kind: 'warp', to: 'gym', spawn: 'entry', name: 'GYM' },
  [INT.CENTER]: { kind: 'warp', to: 'center', spawn: 'entry', name: 'CENTER' },
  [INT.MART]: {
    kind: 'dialogue',
    name: 'MART',
    lines: ['This shop is restocking...', 'Come back soon!'],
  },
  [INT.SIGN]: {
    kind: 'dialogue',
    name: 'SIGN',
    lines: ['SAMAKSH TOWN', 'A portfolio you can walk around in.'],
  },
}

// Wandering town residents: two NPCs (npcs.png) and three Pokemon
// (pokemon.png). `sprite` indexes a 3-column block in the respective sheet;
// `zone` is the inclusive tile rect each wanderer roams (collision still
// applies on top). All are interactable: face one and press the action key.
const wanderers = [
  {
    id: INT.NPC1,
    kind: 'npc',
    sprite: 0, // professor
    col: 8,
    row: 16,
    zone: { c0: 5, r0: 15, c1: 19, r1: 17 }, // west avenue
    moveMs: 300,
    lines: [
      'Welcome to SAMAKSH TOWN!',
      'The local dev here builds some cool things.',
    ],
  },
  {
    id: INT.NPC2,
    kind: 'npc',
    sprite: 1, // Silver
    col: 32,
    row: 16,
    zone: { c0: 26, r0: 15, c1: 43, r1: 17 }, // east avenue, toward the GYM
    moveMs: 300,
    lines: [
      'Check out the Gym — some serious',
      'engineering went down there.',
    ],
  },
  {
    id: INT.MON1,
    kind: 'mon',
    sprite: 0, // Pikachu
    col: 20,
    row: 14,
    zone: { c0: 19, r0: 13, c1: 26, r1: 18 }, // fountain plaza
    moveMs: 260,
    lines: ['Pika pika!'],
  },
  {
    id: INT.MON2,
    kind: 'mon',
    sprite: 1, // Eevee
    col: 13,
    row: 10,
    zone: { c0: 9, r0: 9, c1: 19, r1: 14 }, // grass between HOME and LAB
    moveMs: 240,
    lines: ['Vee? Eevee!'],
  },
  {
    id: INT.MON3,
    kind: 'mon',
    sprite: 2, // Piplup
    col: 28,
    row: 26,
    zone: { c0: 9, r0: 25, c1: 37, r1: 28 }, // lower walkway
    moveMs: 320,
    lines: ['Pip-lup!'],
  },
]

export const townDef = {
  id: 'town',
  bgSrc: 'assets/town-bg.png',
  cols: COLS,
  rows: ROWS,
  collision,
  interaction,
  actions,
  wanderers,
  spawns: {
    default: { col: 22, row: 13, dir: DIR.DOWN }, // path north of the fountain
    fromCenter: { col: 12, row: 24, dir: DIR.DOWN }, // outside the CONTACT door
    fromGym: { col: 35, row: 9, dir: DIR.DOWN },    // outside the GYM door
  },
  // Background sub-rects (px) re-drawn over the sprites so the player passes
  // behind them — none in this town (nothing elevated spans a walkable tile).
  foregroundRects: [],
}

// Pokemon Center interior (contact). Pre-rendered background
// public/assets/center-bg.png (768x512 = 24x16 tiles @ 32px), downscaled 2x
// from pkmn_center.png in the repo root (ChatGPT-generated, like the town)
// by scripts/derive-center.py — rerun it after editing the image or the
// collision rows below (it also regenerates the grid/collision overlays).
//
// Collision was hand-measured from the image (interior floors don't fit the
// town's color heuristic):
// back wall + windows rows 0-2; the whole behind-counter strip (healing
// machine 6-8, TV 13-14, tank 15-16) is sealed staff-only; counter rows 5-6
// spans cols 4-18 with its corner dropping to (17-18, 7); bookshelf (0-1,
// 4-6) + stool (2-3, 6) close off the left; waiting area: sofa (1-2, 8-10),
// cushions (3 / 6, 8-9), table (3-5, 9-11), stool (2-3, 10-11), plants
// (1, 11-12) and (7, 11-12); right wall art: painting (20-21, 4-5), TV
// (21-22, 6-8). Exit: the double door at (10-12, 13) — step in to warp out;
// the mat drawn below it is outside the room.

import { INT, DIR } from '../constants.js'

const COLS = 24
const ROWS = 16

const COLLISION_ROWS = [
  '111111111111111111111111',
  '111111111111111111111111',
  '111111111111111111111111',
  '111111111111111111100011',
  '111111111111111111101101',
  '111111111111111111101101',
  '111111111111111111100111',
  '100000000000000001100111',
  '111100100000000000000111',
  '111111100000000000000001',
  '111111000000000000000001',
  '111111010000000000000001',
  '110000010000000000000001',
  '111111111100011111111111',
  '111111111111111111111111',
  '111111111111111111111111',
]

const collision = COLLISION_ROWS.map((row) => [...row].map(Number))

// ---- interaction triggers ----
const interaction = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 0),
)

function set(c, r, id) {
  interaction[r][c] = id
}

set(4, 6, INT.CENTER_PC) // PC on the counter's left end
set(5, 6, INT.CENTER_PC)
for (const c of [9, 10, 11, 12]) set(c, 6, INT.NURSE) // counter, nurse behind
set(0, 6, INT.BOOKSHELF)
set(1, 6, INT.BOOKSHELF)
set(20, 5, INT.PAINTING)
set(21, 5, INT.PAINTING)
set(21, 8, INT.CENTER_TV)
set(22, 8, INT.CENTER_TV)
for (const c of [10, 11, 12]) set(c, 13, INT.CENTER_EXIT) // door (step-on)

// ---- what each interaction id does on this map ----
const actions = {
  [INT.NURSE]: {
    kind: 'dialogue',
    name: 'NURSE',
    lines: [
      'Welcome to the SAMAKSH TOWN Pokemon Center!',
      'Let us heal your questions...',
    ],
    thenModal: 'contact',
  },
  [INT.CENTER_PC]: {
    kind: 'dialogue',
    name: 'PC',
    lines: ['You booted up the counter PC.', 'Composing a new email...'],
    thenHref: 'mailto:samaksh.khandelwal@mail.mcgill.ca',
  },
  [INT.BOOKSHELF]: {
    kind: 'dialogue',
    name: 'BOOKSHELF',
    lines: [
      'Trainer guidebooks, machine manuals...',
      'and a well-worn copy of "Networking for Humans".',
    ],
  },
  [INT.PAINTING]: {
    kind: 'dialogue',
    name: 'PAINTING',
    lines: ['A painting of Montreal in winter.', 'Cozy.'],
  },
  [INT.CENTER_TV]: {
    kind: 'dialogue',
    name: 'TV',
    lines: ['The TV is showing the local news...', '"AREA DEV REMAINS OPEN TO OPPORTUNITIES!"'],
  },
  [INT.CENTER_EXIT]: { kind: 'warp', to: 'town', spawn: 'fromCenter', onStep: true },
}

const wanderers = [
  {
    id: INT.NPC3,
    kind: 'npc',
    sprite: 2, // nurse
    col: 11,
    row: 4,
    dir: DIR.DOWN,
    static: true, // never leaves her post behind the counter
    lines: ['Welcome to the SAMAKSH TOWN Pokemon Center!'],
  },
  {
    id: INT.MON4,
    kind: 'mon',
    sprite: 1, // Eevee, dozing around the waiting area
    col: 8,
    row: 10,
    zone: { c0: 8, r0: 9, c1: 9, r1: 11 },
    moveMs: 400,
    lines: ['Vee...', '(It seems to be waiting for someone.)'],
  },
]

export const centerDef = {
  id: 'center',
  bgSrc: 'assets/center-bg.png',
  cols: COLS,
  rows: ROWS,
  collision,
  interaction,
  actions,
  wanderers,
  spawns: {
    // just inside the double door, facing the counter
    entry: { col: 11, row: 12, dir: DIR.UP },
    default: { col: 11, row: 12, dir: DIR.UP },
  },
  // The glass doors are re-drawn over the player as they step in, so they
  // sink into the doorway during the exit warp (px rect on the 768x512 bg).
  foregroundRects: [[314, 416, 108, 42]],
}

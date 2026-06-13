// Lab interior (skills). Pre-rendered background public/assets/lab-bg.png
// (768x512 = 24x16 tiles @ 32px) downscaled 2x from lab.png in the repo root
// (ChatGPT-generated, flat top-down HGSS style) by scripts/generate-lab-bg.py —
// rerun it after editing the image or the collision rows below.
//
// Collision was hand-measured from the grid overlay (interior floors don't fit
// the town's color heuristic):
// back wall rows 0-2; the SUPERCOMPUTER (cols 1-6, ML & AI), professor's DESK
// (cols 10-14) and SERVER RACK (cols 18-22, BACKEND) sit on the back wall with
// their fronts at row 3; the desk drops to row 4 (professor zone, faced from
// row 5 -> skills modal); two BOOKSHELVES (cols 1-4, rows 5-7) and a glass
// CABINET (cols 1-3, rows 8-10) line the left wall (TOOLS); the DEV WORKBENCH
// (cols 18-22, rows 6-7) + chair (col 20, row 8) line the right wall (FRONTEND);
// the round STARTER TABLE with three Poke Balls is dead center (cols 10-13,
// rows 7-9, LANGUAGES). Exit: the door at (10-13, 14) — step in to warp out; the
// red mat drawn at row 15 is outside the room. The whiteboard above the desk is
// decorative (walled off behind the desk).
//
// Each station sits on a blocked tile faced from the adjacent walkable tile (up
// for the back/center props, left/right for the wall props), like the Center.

import { INT, DIR } from '../constants.js'

const COLS = 24
const ROWS = 16

const COLLISION_ROWS = [
  '111111111111111111111111', // 0  back wall
  '111111111111111111111111', // 1  windows / whiteboard / machine tops
  '111111111111111111111111', // 2  wall base
  '111111100011111000111111', // 3  super 1-6 | desk 10-14 | rack 18-22 (fronts)
  '100000000111110000000001', // 4  desk front 10-14 (professor zone)
  '111110000000000000000001', // 5  left bookshelf 1-4
  '111110000000000000111111', // 6  bookshelf 1-4 | dev desk 18-22
  '111110000011110000111111', // 7  bookshelf 1-4 | table 10-13 | dev desk 18-22
  '111100000011110000001001', // 8  cabinet 1-3 | table 10-13 | chair 20
  '111100000011110000000001', // 9  cabinet 1-3 | table 10-13
  '111100000000000000000001', // 10 cabinet 1-3 (bottom)
  '100000000000000000000001', // 11 open floor
  '100000000000000000000001', // 12 open floor
  '100000000000000000000001', // 13 open floor (approach to door)
  '111111111100001111111111', // 14 front wall + door opening (cols 10-13)
  '111111111111111111111111', // 15 front wall / outside mat
]

const collision = COLLISION_ROWS.map((row) => [...row].map(Number))

const interaction = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 0),
)

function set(c, r, id) {
  interaction[r][c] = id
}

// Professor's desk front (player at row 5 facing UP hits row 4)
for (const c of [10, 11, 12, 13, 14]) set(c, 4, INT.LAB_PROFESSOR)

// Supercomputer — ML & AI (player at row 4 facing UP hits row 3, back-left)
for (const c of [2, 3, 4, 5]) set(c, 3, INT.LAB_ML)

// Server rack — BACKEND (player at row 4 facing UP hits row 3, back-right)
for (const c of [18, 19, 20, 21, 22]) set(c, 3, INT.LAB_BACKEND)

// Starter table — LANGUAGES (faced from row 6 above or row 10 below)
for (const c of [10, 11, 12, 13]) {
  set(c, 7, INT.LAB_LANGUAGES)
  set(c, 9, INT.LAB_LANGUAGES)
}

// Bookshelf + cabinet — TOOLS (player to the right facing LEFT)
for (const r of [5, 6, 7]) set(4, r, INT.LAB_TOOLS) // bookshelf right edge
for (const r of [8, 9, 10]) set(3, r, INT.LAB_TOOLS) // cabinet right edge

// Dev workbench — FRONTEND (player at col 17 facing RIGHT hits col 18)
for (const r of [6, 7]) set(18, r, INT.LAB_FRONTEND)

// Exit door (step-on)
for (const c of [10, 11, 12, 13]) set(c, 14, INT.LAB_EXIT)

const actions = {
  [INT.LAB_PROFESSOR]: {
    kind: 'dialogue',
    name: 'PROFESSOR',
    lines: [
      'Welcome to my LAB!',
      'Let me show you my RESEARCH CATALOG...',
    ],
    thenModal: 'skills',
  },
  [INT.LAB_LANGUAGES]: {
    kind: 'dialogue',
    name: 'LANGUAGES',
    lines: [
      'Three starter stacks rest on the table.',
      'Python, TypeScript, C++ — also Java and SQL.',
    ],
  },
  [INT.LAB_ML]: {
    kind: 'dialogue',
    name: 'ML & AI',
    lines: [
      'The GPU rig is running hot.',
      'PyTorch, diffusion models, CUDA, the Claude API.',
    ],
  },
  [INT.LAB_BACKEND]: {
    kind: 'dialogue',
    name: 'BACKEND',
    lines: [
      'Servers humming day and night.',
      'Node.js, FastAPI, SQLite, PostgreSQL — boxed in Docker.',
    ],
  },
  [INT.LAB_FRONTEND]: {
    kind: 'dialogue',
    name: 'FRONTEND',
    lines: [
      'Two monitors of live UI.',
      'React, Next.js, Tailwind... and PyQt6 for desktop.',
    ],
  },
  [INT.LAB_TOOLS]: {
    kind: 'dialogue',
    name: 'TOOLS',
    lines: [
      'Shelves of well-worn tools.',
      'Git, Linux, Unreal Engine, 3D Slicer.',
    ],
  },
  [INT.LAB_EXIT]: { kind: 'warp', to: 'town', spawn: 'fromLab', onStep: true },
}

const wanderers = [
  {
    id: INT.NPC5,
    kind: 'npc',
    sprite: 0, // professor — stands in front of his research desk
    col: 12,
    row: 5,
    dir: DIR.DOWN,
    static: true,
    lines: [
      'So — you came to see my research?',
      'Everything here has shipped in a real project.',
    ],
    thenModal: 'skills',
  },
  {
    id: INT.MON6,
    kind: 'mon',
    sprite: 0, // Pikachu — the Professor's partner
    col: 11,
    row: 11,
    zone: { c0: 7, r0: 10, c1: 16, r1: 12 },
    moveMs: 320,
    lines: ['Pika!', "(The Professor's partner naps by the starter table.)"],
  },
]

export const labDef = {
  id: 'lab',
  bgSrc: 'assets/lab-bg.png',
  cols: COLS,
  rows: ROWS,
  collision,
  interaction,
  actions,
  wanderers,
  spawns: {
    // just inside the door, facing up into the room
    entry: { col: 11, row: 13, dir: DIR.UP },
    default: { col: 11, row: 13, dir: DIR.UP },
  },
  foregroundRects: [],
}

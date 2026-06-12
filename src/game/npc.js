// NPC data. Positions mirror the placeNpc() calls in mapData.js.
// `sprite` indexes a CHAR_W x CHAR_H cell in npcs.png (0 professor, 1 Silver).

import { INT } from './constants.js'

export const NPCS = [
  {
    id: INT.NPC1,
    col: 8,
    row: 8,
    sprite: 0,
    lines: [
      'Welcome to SAMAKSH TOWN!',
      'The local dev here builds some cool things.',
    ],
  },
  {
    id: INT.NPC2,
    col: 16,
    row: 8,
    sprite: 1,
    lines: [
      'Check out the Gym — some serious',
      'engineering went down there.',
    ],
  },
]

export function npcById(id) {
  return NPCS.find((n) => n.id === id) || null
}

// Wandering town residents: two NPCs (npcs.png) and three Pokemon
// (pokemon.png). `sprite` indexes a 3-column block in the respective sheet;
// `zone` is the inclusive tile rect each wanderer roams (collision still
// applies on top). All are interactable: face one and press the action key.

import { INT } from './constants.js'
import { createWanderer } from './wander.js'

export const WANDERERS = [
  {
    id: INT.NPC1,
    kind: 'npc',
    sprite: 0, // professor
    col: 8,
    row: 8,
    zone: { c0: 4, r0: 7, c1: 11, r1: 9 }, // west avenue
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
    col: 16,
    row: 8,
    zone: { c0: 13, r0: 7, c1: 20, r1: 9 }, // east avenue
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
    col: 10,
    row: 12,
    zone: { c0: 10, r0: 10, c1: 14, r1: 14 }, // fountain plaza
    moveMs: 260,
    lines: ['Pika pika!'],
  },
  {
    id: INT.MON2,
    kind: 'mon',
    sprite: 1, // Eevee
    col: 5,
    row: 7,
    zone: { c0: 3, r0: 6, c1: 9, r1: 9 }, // grass by HOME
    moveMs: 240,
    lines: ['Vee? Eevee!'],
  },
  {
    id: INT.MON3,
    kind: 'mon',
    sprite: 2, // Piplup
    col: 16,
    row: 15,
    zone: { c0: 5, r0: 15, c1: 19, r1: 16 }, // lower walkway
    moveMs: 320,
    lines: ['Pip-lup!'],
  },
].map(createWanderer)

export function wandererAt(col, row) {
  return (
    WANDERERS.find(
      (w) =>
        (w.col === col && w.row === row) ||
        (w.moving && w.fromCol === col && w.fromRow === row),
    ) || null
  )
}

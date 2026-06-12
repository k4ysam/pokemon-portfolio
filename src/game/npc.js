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

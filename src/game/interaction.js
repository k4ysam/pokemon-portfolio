// Resolve what the player is facing into a UI action.

import { MAP_W, MAP_H, INT } from './constants.js'
import { facingTile } from './player.js'
import { npcById } from './npc.js'

// Map building interaction ids -> the modal content key (or a placeholder dialogue).
const BUILDINGS = {
  [INT.HOUSE]: { kind: 'modal', content: 'about', name: 'HOME' },
  [INT.LAB]: { kind: 'modal', content: 'skills', name: 'LAB' },
  [INT.GYM]: { kind: 'modal', content: 'projects', name: 'GYM' },
  [INT.CENTER]: { kind: 'modal', content: 'contact', name: 'CENTER' },
  [INT.MART]: {
    kind: 'dialogue',
    name: 'MART',
    lines: ['This shop is restocking...', 'Come back soon!'],
  },
}

// Is the tile the player faces interactable? (used for the "!" indicator)
export function facingInteractable(player, map) {
  const { col, row } = facingTile(player)
  if (col < 0 || row < 0 || col >= MAP_W || row >= MAP_H) return false
  return map.interaction[row][col] !== 0
}

// Resolve the facing interaction into a descriptor the UI router can act on.
export function resolveInteraction(player, map) {
  const { col, row } = facingTile(player)
  if (col < 0 || row < 0 || col >= MAP_W || row >= MAP_H) return null
  const id = map.interaction[row][col]
  if (!id) return null

  if (id === INT.NPC1 || id === INT.NPC2) {
    const npc = npcById(id)
    return npc ? { kind: 'dialogue', name: npc.id, lines: npc.lines } : null
  }
  if (id === INT.SIGN) {
    return {
      kind: 'dialogue',
      name: 'SIGN',
      lines: ['SAMAKSH TOWN', 'A portfolio you can walk around in.'],
    }
  }
  if (BUILDINGS[id]) return BUILDINGS[id]
  return null
}

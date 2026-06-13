// Resolve what the player is facing into a UI action, using the current
// map's `actions` table (interaction id -> descriptor). Descriptor kinds:
//   { kind: 'modal', content }            — open a ContentModal
//   { kind: 'dialogue', lines, thenModal? } — DialogueBox, optionally chaining
//                                            into a modal when dismissed
//   { kind: 'warp', to, spawn, onStep? }  — fade-warp to another map
import { DIR } from './constants.js'
import { facingTile } from './player.js'
import { wandererAt } from './wander.js'

const FACE_PLAYER = {
  [DIR.UP]: DIR.DOWN,
  [DIR.DOWN]: DIR.UP,
  [DIR.LEFT]: DIR.RIGHT,
  [DIR.RIGHT]: DIR.LEFT,
}

function inBounds(map, col, row) {
  return col >= 0 && row >= 0 && col < map.cols && row < map.rows
}

// Is the tile the player faces interactable? (used for the "!" indicator)
export function facingInteractable(player, map) {
  const { col, row } = facingTile(player)
  if (!inBounds(map, col, row)) return false
  return map.interaction[row][col] !== 0 || wandererAt(map.wanderers, col, row) !== null
}

// Resolve the facing interaction into a descriptor the UI router can act on.
export function resolveInteraction(player, map) {
  const { col, row } = facingTile(player)
  if (!inBounds(map, col, row)) return null

  const w = wandererAt(map.wanderers, col, row)
  if (w) {
    w.dir = FACE_PLAYER[player.dir] // turn toward the player
    w.frameCol = 1
    return { kind: 'dialogue', name: w.id, lines: w.lines, thenModal: w.thenModal }
  }

  const id = map.interaction[row][col]
  if (!id) return null
  return map.actions[id] || null
}

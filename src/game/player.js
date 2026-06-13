// Player state + grid-snapped movement with smooth lerp between tiles.

import { TILE, MOVE_MS, DIR } from './constants.js'

const DELTA = {
  [DIR.UP]: [0, -1],
  [DIR.DOWN]: [0, 1],
  [DIR.LEFT]: [-1, 0],
  [DIR.RIGHT]: [1, 0],
}

export function createPlayer(spawn) {
  const player = {
    col: 0,
    row: 0,
    dir: DIR.DOWN,
    moving: false,
    progress: 0,
    fromCol: 0,
    fromRow: 0,
    stepToggle: false,
    // derived render fields (updated each frame)
    pixelX: 0,
    pixelY: 0,
    frameCol: 1, // idle frame
  }
  placePlayer(player, spawn)
  return player
}

// Snap the player to a spawn point (map entry / warp arrival).
export function placePlayer(player, { col, row, dir = DIR.DOWN }) {
  player.col = player.fromCol = col
  player.row = player.fromRow = row
  player.dir = dir
  player.moving = false
  player.progress = 0
  player.pixelX = col * TILE
  player.pixelY = row * TILE
  player.frameCol = 1
}

// Advance the player. `wantDir` is the currently-held direction (or null);
// `isBlocked(c, r)` covers map bounds + collision plus dynamic occupants.
// Returns nothing; mutates player + writes derived render fields.
export function updatePlayer(player, dt, wantDir, isBlocked) {
  if (player.moving) {
    player.progress += dt / MOVE_MS
    if (player.progress >= 1) {
      // arrive
      player.progress = 0
      player.moving = false
      player.fromCol = player.col
      player.fromRow = player.row
      player.stepToggle = !player.stepToggle
    }
  }

  if (!player.moving && wantDir != null) {
    player.dir = wantDir
    const [dc, dr] = DELTA[wantDir]
    const tc = player.col + dc
    const tr = player.row + dr
    if (!isBlocked(tc, tr)) {
      player.fromCol = player.col
      player.fromRow = player.row
      player.col = tc
      player.row = tr
      player.moving = true
      player.progress = 0
    }
  }

  // derived render position
  if (player.moving) {
    const cx = player.fromCol + (player.col - player.fromCol) * player.progress
    const cy = player.fromRow + (player.row - player.fromRow) * player.progress
    player.pixelX = cx * TILE
    player.pixelY = cy * TILE
    // walk frame: alternate stepping foot per tile, swap mid-tile
    const stepFoot = player.progress < 0.5 ? player.stepToggle : !player.stepToggle
    player.frameCol = stepFoot ? 0 : 2
  } else {
    player.pixelX = player.col * TILE
    player.pixelY = player.row * TILE
    player.frameCol = 1 // idle
  }
}

export function facingTile(player) {
  const [dc, dr] = DELTA[player.dir]
  return { col: player.col + dc, row: player.row + dr }
}

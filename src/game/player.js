// Player state + grid-snapped movement with smooth lerp between tiles.

import { TILE, MAP_W, MAP_H, MOVE_MS, DIR } from './constants.js'
import { SPAWN } from './mapData.js'

const DELTA = {
  [DIR.UP]: [0, -1],
  [DIR.DOWN]: [0, 1],
  [DIR.LEFT]: [-1, 0],
  [DIR.RIGHT]: [1, 0],
}

export function createPlayer() {
  return {
    col: SPAWN.col,
    row: SPAWN.row,
    dir: DIR.DOWN,
    moving: false,
    progress: 0,
    fromCol: SPAWN.col,
    fromRow: SPAWN.row,
    stepToggle: false,
    // derived render fields (updated each frame)
    pixelX: SPAWN.col * TILE,
    pixelY: SPAWN.row * TILE,
    frameCol: 1, // idle frame
  }
}

function canWalk(collision, c, r) {
  if (c < 0 || r < 0 || c >= MAP_W || r >= MAP_H) return false
  return collision[r][c] === 0
}

// Advance the player. `wantDir` is the currently-held direction (or null).
// Returns nothing; mutates player + writes derived render fields.
export function updatePlayer(player, dt, wantDir, collision) {
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
    if (canWalk(collision, tc, tr)) {
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

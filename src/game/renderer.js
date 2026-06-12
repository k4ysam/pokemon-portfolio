// Canvas renderer. Draws the pre-rendered town background, y-sorts NPCs and
// the player on top, then re-draws foreground patches of the background (the
// elevated welcome sign) so sprites pass behind them.

import { TILE, MAP_W, MAP_H, CHAR_W, CHAR_H, CHAR_SCALE } from './constants.js'
import { FOREGROUND_RECTS } from './mapData.js'
import { OBJ_RECTS } from './objectAtlas.js'

// Draw a CHAR_W x CHAR_H character frame scaled by CHAR_SCALE, centred on a
// tile with feet at the tile's bottom edge.
function drawChar(ctx, sheet, frameCol, frameRow, px, py) {
  const dw = CHAR_W * CHAR_SCALE
  const dh = CHAR_H * CHAR_SCALE
  const dx = px + (TILE - dw) / 2
  const dy = py + TILE - dh
  ctx.drawImage(sheet, frameCol * CHAR_W, frameRow * CHAR_H, CHAR_W, CHAR_H, dx, dy, dw, dh)
}

export function drawScene(ctx, assets, state) {
  const { bg, player: playerSheet, npcs: npcSheet, objects: objSheet } = assets
  const { map, player, npcs, facingTarget, showCollision } = state

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(bg, 0, 0)

  // --- y-sorted sprites ---
  const drawables = []
  for (const npc of npcs) {
    const px = npc.col * TILE
    const py = npc.row * TILE
    drawables.push({ baseY: py + TILE, draw: () => drawChar(ctx, npcSheet, npc.sprite, 0, px, py) })
  }
  drawables.push({
    baseY: player.pixelY + TILE + 0.5, // tie-break so the player sits in front on a shared row
    draw: () => drawChar(ctx, playerSheet, player.frameCol, player.dir, player.pixelX, player.pixelY),
  })
  drawables.sort((a, b) => a.baseY - b.baseY)
  for (const d of drawables) d.draw()

  // --- foreground: background patches the player walks behind ---
  for (const [x, y, w, h] of FOREGROUND_RECTS) {
    ctx.drawImage(bg, x, y, w, h, x, y, w, h)
  }

  // --- "!" interaction indicator (HGSS emote bubble) above the player ---
  if (facingTarget) {
    const [sx, sy, sw, sh] = OBJ_RECTS.emote_excl
    const dw = sw * CHAR_SCALE
    const dh = sh * CHAR_SCALE
    const bx = player.pixelX + ((TILE - dw) / 2 | 0)
    const by = player.pixelY + TILE - CHAR_H * CHAR_SCALE - dh + 4
    ctx.drawImage(objSheet, sx, sy, sw, sh, bx, by, dw, dh)
  }

  // --- debug: hold "c" to tint blocked tiles ---
  if (showCollision) {
    ctx.fillStyle = 'rgba(255,0,0,0.35)'
    for (let r = 0; r < MAP_H; r++) {
      for (let c = 0; c < MAP_W; c++) {
        if (map.collision[r][c]) ctx.fillRect(c * TILE, r * TILE, TILE, TILE)
      }
    }
  }
}

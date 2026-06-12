// Canvas renderer. Draws the pre-rendered town background, y-sorts NPCs and
// the player on top, then re-draws foreground patches of the background (the
// elevated welcome sign) so sprites pass behind them.

import { TILE, MAP_W, MAP_H, CHAR_W, CHAR_H, POKE_W, POKE_H, CHAR_SCALE } from './constants.js'
import { FOREGROUND_RECTS } from './mapData.js'
import { OBJ_RECTS } from './objectAtlas.js'

// Draw one cw x ch frame from a walk sheet (3-column blocks per sprite, one
// row per direction), scaled by CHAR_SCALE and centred on a tile with feet at
// the tile's bottom edge.
function drawChar(ctx, sheet, block, frameCol, dirRow, px, py, cw = CHAR_W, ch = CHAR_H) {
  const dw = cw * CHAR_SCALE
  const dh = ch * CHAR_SCALE
  const dx = px + (TILE - dw) / 2
  const dy = py + TILE - dh
  ctx.drawImage(sheet, (block * 3 + frameCol) * cw, dirRow * ch, cw, ch, dx, dy, dw, dh)
}

export function drawScene(ctx, assets, state) {
  const { bg, player: playerSheet, npcs: npcSheet, pokemon: pokeSheet, objects: objSheet } = assets
  const { map, player, wanderers, facingTarget, showCollision } = state

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(bg, 0, 0)

  // --- y-sorted sprites ---
  const drawables = []
  for (const w of wanderers) {
    const sheet = w.kind === 'mon' ? pokeSheet : npcSheet
    const [cw, ch] = w.kind === 'mon' ? [POKE_W, POKE_H] : [CHAR_W, CHAR_H]
    drawables.push({
      baseY: w.pixelY + TILE,
      draw: () => drawChar(ctx, sheet, w.sprite, w.frameCol, w.dir, w.pixelX, w.pixelY, cw, ch),
    })
  }
  drawables.push({
    baseY: player.pixelY + TILE + 0.5, // tie-break so the player sits in front on a shared row
    draw: () => drawChar(ctx, playerSheet, 0, player.frameCol, player.dir, player.pixelX, player.pixelY),
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

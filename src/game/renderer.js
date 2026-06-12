// Canvas renderer. Draws the ground layer flat, then y-sorts tall tiles,
// building/tree objects, NPCs and the player so things higher on the map render
// behind and things lower render in front.

import {
  TILE,
  MAP_W,
  MAP_H,
  TILESET_COLS,
  T,
  FLOOR_TILES,
  CHAR_W,
  CHAR_H,
} from './constants.js'
import { OBJ_RECTS } from './objectAtlas.js'

function drawTile(ctx, tileset, id, dx, dy) {
  const sx = (id % TILESET_COLS) * TILE
  const sy = ((id / TILESET_COLS) | 0) * TILE
  ctx.drawImage(tileset, sx, sy, TILE, TILE, dx, dy, TILE, TILE)
}

// Draw a multi-tile object (building / tree) so its base sits at (col,row+h).
function drawObject(ctx, sheet, o) {
  const [sx, sy, sw, sh] = OBJ_RECTS[o.key]
  const dx = o.col * TILE
  const dy = (o.row + o.h) * TILE - sh
  ctx.drawImage(sheet, sx, sy, sw, sh, dx, dy, sw, sh)
}

// Draw a CHAR_W x CHAR_H character frame centred on a tile with feet at the
// tile's bottom edge.
function drawChar(ctx, sheet, frameCol, frameRow, px, py) {
  const dx = px + (TILE - CHAR_W) / 2
  const dy = py + TILE - CHAR_H
  ctx.drawImage(sheet, frameCol * CHAR_W, frameRow * CHAR_H, CHAR_W, CHAR_H, dx, dy, CHAR_W, CHAR_H)
}

export function drawScene(ctx, assets, state) {
  const { tileset, objects: objSheet, player: playerSheet, npcs: npcSheet } = assets
  const { map, player, npcs, facingTarget } = state

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, MAP_W * TILE, MAP_H * TILE)

  // --- ground pass: floor tiles flat; grass under every tall tile ---
  for (let r = 0; r < MAP_H; r++) {
    for (let c = 0; c < MAP_W; c++) {
      const id = map.ground[r][c]
      drawTile(ctx, tileset, FLOOR_TILES.has(id) ? id : T.GRASS, c * TILE, r * TILE)
    }
  }

  // --- collect y-sorted drawables ---
  const drawables = []

  // tall single tiles (treetops, bushes, rocks, fences, sign)
  for (let r = 0; r < MAP_H; r++) {
    for (let c = 0; c < MAP_W; c++) {
      const id = map.ground[r][c]
      if (FLOOR_TILES.has(id)) continue
      drawables.push({
        baseY: r * TILE + TILE,
        draw: () => drawTile(ctx, tileset, id, c * TILE, r * TILE),
      })
    }
  }

  // building / tree objects
  for (const o of map.objects) {
    drawables.push({ baseY: (o.row + o.h) * TILE, draw: () => drawObject(ctx, objSheet, o) })
  }

  // npcs (down-facing idle frame; one CHAR_W cell each in npcs.png)
  for (const npc of npcs) {
    const px = npc.col * TILE
    const py = npc.row * TILE
    drawables.push({ baseY: py + TILE, draw: () => drawChar(ctx, npcSheet, npc.sprite, 0, px, py) })
  }

  // player
  {
    const px = player.pixelX
    const py = player.pixelY
    drawables.push({
      baseY: py + TILE + 0.5, // tie-break so the player sits in front on a shared row
      draw: () => drawChar(ctx, playerSheet, player.frameCol, player.dir, px, py),
    })
  }

  drawables.sort((a, b) => a.baseY - b.baseY)
  for (const d of drawables) d.draw()

  // --- "!" interaction indicator (HGSS emote bubble) above the player ---
  if (facingTarget) {
    const [sx, sy, sw, sh] = OBJ_RECTS.emote_excl
    const bx = player.pixelX + ((TILE - sw) / 2 | 0)
    const by = player.pixelY - CHAR_H + 6
    ctx.drawImage(objSheet, sx, sy, sw, sh, bx, by, sw, sh)
  }
}

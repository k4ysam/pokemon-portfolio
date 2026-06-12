// Canvas renderer. Draws the ground layer flat, then y-sorts tall tiles + NPCs +
// player so things above render behind and things below render in front.

import { TILE, MAP_W, MAP_H, TILESET_COLS, T, FLOOR_TILES } from './constants.js'

function tileSrc(id) {
  return { sx: (id % TILESET_COLS) * TILE, sy: ((id / TILESET_COLS) | 0) * TILE }
}

function drawTile(ctx, tileset, id, dx, dy) {
  const { sx, sy } = tileSrc(id)
  ctx.drawImage(tileset, sx, sy, TILE, TILE, dx, dy, TILE, TILE)
}

// Draw a 16x24 character frame so its feet sit at the bottom of tile (col,row).
function drawChar(ctx, sheet, frameCol, frameRow, px, py, fw = 16, fh = 24) {
  ctx.drawImage(sheet, frameCol * fw, frameRow * fh, fw, fh, px, py - (fh - TILE), fw, fh)
}

export function drawScene(ctx, assets, state) {
  const { tileset, player: playerSheet, npcs: npcSheet } = assets
  const { map, player, npcs, facingTarget } = state

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, MAP_W * TILE, MAP_H * TILE)

  // --- ground pass ---
  for (let r = 0; r < MAP_H; r++) {
    for (let c = 0; c < MAP_W; c++) {
      const id = map.ground[r][c]
      if (FLOOR_TILES.has(id)) {
        drawTile(ctx, tileset, id, c * TILE, r * TILE)
      } else {
        // grass under every tall object so there are no holes
        drawTile(ctx, tileset, T.GRASS, c * TILE, r * TILE)
      }
    }
  }

  // --- collect y-sorted drawables ---
  const drawables = []

  // tall tiles
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

  // npcs (down-facing idle frames in npcs.png, 16x24)
  for (const npc of npcs) {
    const px = npc.col * TILE
    const py = npc.row * TILE
    drawables.push({
      baseY: py + TILE,
      draw: () => drawChar(ctx, npcSheet, npc.sprite, 0, px, py),
    })
  }

  // player
  {
    const px = player.pixelX
    const py = player.pixelY
    drawables.push({
      baseY: py + TILE + 0.5, // tie-break so player sits in front on same row
      draw: () => drawChar(ctx, playerSheet, player.frameCol, player.dir, px, py),
    })
  }

  drawables.sort((a, b) => a.baseY - b.baseY)
  for (const d of drawables) d.draw()

  // --- "!" interaction indicator above the player ---
  if (facingTarget) {
    const bx = player.pixelX + 5
    const by = player.pixelY - 14
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(bx, by, 6, 8)
    ctx.fillStyle = '#e23b3b'
    ctx.fillRect(bx + 2, by + 1, 2, 4)
    ctx.fillRect(bx + 2, by + 6, 2, 2)
  }
}

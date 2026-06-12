import { useEffect, useRef } from 'react'
import { MAP_W, MAP_H, TILE } from './constants.js'
import { mapData } from './mapData.js'
import { NPCS } from './npc.js'
import { createPlayer, updatePlayer } from './player.js'
import { facingInteractable, resolveInteraction } from './interaction.js'
import { currentDir } from './input.js'
import { drawScene } from './renderer.js'
import { createGameLoop, loadImage } from './gameLoop.js'

const BASE_W = MAP_W * TILE // 320
const BASE_H = MAP_H * TILE // 240

// GameCanvas owns the canvas + render loop. `pausedRef` halts player updates
// while UI overlays are open. `engineRef` is populated so the parent can query
// the facing interaction when the action key is pressed.
export default function GameCanvas({ pausedRef, engineRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    canvas.width = BASE_W
    canvas.height = BASE_H

    const player = createPlayer()

    // expose interaction querying to the parent
    if (engineRef) {
      engineRef.current = {
        resolveFacing: () => resolveInteraction(player, mapData),
        player,
      }
    }

    let assets = null
    let disposed = false
    const loop = createGameLoop((dt) => {
      if (!assets) return
      const paused = pausedRef?.current
      const wantDir = paused ? null : currentDir()
      updatePlayer(player, dt, wantDir, mapData.collision)
      const facingTarget = !paused && !player.moving && facingInteractable(player, mapData)
      drawScene(ctx, assets, { map: mapData, player, npcs: NPCS, facingTarget })
    })

    Promise.all([
      loadImage('assets/tileset.png'),
      loadImage('assets/player.png'),
      loadImage('assets/npcs.png'),
    ]).then(([tileset, playerSheet, npcSheet]) => {
      if (disposed) return
      assets = { tileset, player: playerSheet, npcs: npcSheet }
      loop.start()
    })

    // --- responsive scaling: contain 4:3 in the viewport, integer-crisp ---
    function resize() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const scale = Math.min(vw / BASE_W, vh / BASE_H)
      canvas.style.width = `${Math.round(BASE_W * scale)}px`
      canvas.style.height = `${Math.round(BASE_H * scale)}px`
    }
    resize()
    window.addEventListener('resize', resize)

    return () => {
      disposed = true
      loop.stop()
      window.removeEventListener('resize', resize)
    }
  }, [pausedRef, engineRef])

  return <canvas ref={canvasRef} className="game-canvas" />
}

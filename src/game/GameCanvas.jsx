import { useEffect, useRef } from 'react'
import { MAP_W, MAP_H, TILE } from './constants.js'
import { mapData } from './mapData.js'
import { NPCS } from './npc.js'
import { createPlayer, updatePlayer } from './player.js'
import { facingInteractable, resolveInteraction } from './interaction.js'
import { currentDir } from './input.js'
import { drawScene } from './renderer.js'
import { createGameLoop, loadImage } from './gameLoop.js'

const BASE_W = MAP_W * TILE // 800
const BASE_H = MAP_H * TILE // 640
const ASSET_VERSION = 7

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
    let showCollision = false // hold "c" to inspect the collision grid
    const onDebugKey = (e) => {
      if (e.key === 'c' || e.key === 'C') showCollision = e.type === 'keydown'
    }
    window.addEventListener('keydown', onDebugKey)
    window.addEventListener('keyup', onDebugKey)

    const loop = createGameLoop((dt) => {
      if (!assets) return
      const paused = pausedRef?.current
      const wantDir = paused ? null : currentDir()
      updatePlayer(player, dt, wantDir, mapData.collision)
      const facingTarget = !paused && !player.moving && facingInteractable(player, mapData)
      drawScene(ctx, assets, { map: mapData, player, npcs: NPCS, facingTarget, showCollision })
    })

    // ?v= busts the browser cache whenever the assets change.
    Promise.all([
      loadImage(`assets/town-bg.png?v=${ASSET_VERSION}`),
      loadImage(`assets/objects.png?v=${ASSET_VERSION}`),
      loadImage(`assets/player.png?v=${ASSET_VERSION}`),
      loadImage(`assets/npcs.png?v=${ASSET_VERSION}`),
    ]).then(([bg, objects, playerSheet, npcSheet]) => {
      if (disposed) return
      assets = { bg, objects, player: playerSheet, npcs: npcSheet }
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
      window.removeEventListener('keydown', onDebugKey)
      window.removeEventListener('keyup', onDebugKey)
    }
  }, [pausedRef, engineRef])

  return <canvas ref={canvasRef} className="game-canvas" />
}

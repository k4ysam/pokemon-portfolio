import { useEffect, useRef } from 'react'
import { MAP_W, MAP_H, TILE } from './constants.js'
import { mapData } from './mapData.js'
import { WANDERERS } from './npc.js'
import { updateWanderer, occupies } from './wander.js'
import { createPlayer, updatePlayer } from './player.js'
import { facingInteractable, resolveInteraction } from './interaction.js'
import { currentDir } from './input.js'
import { drawScene } from './renderer.js'
import { createGameLoop, loadImage } from './gameLoop.js'

const BASE_W = MAP_W * TILE // 800
const BASE_H = MAP_H * TILE // 640
const ASSET_VERSION = 8

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
    // test/debug handle (read-only) for E2E scripts
    window.__game = { player, wanderers: WANDERERS }

    let assets = null
    let disposed = false
    let showCollision = false // hold "c" to inspect the collision grid
    const onDebugKey = (e) => {
      if (e.key === 'c' || e.key === 'C') showCollision = e.type === 'keydown'
    }
    window.addEventListener('keydown', onDebugKey)
    window.addEventListener('keyup', onDebugKey)

    // map collision + every wanderer (their current and target tiles)
    const blockedForPlayer = (c, r) =>
      mapData.collision[r][c] === 1 || WANDERERS.some((w) => occupies(w, c, r))
    // same for a wanderer: the map, the player, and the other wanderers
    const blockedFor = (self) => (c, r) =>
      mapData.collision[r][c] === 1 ||
      occupies(player, c, r) ||
      WANDERERS.some((w) => w !== self && occupies(w, c, r))

    const loop = createGameLoop((dt) => {
      if (!assets) return
      const paused = pausedRef?.current
      const wantDir = paused ? null : currentDir()
      updatePlayer(player, dt, wantDir, blockedForPlayer)
      if (!paused) {
        for (const w of WANDERERS) updateWanderer(w, dt, blockedFor(w))
      }
      const facingTarget = !paused && !player.moving && facingInteractable(player, mapData)
      drawScene(ctx, assets, { map: mapData, player, wanderers: WANDERERS, facingTarget, showCollision })
    })

    // ?v= busts the browser cache whenever the assets change.
    Promise.all([
      loadImage(`assets/town-bg.png?v=${ASSET_VERSION}`),
      loadImage(`assets/objects.png?v=${ASSET_VERSION}`),
      loadImage(`assets/player.png?v=${ASSET_VERSION}`),
      loadImage(`assets/npcs.png?v=${ASSET_VERSION}`),
      loadImage(`assets/pokemon.png?v=${ASSET_VERSION}`),
    ]).then(([bg, objects, playerSheet, npcSheet, pokeSheet]) => {
      if (disposed) return
      assets = { bg, objects, player: playerSheet, npcs: npcSheet, pokemon: pokeSheet }
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

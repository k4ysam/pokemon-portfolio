import { useEffect, useRef } from 'react'
import { TILE } from './constants.js'
import { getMap, ALL_MAPS } from './maps/index.js'
import { updateWanderer, occupies } from './wander.js'
import { createPlayer, updatePlayer, placePlayer } from './player.js'
import { facingInteractable, resolveInteraction } from './interaction.js'
import { currentDir, clearHeld } from './input.js'
import { drawScene } from './renderer.js'
import { createGameLoop, loadImage } from './gameLoop.js'

const ASSET_VERSION = 10
// Camera viewport: ~13 tiles visible vertically so the view stays zoomed in
// on the player. The zoom never goes past the current map's edges, so every
// map always covers the whole screen (smaller maps just zoom in further).
const VIEW_TILES_Y = 13

// GameCanvas owns the canvas + render loop. `pausedRef` halts player updates
// while UI overlays are open. `engineRef` is populated so the parent can query
// the facing interaction when the action key is pressed and execute warps.
// `onWarpRef.current(action)` fires when the player steps onto a warp tile
// (e.g. an interior exit mat).
export default function GameCanvas({ pausedRef, engineRef, onWarpRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })

    let map = getMap('town')
    const player = createPlayer(map.spawns.default)
    // step-on triggers fire on arrival at a *new* tile, never on spawn
    let lastCol = player.col
    let lastRow = player.row

    function warpTo(mapId, spawnName) {
      map = getMap(mapId)
      const spawn = map.spawns[spawnName] || map.spawns.default
      placePlayer(player, spawn)
      lastCol = player.col
      lastRow = player.row
      clearHeld()
      resize() // viewport zoom limits depend on the map size
    }

    // expose interaction querying + warps to the parent
    if (engineRef) {
      engineRef.current = {
        resolveFacing: () => resolveInteraction(player, map),
        warpTo,
        player,
      }
    }
    // test/debug handle (read-only) for E2E scripts
    window.__game = {
      player,
      warpTo,
      get map() {
        return map
      },
      get mapId() {
        return map.id
      },
      get wanderers() {
        return map.wanderers
      },
    }

    let assets = null
    let disposed = false
    let showCollision = false // hold "c" to inspect the collision grid
    const onDebugKey = (e) => {
      if (e.key === 'c' || e.key === 'C') showCollision = e.type === 'keydown'
    }
    window.addEventListener('keydown', onDebugKey)
    window.addEventListener('keyup', onDebugKey)

    // map bounds + collision + every wanderer (their current and target tiles)
    const blockedForPlayer = (c, r) =>
      c < 0 ||
      r < 0 ||
      c >= map.cols ||
      r >= map.rows ||
      map.collision[r][c] === 1 ||
      map.wanderers.some((w) => occupies(w, c, r))
    // same for a wanderer: the map, the player, and the other wanderers
    const blockedFor = (self) => (c, r) =>
      map.collision[r][c] === 1 ||
      occupies(player, c, r) ||
      map.wanderers.some((w) => w !== self && occupies(w, c, r))

    const loop = createGameLoop((dt) => {
      if (!assets) return
      const paused = pausedRef?.current
      const wantDir = paused ? null : currentDir()
      updatePlayer(player, dt, wantDir, blockedForPlayer)
      if (!paused) {
        for (const w of map.wanderers) updateWanderer(w, dt, blockedFor(w))
      }

      // step-on triggers: fire once when the player arrives on a new tile
      if (!paused && !player.moving && (player.col !== lastCol || player.row !== lastRow)) {
        lastCol = player.col
        lastRow = player.row
        const act = map.actions[map.interaction[player.row][player.col]]
        if (act?.kind === 'warp' && act.onStep) onWarpRef?.current?.(act)
      }

      const facingTarget = !paused && !player.moving && facingInteractable(player, map)
      // camera: centre on the player, clamped to the map edges
      const mapW = map.cols * TILE
      const mapH = map.rows * TILE
      const camX = Math.round(
        Math.max(0, Math.min(player.pixelX + TILE / 2 - canvas.width / 2, mapW - canvas.width))
      )
      const camY = Math.round(
        Math.max(0, Math.min(player.pixelY + TILE / 2 - canvas.height / 2, mapH - canvas.height))
      )
      drawScene(ctx, assets, { map, player, facingTarget, showCollision, camX, camY })
    })

    // ?v= busts the browser cache whenever the assets change.
    Promise.all([
      Promise.all(ALL_MAPS.map((m) => loadImage(`${m.bgSrc}?v=${ASSET_VERSION}`))),
      loadImage(`assets/objects.png?v=${ASSET_VERSION}`),
      loadImage(`assets/player.png?v=${ASSET_VERSION}`),
      loadImage(`assets/npcs.png?v=${ASSET_VERSION}`),
      loadImage(`assets/pokemon.png?v=${ASSET_VERSION}`),
    ]).then(([bgImages, objects, playerSheet, npcSheet, pokeSheet]) => {
      if (disposed) return
      const bgs = {}
      ALL_MAPS.forEach((m, i) => {
        bgs[m.id] = bgImages[i]
      })
      assets = { bgs, objects, player: playerSheet, npcs: npcSheet, pokemon: pokeSheet }
      loop.start()
    })

    // --- responsive scaling: zoomed camera viewport that fills the window ---
    // The canvas backing store is the visible slice of the map in world px;
    // CSS stretches it to 100% of the fullscreen stage. The zoom shows
    // VIEW_TILES_Y tiles vertically but never zooms out past the current
    // map's edges, so the map always covers the whole screen.
    function resize() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const mapW = map.cols * TILE
      const mapH = map.rows * TILE
      const scale = Math.max(vh / (VIEW_TILES_Y * TILE), vw / mapW, vh / mapH)
      canvas.width = Math.min(Math.round(vw / scale), mapW)
      canvas.height = Math.min(Math.round(vh / scale), mapH)
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
  }, [pausedRef, engineRef, onWarpRef])

  return <canvas ref={canvasRef} className="game-canvas" />
}

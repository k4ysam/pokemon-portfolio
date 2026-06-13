// Wandering entities (NPCs + Pokemon): grid-snapped random walks with the
// same tile lerp as the player. Each wanderer stays inside its `zone` rect
// and re-rolls an action (step or just turn) after a random cooldown.

import { TILE, DIR } from './constants.js'

const DELTA = {
  [DIR.UP]: [0, -1],
  [DIR.DOWN]: [0, 1],
  [DIR.LEFT]: [-1, 0],
  [DIR.RIGHT]: [1, 0],
}
const DIRS = [DIR.DOWN, DIR.UP, DIR.LEFT, DIR.RIGHT]

export function createWanderer(def) {
  return {
    ...def,
    dir: def.dir ?? DIR.DOWN,
    moving: false,
    progress: 0,
    fromCol: def.col,
    fromRow: def.row,
    stepToggle: false,
    cooldown: 500 + Math.random() * 2000,
    pixelX: def.col * TILE,
    pixelY: def.row * TILE,
    frameCol: 1, // idle frame
  }
}

// Advance one wanderer. `isBlocked(c, r)` must already account for the map,
// the player and the other wanderers. Static wanderers (e.g. the nurse behind
// her counter) never roll a step — they only turn when spoken to.
export function updateWanderer(e, dt, isBlocked) {
  if (e.static) return
  if (e.moving) {
    e.progress += dt / e.moveMs
    if (e.progress >= 1) {
      e.progress = 0
      e.moving = false
      e.fromCol = e.col
      e.fromRow = e.row
      e.stepToggle = !e.stepToggle
    }
  } else {
    e.cooldown -= dt
    if (e.cooldown <= 0) {
      e.cooldown = 800 + Math.random() * 2200
      const dir = DIRS[(Math.random() * 4) | 0]
      e.dir = dir // turn even when the step is refused
      if (Math.random() < 0.75) {
        const [dc, dr] = DELTA[dir]
        const tc = e.col + dc
        const tr = e.row + dr
        const z = e.zone
        if (tc >= z.c0 && tc <= z.c1 && tr >= z.r0 && tr <= z.r1 && !isBlocked(tc, tr)) {
          e.fromCol = e.col
          e.fromRow = e.row
          e.col = tc
          e.row = tr
          e.moving = true
          e.progress = 0
        }
      }
    }
  }

  // derived render position + walk frame (mirrors player.js)
  if (e.moving) {
    const cx = e.fromCol + (e.col - e.fromCol) * e.progress
    const cy = e.fromRow + (e.row - e.fromRow) * e.progress
    e.pixelX = cx * TILE
    e.pixelY = cy * TILE
    const stepFoot = e.progress < 0.5 ? e.stepToggle : !e.stepToggle
    e.frameCol = stepFoot ? 0 : 2
  } else {
    e.pixelX = e.col * TILE
    e.pixelY = e.row * TILE
    e.frameCol = 1
  }
}

// Does the wanderer currently occupy (or move between) this tile?
export function occupies(e, c, r) {
  return (e.col === c && e.row === r) || (e.moving && e.fromCol === c && e.fromRow === r)
}

// Which of `wanderers` is on (or moving through) this tile, if any?
export function wandererAt(wanderers, col, row) {
  return wanderers.find((w) => occupies(w, col, row)) || null
}

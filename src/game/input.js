// Global input: held directions (polled by the game loop) + action/close events
// (consumed by the React UI router). Keyboard + virtual D-pad feed the same state.

import { DIR } from './constants.js'

const held = { up: false, down: false, left: false, right: false }
const actionListeners = new Set()
const closeListeners = new Set()
// order tracks most-recently-pressed direction so diagonal taps feel responsive
let order = []

function press(dirName) {
  if (!held[dirName]) {
    held[dirName] = true
    order = order.filter((d) => d !== dirName)
    order.push(dirName)
  }
}
function release(dirName) {
  held[dirName] = false
  order = order.filter((d) => d !== dirName)
}

const KEY_DIR = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
}
const ACTION_CODES = new Set(['Space', 'Enter', 'KeyZ'])
const CLOSE_CODES = new Set(['Escape', 'KeyX'])

function onKeyDown(e) {
  if (KEY_DIR[e.code]) {
    press(KEY_DIR[e.code])
    e.preventDefault()
  } else if (ACTION_CODES.has(e.code)) {
    if (!e.repeat) actionListeners.forEach((cb) => cb())
    e.preventDefault()
  } else if (CLOSE_CODES.has(e.code)) {
    if (!e.repeat) closeListeners.forEach((cb) => cb())
    e.preventDefault()
  }
}
function onKeyUp(e) {
  if (KEY_DIR[e.code]) release(KEY_DIR[e.code])
}

let attached = false
export function attachInput() {
  if (attached) return
  attached = true
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
}
export function detachInput() {
  attached = false
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
}

// Most-recently-pressed held direction → DIR enum, or null.
export function currentDir() {
  const d = order[order.length - 1]
  if (d === 'up') return DIR.UP
  if (d === 'down') return DIR.DOWN
  if (d === 'left') return DIR.LEFT
  if (d === 'right') return DIR.RIGHT
  return null
}

// --- D-pad / touch hooks ---
export function setDir(dirName, isDown) {
  if (isDown) press(dirName)
  else release(dirName)
}
export function fireAction() {
  actionListeners.forEach((cb) => cb())
}
export function fireClose() {
  closeListeners.forEach((cb) => cb())
}
export function clearHeld() {
  for (const k of Object.keys(held)) held[k] = false
  order = []
}

// --- subscriptions for the UI router ---
export function onAction(cb) {
  actionListeners.add(cb)
  return () => actionListeners.delete(cb)
}
export function onClose(cb) {
  closeListeners.add(cb)
  return () => closeListeners.delete(cb)
}

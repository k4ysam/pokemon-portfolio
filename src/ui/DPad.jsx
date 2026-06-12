import { useEffect, useState } from 'react'
import { setDir, fireAction, fireClose } from '../game/input.js'

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.('(pointer: coarse)').matches
  )
}

// Virtual controls for touch devices. Feeds the same input module as the keyboard.
export default function DPad() {
  const [show, setShow] = useState(false)
  useEffect(() => setShow(isTouchDevice()), [])
  if (!show) return null

  // press/release helpers that prevent the default touch behaviours (scroll/zoom)
  const dirHandlers = (name) => ({
    onPointerDown: (e) => {
      e.preventDefault()
      setDir(name, true)
    },
    onPointerUp: (e) => {
      e.preventDefault()
      setDir(name, false)
    },
    onPointerLeave: () => setDir(name, false),
    onPointerCancel: () => setDir(name, false),
  })

  return (
    <div className="dpad-layer">
      <div className="dpad">
        <button className="dpad-btn dpad-up" {...dirHandlers('up')} aria-label="up">
          ▲
        </button>
        <button className="dpad-btn dpad-left" {...dirHandlers('left')} aria-label="left">
          ◀
        </button>
        <button className="dpad-btn dpad-right" {...dirHandlers('right')} aria-label="right">
          ▶
        </button>
        <button className="dpad-btn dpad-down" {...dirHandlers('down')} aria-label="down">
          ▼
        </button>
        <span className="dpad-center" />
      </div>
      <div className="action-cluster">
        <button
          className="btn-b"
          onPointerDown={(e) => {
            e.preventDefault()
            fireClose()
          }}
          aria-label="back"
        >
          B
        </button>
        <button
          className="btn-a"
          onPointerDown={(e) => {
            e.preventDefault()
            fireAction()
          }}
          aria-label="action"
        >
          A
        </button>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import GameCanvas from './game/GameCanvas.jsx'
import DialogueBox from './ui/DialogueBox.jsx'
import ContentModal from './ui/ContentModal.jsx'
import DPad from './ui/DPad.jsx'
import IntroSequence from './ui/IntroSequence.jsx'
import { CONTENT } from './content/index.js'
import { attachInput, onAction, onClose, clearHeld } from './game/input.js'
import { MAP_W, MAP_H, TILE } from './game/constants.js'

const BASE_W = MAP_W * TILE
const BASE_H = MAP_H * TILE

// Building label signs — centered over each building's roof (tile coords).
const LABELS = [
  { text: 'HOME', cx: 3.5, top: 2 },
  { text: 'LAB', cx: 9.5, top: 2 },
  { text: 'GYM', cx: 15.5, top: 2 },
  { text: 'CONTACT', cx: 4.5, top: 8 },
  { text: 'LINKS', cx: 15.5, top: 8 },
  { text: 'SAMAKSH TOWN', cx: 11, top: 13.1, size: 2.2 },
]

export default function App() {
  const [mode, setMode] = useState('intro') // intro | town | dialogue | modal
  const [dialogue, setDialogue] = useState(null) // { lines }
  const [modalData, setModalData] = useState(null)
  const [advance, setAdvance] = useState(0)
  const [modalClose, setModalClose] = useState(0)
  const [stage, setStage] = useState({ w: BASE_W, h: BASE_H, scale: 1 })

  const pausedRef = useRef(true)
  const engineRef = useRef(null)
  const modeRef = useRef(mode)
  modeRef.current = mode

  // pause the world whenever an overlay is up
  pausedRef.current = mode !== 'town'

  useEffect(() => {
    document.title = 'Samaksh Town — Portfolio'
    attachInput()
  }, [])

  // stage sizing (letterbox-contain, keep 4:3)
  useEffect(() => {
    function resize() {
      const scale = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
      setStage({ w: Math.round(BASE_W * scale), h: Math.round(BASE_H * scale), scale })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // central input router — reads mode via ref to avoid stale closures
  useEffect(() => {
    const offA = onAction(() => {
      const m = modeRef.current
      if (m === 'town') {
        const r = engineRef.current?.resolveFacing()
        if (!r) return
        clearHeld() // avoid the player sliding while a box is open
        if (r.kind === 'modal') {
          setModalData(CONTENT[r.content])
          setMode('modal')
        } else if (r.kind === 'dialogue') {
          setDialogue({ lines: r.lines })
          setMode('dialogue')
        }
      } else if (m === 'dialogue') {
        setAdvance((n) => n + 1)
      }
    })
    const offC = onClose(() => {
      const m = modeRef.current
      if (m === 'dialogue') closeToTown()
      // modal closes through its own fade transition
      else if (m === 'modal') setModalClose((n) => n + 1)
    })
    return () => {
      offA()
      offC()
    }
  }, [])

  function closeToTown() {
    setDialogue(null)
    setModalData(null)
    setMode('town')
  }

  const labelStyle = (cx, top, size = 3.4) => ({
    left: `${((cx * TILE) / BASE_W) * 100}%`,
    top: `${((top * TILE + 1) / BASE_H) * 100}%`,
    fontSize: `${Math.max(4, size * stage.scale)}px`,
  })

  return (
    <div className="app-root">
      <div className="stage" style={{ width: stage.w, height: stage.h }}>
        <GameCanvas pausedRef={pausedRef} engineRef={engineRef} />

        {/* building label signs */}
        {mode !== 'intro' && (
          <div className="label-layer">
            {LABELS.map((l) => (
              <span className="building-label" key={l.text} style={labelStyle(l.cx, l.top, l.size)}>
                {l.text}
              </span>
            ))}
          </div>
        )}

        <div className="crt-overlay" />

        {mode === 'dialogue' && dialogue && (
          <DialogueBox lines={dialogue.lines} advanceSignal={advance} onDone={closeToTown} />
        )}
      </div>

      {mode === 'modal' && modalData && (
        <ContentModal data={modalData} closeSignal={modalClose} onClose={closeToTown} />
      )}

      {mode === 'intro' && <IntroSequence onFinish={() => setMode('town')} />}

      <DPad />
    </div>
  )
}

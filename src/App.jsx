import { useEffect, useRef, useState } from 'react'
import GameCanvas from './game/GameCanvas.jsx'
import DialogueBox from './ui/DialogueBox.jsx'
import ContentModal from './ui/ContentModal.jsx'
import DPad from './ui/DPad.jsx'
import IntroSequence from './ui/IntroSequence.jsx'
import { CONTENT } from './content/index.js'
import { attachInput, onAction, onClose, clearHeld } from './game/input.js'

const WARP_FADE_MS = 320 // keep in sync with .warp-fade transition in index.css

export default function App() {
  const [mode, setMode] = useState('intro') // intro | town | dialogue | modal | warp
  const [dialogue, setDialogue] = useState(null) // { lines, thenModal? }
  const [modalData, setModalData] = useState(null)
  const [advance, setAdvance] = useState(0)
  const [modalClose, setModalClose] = useState(0)
  const [warpFade, setWarpFade] = useState(false)
  const [stage, setStage] = useState({ w: window.innerWidth, h: window.innerHeight, scale: 1 })

  const pausedRef = useRef(true)
  const engineRef = useRef(null)
  const onWarpRef = useRef(null)
  const modeRef = useRef(mode)
  modeRef.current = mode

  // pause the world whenever an overlay is up (or a warp is in flight)
  pausedRef.current = mode !== 'town'

  // Fade to black, swap maps at the midpoint, fade back in.
  function startWarp(action) {
    if (modeRef.current !== 'town') return
    clearHeld()
    setMode('warp')
    setWarpFade(true)
    setTimeout(() => {
      engineRef.current?.warpTo(action.to, action.spawn)
      setWarpFade(false)
      setTimeout(() => setMode('town'), WARP_FADE_MS)
    }, WARP_FADE_MS)
  }
  onWarpRef.current = startWarp // step-on warps (exit mats) from the engine

  useEffect(() => {
    document.title = 'Samaksh Town — Portfolio'
    attachInput()
  }, [])

  // stage sizing — fullscreen; the canvas camera handles zoom/cropping
  useEffect(() => {
    function resize() {
      setStage({ w: window.innerWidth, h: window.innerHeight, scale: 1 })
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
          setDialogue({ lines: r.lines, thenModal: r.thenModal, thenHref: r.thenHref })
          setMode('dialogue')
        } else if (r.kind === 'warp') {
          startWarp(r)
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

  // Dialogue finished: chain into a modal (e.g. the nurse's contact panel)
  // or a link (the counter PC's mailto) when the action asked for it,
  // otherwise back to the map.
  function dialogueDone() {
    const { thenModal, thenHref } = dialogue || {}
    if (thenModal && CONTENT[thenModal]) {
      setDialogue(null)
      setModalData(CONTENT[thenModal])
      setMode('modal')
      return
    }
    if (thenHref) window.location.href = thenHref
    closeToTown()
  }

  return (
    <div className="app-root">
      <div className="stage" style={{ width: stage.w, height: stage.h }}>
        <GameCanvas pausedRef={pausedRef} engineRef={engineRef} onWarpRef={onWarpRef} />

        <div className="crt-overlay" />

        <div className={`warp-fade ${warpFade ? 'warp-fade-on' : ''}`} />

        {mode === 'dialogue' && dialogue && (
          <DialogueBox lines={dialogue.lines} advanceSignal={advance} onDone={dialogueDone} />
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

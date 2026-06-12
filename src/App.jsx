import { useEffect, useRef, useState } from 'react'
import GameCanvas from './game/GameCanvas.jsx'
import DialogueBox from './ui/DialogueBox.jsx'
import ContentModal from './ui/ContentModal.jsx'
import DPad from './ui/DPad.jsx'
import IntroSequence from './ui/IntroSequence.jsx'
import { CONTENT } from './content/index.js'
import { attachInput, onAction, onClose, clearHeld } from './game/input.js'

export default function App() {
  const [mode, setMode] = useState('intro') // intro | town | dialogue | modal
  const [dialogue, setDialogue] = useState(null) // { lines }
  const [modalData, setModalData] = useState(null)
  const [advance, setAdvance] = useState(0)
  const [modalClose, setModalClose] = useState(0)
  const [stage, setStage] = useState({ w: window.innerWidth, h: window.innerHeight, scale: 1 })

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

  return (
    <div className="app-root">
      <div className="stage" style={{ width: stage.w, height: stage.h }}>
        <GameCanvas pausedRef={pausedRef} engineRef={engineRef} />

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

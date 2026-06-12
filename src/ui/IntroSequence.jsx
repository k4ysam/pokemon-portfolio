import { useEffect, useRef, useState } from 'react'
import { onAction } from '../game/input.js'

const CHAR_MS = 45
const MESSAGE = 'Welcome to SAMAKSH TOWN!'

// Opening sequence: black screen -> typewriter greeting -> fade into the town.
export default function IntroSequence({ onFinish }) {
  const [phase, setPhase] = useState('black') // black -> text -> fading
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const finished = useRef(false)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    setPhase('fading')
    setTimeout(() => onFinish?.(), 600)
  }

  // 500ms black, then reveal text
  useEffect(() => {
    const t = setTimeout(() => setPhase('text'), 500)
    return () => clearTimeout(t)
  }, [])

  // typewriter
  useEffect(() => {
    if (phase !== 'text') return
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(MESSAGE.slice(0, i))
      if (i >= MESSAGE.length) {
        clearInterval(id)
        setDone(true)
      }
    }, CHAR_MS)
    return () => clearInterval(id)
  }, [phase])

  // after text done: auto-advance in 2s OR on action press
  useEffect(() => {
    if (!done) return
    const off = onAction(finish)
    const t = setTimeout(finish, 2000)
    return () => {
      off()
      clearTimeout(t)
    }
  }, [done])

  return (
    <div className={`intro-overlay ${phase === 'fading' ? 'intro-fading' : ''}`}>
      {phase !== 'black' && (
        <div className="intro-box">
          <p className="intro-text">{shown}</p>
          {done && <span className="dialogue-arrow">▼</span>}
        </div>
      )}
    </div>
  )
}

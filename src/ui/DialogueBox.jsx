import { useEffect, useRef, useState } from 'react'

const CHAR_MS = 30

// Pokemon-style dialogue box with a typewriter effect.
// `lines` = array of strings shown one at a time.
// `advanceSignal` = increment to advance (reveal-all if typing, else next line).
// `onDone` fires after the last line is advanced.
export default function DialogueBox({ lines, advanceSignal, onDone }) {
  const [lineIdx, setLineIdx] = useState(0)
  const [shown, setShown] = useState('')
  const [typing, setTyping] = useState(true)
  const timer = useRef(null)
  const prevSignal = useRef(advanceSignal)

  // typewriter for the current line
  useEffect(() => {
    const full = lines[lineIdx] ?? ''
    setShown('')
    setTyping(true)
    let i = 0
    timer.current = setInterval(() => {
      i++
      setShown(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(timer.current)
        setTyping(false)
      }
    }, CHAR_MS)
    return () => clearInterval(timer.current)
  }, [lineIdx, lines])

  // respond to advance presses
  useEffect(() => {
    if (advanceSignal === prevSignal.current) return
    prevSignal.current = advanceSignal
    if (typing) {
      // reveal the whole line immediately
      clearInterval(timer.current)
      setShown(lines[lineIdx] ?? '')
      setTyping(false)
    } else if (lineIdx < lines.length - 1) {
      setLineIdx((n) => n + 1)
    } else {
      onDone?.()
    }
  }, [advanceSignal, typing, lineIdx, lines, onDone])

  return (
    <div className="dialogue-box">
      <p className="dialogue-text">{shown}</p>
      {!typing && <span className="dialogue-arrow">▼</span>}
    </div>
  )
}

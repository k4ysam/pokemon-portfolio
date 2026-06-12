import { useEffect, useRef, useState } from 'react'

// Fullscreen building-interior modal with a fade-to-black transition and a
// Pokemon-style pixel border. Closes via Escape (routed by App) or the Back button.
export default function ContentModal({ data, closeSignal, onClose }) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    if (closing) return
    setClosing(true)
    setVisible(false)
    setTimeout(() => onClose?.(), 280) // let the fade play out
  }

  // Escape / B button routed from App. closeSignal is a shared counter that
  // outlives this modal — only react to changes after mount (like DialogueBox),
  // or a reopened modal instantly closes itself.
  const prevClose = useRef(closeSignal)
  useEffect(() => {
    if (closeSignal === prevClose.current) return
    prevClose.current = closeSignal
    handleClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSignal])

  return (
    <div className={`modal-overlay ${visible ? 'modal-visible' : ''}`}>
      <div className="modal-frame">
        <div className="modal-header">
          <span className="modal-subtitle">{data.subtitle}</span>
          <h1 className="modal-title">{data.title}</h1>
        </div>
        <div className="modal-body">
          {data.sections.map((s, i) => (
            <div className="modal-section" key={i}>
              {s.heading && <h2 className="section-heading">{s.heading}</h2>}
              {s.lines.map((ln, j) =>
                s.href && j === 0 ? (
                  <a
                    className="section-line section-link"
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    key={j}
                  >
                    {ln}
                  </a>
                ) : (
                  <p className="section-line" key={j}>
                    {ln}
                  </p>
                ),
              )}
            </div>
          ))}
        </div>
        <button className="modal-back" onClick={handleClose}>
          ← BACK
        </button>
      </div>
    </div>
  )
}

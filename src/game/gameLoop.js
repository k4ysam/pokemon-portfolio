// requestAnimationFrame driver with a clamped delta time.

export function createGameLoop(step) {
  let raf = 0
  let last = 0
  let running = false

  function frame(now) {
    if (!running) return
    const dt = Math.min(now - last, 64) // clamp to avoid big jumps on tab refocus
    last = now
    step(dt)
    raf = requestAnimationFrame(frame)
  }

  return {
    start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
  }
}

// Load an <img> and resolve once decoded.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

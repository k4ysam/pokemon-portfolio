// Verify the player-following camera: the canvas viewport should be smaller
// than the full 800x640 map, fill the window, and pan as the player walks.
import puppeteer from 'puppeteer-core'
const URL = process.env.SMOKE_URL || 'http://localhost:3000/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1280,800'],
})
const p = await b.newPage()
await p.setCacheEnabled(false)
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push(String(e)))
await p.setViewport({ width: 1280, height: 800 })
await p.goto(URL, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 2200))
await p.keyboard.press('Space') // skip intro
await new Promise((r) => setTimeout(r, 1200))

const info = () =>
  p.evaluate(() => {
    const c = document.querySelector('.game-canvas')
    const rect = c.getBoundingClientRect()
    return {
      view: { w: c.width, h: c.height },
      css: { w: Math.round(rect.width), h: Math.round(rect.height) },
      player: { c: window.__game.player.col, r: window.__game.player.row },
    }
  })

console.log('initial:', JSON.stringify(await info()))
await p.screenshot({ path: 'shot_zoom_t0.png' })

// walk up a few tiles so the camera pans
for (let i = 0; i < 5; i++) {
  await p.keyboard.down('ArrowUp')
  await new Promise((r) => setTimeout(r, 180))
  await p.keyboard.up('ArrowUp')
  await new Promise((r) => setTimeout(r, 80))
}
await new Promise((r) => setTimeout(r, 400))
console.log('after walk:', JSON.stringify(await info()))
await p.screenshot({ path: 'shot_zoom_t1.png' })
console.log('console errors:', errs.length ? errs : 'none')
await b.close()

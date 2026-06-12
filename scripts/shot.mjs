import puppeteer from 'puppeteer-core'
const URL = process.env.SMOKE_URL || 'http://localhost:4318/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1024,768'],
})
const p = await b.newPage()
await p.setCacheEnabled(false) // ALWAYS shoot with cache off (stale-asset trap)
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push(String(e)))
await p.setViewport({ width: 1024, height: 768 })
await p.goto(URL, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1000))
// dismiss intro
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 1200))
await p.screenshot({ path: 'shot_town.png' })

const tap = async (k, n = 1) => {
  for (let i = 0; i < n; i++) {
    await p.keyboard.down(k)
    await new Promise((r) => setTimeout(r, 40))
    await p.keyboard.up(k)
    await new Promise((r) => setTimeout(r, 180))
  }
}

// spawn (10,8). Go up to avenue (row7), left to HOME door col4, up to door.
await tap('ArrowUp', 1) // -> row7
await tap('ArrowLeft', 6) // col10 -> col4
await tap('ArrowUp', 2) // row7 -> row5 (approach below door at row4)
await new Promise((r) => setTimeout(r, 150))
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 900))
await p.screenshot({ path: 'shot_home.png' })
await p.keyboard.press('Escape')
await new Promise((r) => setTimeout(r, 400))

// back down to avenue, to NPC1 at (6,6): stand (6,7) facing up
await tap('ArrowDown', 2) // row5 -> row7
await tap('ArrowRight', 2) // col4 -> col6
await tap('ArrowUp', 1) // face up toward NPC at (6,6)
await new Promise((r) => setTimeout(r, 150))
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 900))
await p.screenshot({ path: 'shot_npc.png' })

console.log('console errors:', errs.length ? errs : 'none')
await b.close()

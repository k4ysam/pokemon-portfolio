import puppeteer from 'puppeteer-core'
const URL = process.env.SMOKE_URL || 'http://localhost:3000/'
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
// intro: 500ms black + ~1.1s typewriter, then Space (or 2s auto) + 600ms fade
await new Promise((r) => setTimeout(r, 2200))
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 1200))
await p.screenshot({ path: 'shot_town.png' })

// collision debug overlay (hold "c")
await p.keyboard.down('c')
await new Promise((r) => setTimeout(r, 300))
await p.screenshot({ path: 'shot_collision.png' })
await p.keyboard.up('c')

const tap = async (k, n = 1) => {
  for (let i = 0; i < n; i++) {
    await p.keyboard.down(k)
    await new Promise((r) => setTimeout(r, 60))
    await p.keyboard.up(k)
    await new Promise((r) => setTimeout(r, 300))
  }
}

// spawn (12,10) above the fountain. Up the centre path to the LAB door (12,5).
await tap('ArrowUp', 4) // -> (12,6)
await tap('ArrowUp', 1) // blocked by the door tile (12,5), faces up
await new Promise((r) => setTimeout(r, 150))
await p.screenshot({ path: 'shot_emote.png' }) // "!" bubble above the player
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 900))
await p.screenshot({ path: 'shot_lab.png' })
await p.keyboard.press('Escape')
await new Promise((r) => setTimeout(r, 400))

// down around the fountain's east side, under the sign, to the south exit
await tap('ArrowDown', 5) // -> (12,11), pool blocks further
await tap('ArrowRight', 2) // -> (14,11) ring NE corner
await tap('ArrowDown', 3) // -> (14,14) ring SE corner
await tap('ArrowLeft', 2) // -> (12,14) behind the sign
await tap('ArrowDown', 2) // -> (12,16) under the sign board
await p.screenshot({ path: 'shot_sign_under.png' })
await tap('ArrowDown', 2) // -> (12,18) on the exit stairs
await p.screenshot({ path: 'shot_exit.png' })

console.log('console errors:', errs.length ? errs : 'none')
await b.close()

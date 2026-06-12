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
    await new Promise((r) => setTimeout(r, 60))
    await p.keyboard.up(k)
    await new Promise((r) => setTimeout(r, 300))
  }
}

// spawn (8,8). Walk row 7 (below the avenue, dodging NPC1 at (6,6)) to the
// HOME door column, then step up to (2,6) and face the door at (2,5).
await tap('ArrowUp', 1) // -> (8,7)
await tap('ArrowLeft', 5) // -> (3,7)  (a shrub blocks (2,7))
await tap('ArrowUp', 1) // -> (3,6) on the avenue
await tap('ArrowLeft', 1) // -> (2,6) below the HOME door
await tap('ArrowUp', 1) // face the door at (2,5) (blocked, turns up)
await new Promise((r) => setTimeout(r, 150))
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 900))
await p.screenshot({ path: 'shot_home.png' })
await p.keyboard.press('Escape')
await new Promise((r) => setTimeout(r, 400))

// along the avenue to NPC1 at (6,6): stop at (5,6) facing right
await tap('ArrowRight', 4) // 4th tap blocked by the NPC -> stand (5,6) facing right
await new Promise((r) => setTimeout(r, 150))
await p.screenshot({ path: 'shot_emote.png' }) // "!" bubble above the player
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 900))
await p.screenshot({ path: 'shot_npc.png' })

console.log('console errors:', errs.length ? errs : 'none')
await b.close()

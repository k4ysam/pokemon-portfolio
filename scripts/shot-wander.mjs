// Verify wandering NPCs/Pokemon: they move over time, block the player, and
// open dialogue when faced. Uses the window.__game debug handle.
import puppeteer from 'puppeteer-core'
const URL = process.env.SMOKE_URL || 'http://localhost:3000/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1024,768'],
})
const p = await b.newPage()
await p.setCacheEnabled(false)
const errs = []
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
p.on('pageerror', (e) => errs.push(String(e)))
await p.setViewport({ width: 1024, height: 768 })
await p.goto(URL, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 2200))
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 1200))

const snapshot = () =>
  p.evaluate(() => ({
    player: { c: window.__game.player.col, r: window.__game.player.row },
    ws: window.__game.wanderers.map((w) => ({ id: w.id, kind: w.kind, c: w.col, r: w.row })),
  }))

const s0 = await snapshot()
await p.screenshot({ path: 'shot_wander_t0.png' })
await new Promise((r) => setTimeout(r, 5000))
const s1 = await snapshot()
await p.screenshot({ path: 'shot_wander_t1.png' })
const moved = s1.ws.filter((w, i) => w.c !== s0.ws[i].c || w.r !== s0.ws[i].r)
console.log('t0:', JSON.stringify(s0.ws))
console.log('t1:', JSON.stringify(s1.ws))
console.log(`moved: ${moved.length}/${s1.ws.length}`)

// chase the professor (NPC1, id 10) and talk to him
const tap = async (k) => {
  await p.keyboard.down(k)
  await new Promise((r) => setTimeout(r, 60))
  await p.keyboard.up(k)
  await new Promise((r) => setTimeout(r, 280))
}
const DIRK = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
let talked = false
for (let i = 0; i < 50 && !talked; i++) {
  const s = await snapshot()
  const t = s.ws.find((w) => w.id === 10)
  const dc = t.c - s.player.c
  const dr = t.r - s.player.r
  if (Math.abs(dc) + Math.abs(dr) === 1) {
    const face = dc === 1 ? 'right' : dc === -1 ? 'left' : dr === 1 ? 'down' : 'up'
    await tap(DIRK[face]) // blocked by the NPC -> just turns to face it
    await p.keyboard.press('Space')
    await new Promise((r) => setTimeout(r, 700))
    await p.screenshot({ path: 'shot_wander_talk.png' })
    talked = true
    break
  }
  // greedy step toward the professor (cross the larger axis first)
  const order =
    Math.abs(dc) >= Math.abs(dr)
      ? [dc > 0 ? 'right' : 'left', dr > 0 ? 'down' : 'up']
      : [dr > 0 ? 'down' : 'up', dc > 0 ? 'right' : 'left']
  const before = await snapshot()
  await tap(DIRK[order[0]])
  const after = await snapshot()
  if (after.player.c === before.player.c && after.player.r === before.player.r && (dc !== 0 && dr !== 0)) {
    await tap(DIRK[order[1]]) // first axis blocked; try the other
  }
}
console.log('talked to professor:', talked)
console.log('console errors:', errs.length ? errs : 'none')
await b.close()

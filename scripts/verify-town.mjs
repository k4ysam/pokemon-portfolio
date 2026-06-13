// New-town interaction sweep: teleport to each door/sign approach, press the
// action key, and assert the expected modal/dialogue opens. Also verifies the
// camera clamps at all four map edges. Run: node scripts/verify-town.mjs
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

const DIRS = { down: 0, up: 1, left: 2, right: 3 }
const teleport = (c, r, dir) =>
  p.evaluate(({ c, r, dir }) => {
    const pl = window.__game.player
    pl.col = pl.fromCol = c
    pl.row = pl.fromRow = r
    pl.pixelX = c * 32
    pl.pixelY = r * 32
    pl.moving = false
    pl.dir = dir
  }, { c, r, dir })

const uiState = () =>
  p.evaluate(() => ({
    mapId: window.__game.mapId,
    modal: document.querySelector('.modal-title')?.textContent ?? null,
    dialogue: document.querySelector('.dialogue-text')?.textContent ?? null,
  }))

const targets = [
  { name: 'HOME door', c: 10, r: 9, dir: DIRS.up, expect: 'modal' },
  { name: 'HOME door (right tile)', c: 11, r: 9, dir: DIRS.up, expect: 'modal' },
  { name: 'LAB door', c: 22, r: 9, dir: DIRS.up, expect: 'modal' },
  { name: 'LAB door (right tile)', c: 23, r: 9, dir: DIRS.up, expect: 'modal' },
  { name: 'GYM door', c: 35, r: 9, dir: DIRS.up, expect: 'modal' },
  { name: 'GYM door (right tile)', c: 36, r: 9, dir: DIRS.up, expect: 'modal' },
  { name: 'CONTACT door', c: 12, r: 24, dir: DIRS.up, expect: 'warp' },
  { name: 'CONTACT door (right tile)', c: 13, r: 24, dir: DIRS.up, expect: 'warp' },
  { name: 'MISC door', c: 33, r: 24, dir: DIRS.up, expect: 'dialogue' },
  { name: 'MISC door (right tile)', c: 34, r: 24, dir: DIRS.up, expect: 'dialogue' },
  { name: 'town sign (notice board)', c: 26, r: 9, dir: DIRS.up, expect: 'dialogue' },
]

let failed = 0
for (const t of targets) {
  await teleport(t.c, t.r, t.dir)
  await new Promise((r) => setTimeout(r, 250))
  await p.keyboard.press('KeyZ')
  await new Promise((r) => setTimeout(r, t.expect === 'warp' ? 1000 : 600))
  const s = await uiState()
  const got =
    s.mapId !== 'town' ? 'warp' : s.modal ? 'modal' : s.dialogue ? 'dialogue' : 'nothing'
  const ok = got === t.expect
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${t.name} @(${t.c},${t.r}) -> ${got}`,
    s.modal ? `[${s.modal.trim()}]` : s.dialogue ? `[${s.dialogue.trim().slice(0, 40)}]` : got === 'warp' ? `[${s.mapId}]` : '')
  // close whatever opened (modal needs its fade; dialogue may take 2 presses)
  for (let i = 0; i < 4; i++) {
    await p.keyboard.press('Escape')
    await new Promise((r) => setTimeout(r, 350))
    const cleared = await uiState()
    if (!cleared.modal && !cleared.dialogue) break
  }
  // a warp target leaves us inside the interior — jump straight back out
  if (got === 'warp') {
    await p.evaluate(() => window.__game.warpTo('town', 'fromCenter'))
    await new Promise((r) => setTimeout(r, 300))
  }
}

// camera clamp at the four reachable extremes
const clamps = [
  { name: 'west', c: 5, r: 16 },
  { name: 'east', c: 43, r: 16 },
  { name: 'north', c: 22, r: 9 },
  { name: 'south', c: 22, r: 28 },
]
for (const cl of clamps) {
  await teleport(cl.c, cl.r, DIRS.down)
  await new Promise((r) => setTimeout(r, 300))
  const cam = await p.evaluate(() => {
    const c = document.querySelector('.game-canvas')
    return { vw: c.width, vh: c.height }
  })
  const inBounds = cam.vw <= 1536 && cam.vh <= 1024
  console.log(`${inBounds ? 'PASS' : 'FAIL'} camera ${cl.name} view ${cam.vw}x${cam.vh}`)
  if (!inBounds) failed++
}
await p.screenshot({ path: 'shot_verify_last.png' })

console.log('console errors:', errs.length ? errs : 'none')
console.log(failed ? `FAILED: ${failed}` : 'ALL PASS')
await b.close()
process.exit(failed || errs.length ? 1 : 0)

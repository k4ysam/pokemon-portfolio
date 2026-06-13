// Pokemon Center interior sweep: enter through the town door, talk to the
// nurse (dialogue -> contact modal), check every interior interactable, then
// walk out through the exit door. Run: node scripts/verify-center.mjs
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const DIRS = { down: 0, up: 1, left: 2, right: 3 }
let failed = 0
const check = (ok, name, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`, extra)
}

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

const gameState = () =>
  p.evaluate(() => ({
    mapId: window.__game.mapId,
    col: window.__game.player.col,
    row: window.__game.player.row,
    modal: document.querySelector('.modal-title')?.textContent ?? null,
    dialogue: document.querySelector('.dialogue-text')?.textContent ?? null,
  }))

const closeAll = async () => {
  for (let i = 0; i < 5; i++) {
    const s = await gameState()
    if (!s.modal && !s.dialogue) break
    await p.keyboard.press('Escape')
    await sleep(400)
  }
}

// --- 1. enter the Center through the town CONTACT door ---
await teleport(12, 24, DIRS.up)
await sleep(250)
await p.keyboard.press('KeyZ')
await sleep(1000) // warp fade out + in
let s = await gameState()
check(s.mapId === 'center', 'door warp -> center', `map=${s.mapId}`)
check(s.col === 11 && s.row === 12, 'spawn just inside the door', `@(${s.col},${s.row})`)
await p.screenshot({ path: 'shot_center_inside.png' })

// --- 2. nurse: dialogue chains into the contact modal ---
await teleport(11, 7, DIRS.up)
await sleep(250)
await p.keyboard.press('KeyZ')
await sleep(600)
s = await gameState()
check(!!s.dialogue, 'nurse dialogue opens', s.dialogue ? `[${s.dialogue.trim().slice(0, 40)}]` : '')
await p.screenshot({ path: 'shot_center_nurse.png' })
for (let i = 0; i < 4 && !(await gameState()).modal; i++) {
  await p.keyboard.press('KeyZ')
  await sleep(700)
}
s = await gameState()
check(s.modal === 'LET US HEAL YOUR QUESTIONS!', 'nurse chains into contact modal', `[${s.modal}]`)
await closeAll()
s = await gameState()
check(s.mapId === 'center' && !s.modal, 'modal closes back to the room')

// --- 3. flavor interactables ---
const flavor = [
  { name: 'counter PC', c: 5, r: 7, dir: DIRS.up, snip: 'booted up' },
  { name: 'bookshelf', c: 1, r: 7, dir: DIRS.up, snip: 'guidebooks' },
  { name: 'painting', c: 20, r: 6, dir: DIRS.up, snip: 'Montreal' },
  { name: 'TV', c: 22, r: 9, dir: DIRS.up, snip: 'news' },
  { name: 'Eevee (static-ish)', c: 8, r: 12, dir: DIRS.up, snip: null, optional: true },
]
for (const f of flavor) {
  if (f.optional) continue // Eevee wanders; covered by the town NPC tests
  await teleport(f.c, f.r, f.dir)
  await sleep(250)
  await p.keyboard.press('KeyZ')
  await sleep(1500) // let the typewriter finish line 1
  s = await gameState()
  const ok = !!s.dialogue && s.dialogue.toLowerCase().includes(f.snip.toLowerCase())
  check(ok, `${f.name} dialogue`, s.dialogue ? `[${s.dialogue.trim().slice(0, 40)}]` : '(none)')
  // Close without finishing: Escape cancels any thenModal/thenHref chain.
  await closeAll()
}

// --- 4. collision spot checks: sealed behind-counter + walls ---
const blocked = await p.evaluate(() => {
  const m = window.__game.map
  const spots = [
    [10, 4], // behind the counter (nurse's strip)
    [7, 3],  // healing machine
    [10, 6], // counter itself
    [0, 8],  // left wall
    [23, 9], // right wall
    [11, 14], // below the exit door (outside mat)
  ]
  return spots.every(([c, r]) => m.collision[r][c] === 1)
})
check(blocked, 'sealed tiles stay blocked')

// --- 5. walk out: step down into the door, warp back to town ---
await teleport(11, 12, DIRS.down)
await sleep(250)
await p.keyboard.down('ArrowDown')
await sleep(400)
await p.keyboard.up('ArrowDown')
await sleep(1100) // step + fade
s = await gameState()
check(s.mapId === 'town', 'exit door warps back to town', `map=${s.mapId}`)
check(s.col === 12 && s.row === 24, 'arrive outside the CONTACT door', `@(${s.col},${s.row})`)
await p.screenshot({ path: 'shot_center_back_outside.png' })

console.log('console errors:', errs.length ? errs : 'none')
console.log(failed ? `FAILED: ${failed}` : 'ALL PASS')
await b.close()
process.exit(failed || errs.length ? 1 : 0)

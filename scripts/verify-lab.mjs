// Lab interior sweep: enter through the town LAB door, talk to the professor
// (dialogue -> skills/RESEARCH CATALOG modal), check all 5 skill stations, then
// walk out through the exit door. Run: node scripts/verify-lab.mjs
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

// --- 1. Enter the lab through the town LAB door ---
await teleport(22, 9, DIRS.up)
await sleep(250)
await p.keyboard.press('KeyZ')
await sleep(1000)
let s = await gameState()
check(s.mapId === 'lab', 'LAB door warp -> lab', `map=${s.mapId}`)
check(s.col === 11 && s.row === 13, 'spawn just inside the door', `@(${s.col},${s.row})`)
await p.screenshot({ path: 'shot_lab_inside.png' })

// --- 2. Professor: dialogue chains into the skills modal ---
await teleport(12, 6, DIRS.up)
await sleep(250)
await p.keyboard.press('KeyZ')
await sleep(600)
s = await gameState()
check(!!s.dialogue, 'professor dialogue opens', s.dialogue ? `[${s.dialogue.trim().slice(0, 40)}]` : '')
await p.screenshot({ path: 'shot_lab_professor.png' })
for (let i = 0; i < 4 && !(await gameState()).modal; i++) {
  await p.keyboard.press('KeyZ')
  await sleep(700)
}
s = await gameState()
const modalOk = !!s.modal && s.modal.toUpperCase().includes('RESEARCH')
check(modalOk, 'professor chains into RESEARCH CATALOG modal', `[${s.modal}]`)
await closeAll()

// --- 3. All 5 skill stations ---
const stations = [
  { name: 'LANGUAGES (table)',   c: 11, r: 10, dir: DIRS.up,    snip: 'starter' },
  { name: 'ML & AI (computer)',  c: 3,  r: 4,  dir: DIRS.up,    snip: 'gpu' },
  { name: 'BACKEND (servers)',   c: 20, r: 4,  dir: DIRS.up,    snip: 'servers' },
  { name: 'FRONTEND (dev desk)', c: 17, r: 6,  dir: DIRS.right, snip: 'monitors' },
  { name: 'TOOLS (bookshelf)',   c: 5,  r: 6,  dir: DIRS.left,  snip: 'shelves' },
]
for (const st of stations) {
  await teleport(st.c, st.r, st.dir)
  await sleep(250)
  await p.keyboard.press('KeyZ')
  await sleep(1500)
  s = await gameState()
  const ok = !!s.dialogue && s.dialogue.toLowerCase().includes(st.snip.toLowerCase())
  check(ok, `${st.name} dialogue`, s.dialogue ? `[${s.dialogue.trim().slice(0, 40)}]` : '(none)')
  await closeAll()
}

// --- 4. Collision spot checks ---
const blocked = await p.evaluate(() => {
  const m = window.__game.map
  return [
    [11, 2],  // back wall
    [0, 8],   // side wall
    [23, 8],  // side wall
    [12, 4],  // professor desk
    [3, 3],   // supercomputer front
    [20, 3],  // server rack front
    [11, 8],  // starter table
    [11, 15], // front wall below door
  ].every(([c, r]) => m.collision[r][c] === 1)
})
check(blocked, 'sealed tiles stay blocked')

// --- 5. Walk out: step down into the door, warp back to town ---
await teleport(11, 13, DIRS.down)
await sleep(250)
await p.keyboard.down('ArrowDown')
await sleep(400)
await p.keyboard.up('ArrowDown')
await sleep(1100)
s = await gameState()
check(s.mapId === 'town', 'exit door warps back to town', `map=${s.mapId}`)
check(s.col === 22 && s.row === 9, 'arrive outside the LAB door', `@(${s.col},${s.row})`)
await p.screenshot({ path: 'shot_lab_back_outside.png' })

console.log('console errors:', errs.length ? errs : 'none')
console.log(failed ? `FAILED: ${failed}` : 'ALL PASS')
await b.close()
process.exit(failed || errs.length ? 1 : 0)

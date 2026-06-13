// Gym interior sweep: enter through the town GYM door, talk to the leader
// (dialogue -> projects modal), check all 4 project stations, then walk out
// through the exit mat. Run: node scripts/verify-gym.mjs
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

// --- 1. Enter the gym through the town GYM door ---
await teleport(35, 8, DIRS.up)
await sleep(250)
await p.keyboard.press('KeyZ')
await sleep(1000)
let s = await gameState()
check(s.mapId === 'gym', 'GYM door warp -> gym', `map=${s.mapId}`)
check(s.col === 11 && s.row === 12, 'spawn just inside the door', `@(${s.col},${s.row})`)
await p.screenshot({ path: 'shot_gym_inside.png' })

// --- 2. Leader: dialogue chains into the projects modal ---
await teleport(11, 4, DIRS.up)
await sleep(250)
await p.keyboard.press('KeyZ')
await sleep(600)
s = await gameState()
check(!!s.dialogue, 'leader dialogue opens', s.dialogue ? `[${s.dialogue.trim().slice(0, 40)}]` : '')
await p.screenshot({ path: 'shot_gym_leader.png' })
for (let i = 0; i < 4 && !(await gameState()).modal; i++) {
  await p.keyboard.press('KeyZ')
  await sleep(700)
}
s = await gameState()
const modalOk = !!s.modal && s.modal.toUpperCase().includes('PROJECT')
check(modalOk, 'leader chains into projects modal', `[${s.modal}]`)
await closeAll()

// --- 3. All 4 project stations ---
const stations = [
  { name: 'left station 1',  c: 2,  r: 7, dir: DIRS.up, snip: 'project' },
  { name: 'left station 2',  c: 2,  r: 9, dir: DIRS.up, snip: 'project' },
  { name: 'right station 1', c: 21, r: 7, dir: DIRS.up, snip: 'project' },
  { name: 'right station 2', c: 21, r: 9, dir: DIRS.up, snip: 'project' },
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
    [11, 3],  // leader zone
    [11, 2],  // trophy display
    [0, 8],   // side wall
    [23, 8],  // side wall
    [1, 6],   // left project station tile
    [21, 6],  // right project station tile
    [11, 14], // front wall below exit
  ].every(([c, r]) => m.collision[r][c] === 1)
})
check(blocked, 'sealed tiles stay blocked')

// --- 5. Walk out: step down into the exit mat, warp back to town ---
await teleport(11, 12, DIRS.down)
await sleep(250)
await p.keyboard.down('ArrowDown')
await sleep(400)
await p.keyboard.up('ArrowDown')
await sleep(1100)
s = await gameState()
check(s.mapId === 'town', 'exit mat warps back to town', `map=${s.mapId}`)
check(s.col === 35 && s.row === 9, 'arrive outside the GYM door', `@(${s.col},${s.row})`)
await p.screenshot({ path: 'shot_gym_back_outside.png' })

console.log('console errors:', errs.length ? errs : 'none')
console.log(failed ? `FAILED: ${failed}` : 'ALL PASS')
await b.close()
process.exit(failed || errs.length ? 1 : 0)

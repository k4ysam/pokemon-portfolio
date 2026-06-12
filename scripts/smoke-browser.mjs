// Headless runtime smoke test: loads the app, captures console/page errors,
// verifies the canvas is non-blank, then exercises an interaction + a modal.
import puppeteer from 'puppeteer-core'

const URL = process.env.SMOKE_URL || 'http://localhost:4317/'
const CHROME =
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const errors = []
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1024,768'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1024, height: 768 })
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console.error: ' + m.text())
})
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('requestfailed', (r) =>
  errors.push('requestfailed: ' + r.url() + ' ' + r.failure()?.errorText),
)

await page.goto(URL, { waitUntil: 'networkidle0' })

// canvas present + has internal resolution
const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector('canvas.game-canvas')
  if (!c) return null
  return { w: c.width, h: c.height }
})
console.log('canvas:', JSON.stringify(canvasInfo))

// wait for intro -> town (intro auto-advances ~2s after typing). Give it time.
await new Promise((r) => setTimeout(r, 5000))

// sample canvas pixels to confirm it's not blank/black
const notBlank = await page.evaluate(() => {
  const c = document.querySelector('canvas.game-canvas')
  const ctx = c.getContext('2d')
  const d = ctx.getImageData(0, 0, c.width, c.height).data
  const colors = new Set()
  for (let i = 0; i < d.length; i += 4 * 137) {
    colors.add(`${d[i]},${d[i + 1]},${d[i + 2]}`)
  }
  return colors.size
})
console.log('distinct sampled colors on canvas:', notBlank)

// drive player to the HOUSE door and open the modal:
// spawn (10,8). House door (3,3); approach tile (3,4) facing up.
async function tap(key, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key)
    await new Promise((r) => setTimeout(r, 40))
    await page.keyboard.up(key)
    await new Promise((r) => setTimeout(r, 180))
  }
}
// move left from col10 -> col3 (7 lefts), up from row8 -> row4 (4 ups)
await tap('ArrowLeft', 7)
await tap('ArrowUp', 4)
await new Promise((r) => setTimeout(r, 200))
await page.keyboard.press('Space') // interact with house door
await new Promise((r) => setTimeout(r, 600))

const modalOpen = await page.evaluate(() => !!document.querySelector('.modal-frame'))
const modalTitle = await page.evaluate(
  () => document.querySelector('.modal-title')?.textContent || null,
)
console.log('modal open after house interact:', modalOpen, '| title:', modalTitle)

await page.keyboard.press('Escape')
await new Promise((r) => setTimeout(r, 500))
const modalClosed = await page.evaluate(() => !document.querySelector('.modal-frame'))
console.log('modal closed after Escape:', modalClosed)

await browser.close()

if (errors.length) {
  console.log('\n--- RUNTIME ERRORS ---')
  errors.forEach((e) => console.log(e))
  process.exit(1)
}
if (!canvasInfo || notBlank < 4 || !modalOpen || !modalClosed) {
  console.log('\nASSERTION FAILED', { canvasInfo, notBlank, modalOpen, modalClosed })
  process.exit(2)
}
console.log('\nBROWSER SMOKE OK')

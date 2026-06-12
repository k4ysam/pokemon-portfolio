import puppeteer from 'puppeteer-core'
const URL = process.env.SMOKE_URL || 'http://localhost:4318/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1024,768'],
})
const p = await b.newPage()
await p.setViewport({ width: 1024, height: 768 })
await p.goto(URL, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 5500)) // past intro
await p.screenshot({ path: 'shot_town.png' })

const tap = async (k, n = 1) => {
  for (let i = 0; i < n; i++) {
    await p.keyboard.down(k)
    await new Promise((r) => setTimeout(r, 40))
    await p.keyboard.up(k)
    await new Promise((r) => setTimeout(r, 180))
  }
}
// NPC1 at (5,6); spawn (10,8) -> stand (5,7) facing up
await tap('ArrowLeft', 5)
await tap('ArrowUp', 1)
await new Promise((r) => setTimeout(r, 150))
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 900))
await p.screenshot({ path: 'shot_dialogue.png' })
await p.keyboard.press('Escape')
await new Promise((r) => setTimeout(r, 300))

// GYM door (15,3) approach (15,4). From (5,7): right 10, up 3
await tap('ArrowRight', 10)
await tap('ArrowUp', 3)
await new Promise((r) => setTimeout(r, 150))
await p.keyboard.press('Space')
await new Promise((r) => setTimeout(r, 800))
await p.screenshot({ path: 'shot_modal.png' })

await b.close()
console.log('shots saved')

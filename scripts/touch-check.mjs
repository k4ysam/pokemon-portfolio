import puppeteer from 'puppeteer-core'
const URL = process.env.SMOKE_URL || 'http://localhost:4318/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})
const p = await b.newPage()
// emulate a touch phone
await p.emulate({
  viewport: { width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  userAgent:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
})
await p.goto(URL, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 5500))
const dpad = await p.evaluate(() => ({
  layer: !!document.querySelector('.dpad-layer'),
  buttons: document.querySelectorAll('.dpad-btn').length,
  aBtn: !!document.querySelector('.btn-a'),
}))
console.log('dpad present:', JSON.stringify(dpad))
await p.screenshot({ path: 'shot_mobile.png' })
await b.close()
console.log(dpad.layer && dpad.buttons === 4 && dpad.aBtn ? 'DPAD OK' : 'DPAD MISSING')

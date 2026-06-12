# Samaksh Town — Portfolio

An explorable Pokémon HG/SS-style town that doubles as a portfolio. Walk around
with arrow keys / WASD (or the on-screen D-pad on mobile) and interact with
buildings and NPCs to read about Samaksh.

Built with **Vite + React** and **vanilla Canvas 2D** — no game engine.

## Run

```bash
npm install
npm run dev        # dev server
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

## Controls

| Action      | Keys                         |
| ----------- | ---------------------------- |
| Move        | Arrow keys / WASD            |
| Interact    | Space / Enter / Z (or **A**) |
| Close / Back| Escape / X (or **B**)        |

On touch devices a virtual D-pad + A/B buttons appear automatically.

## Map

- **HOME** (red) → About
- **LAB** (blue) → Skills (research catalog)
- **GYM** (gray) → Projects (gym challenges)
- **CENTER** (red) → Contact
- **MART** (blue) → placeholder dialogue (resume section, coming soon)
- Two NPCs and a town sign with flavor dialogue.

## Assets

Pixel-art tiles and sprites are generated deterministically by
`scripts/generate-assets.js` (a dependency-free PNG encoder using Node's
built-in `zlib`) into `public/assets/`. Regenerate with:

```bash
npm run gen-assets
```

## Project layout

```
src/
  game/      mapData, renderer, player, input, interaction, npc, gameLoop, GameCanvas
  ui/        DialogueBox, ContentModal, DPad, IntroSequence
  content/   about, skills, projects, contact
  styles/    index.css
scripts/
  generate-assets.js   asset generator
  smoke-browser.mjs    headless runtime smoke test (puppeteer-core)
  shot.mjs             screenshot helper
  touch-check.mjs      mobile D-pad check
```

## Verification

`scripts/smoke-browser.mjs` loads the built app in headless Chrome, asserts the
canvas renders, walks the player to the HOME door, opens + closes the modal, and
fails on any console/page error. Run against a `npm run preview` server:

```bash
npm run preview -- --port 4318 &
SMOKE_URL=http://localhost:4318/ node scripts/smoke-browser.mjs
```

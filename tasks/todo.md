# Pokémon Portfolio Town — Implementation

## Part 1: Setup + Assets
- [x] Scaffold Vite + React manually (non-empty dir)
- [x] package.json, vite.config.js, index.html (Press Start 2P font)
- [x] Generate/source assets: tileset.png, player.png, npcs.png into public/assets
- [x] Verify dev server boots

## Part 2: Tile Map + Rendering
- [x] mapData.js (ground/collision/interaction layers, 20x15)
- [x] renderer.js (draw ground layer)
- [x] GameCanvas.jsx (canvas, pixelated, rAF loop)
- [x] App.jsx full screen
- [x] Verify town renders

## Part 3: Player Movement + Collision
- [x] player.js, input.js
- [x] grid-snapped lerp movement + collision
- [x] player rendering + walk anim
- [x] y-sorting
- [x] Verify movement

## Part 4: Interactions + Dialogue
- [x] DialogueBox.jsx (typewriter)
- [x] interaction.js (facing tile lookup)
- [x] npc.js (2 NPCs)
- [x] "!" indicator
- [x] Verify dialogue

## Part 5: Content Modals
- [x] ContentModal.jsx (fade, pixel border)
- [x] content/about, skills, projects, contact
- [x] wire doors to modals; PokeMart placeholder
- [x] Verify modals

## Part 6: Mobile + Intro + Polish
- [x] DPad.jsx
- [x] IntroSequence.jsx
- [x] building label signs, resize, title, CRT overlay
- [x] npm run build passes
- [x] Final verify

## Part 7: HGSS sprites from The Spriters Resource

- [x] Phase 1 — download sheets (Ethan, Trainers OW, emotions, text-boxes;
      site's old /sheet & /download URLs are dead — assets live at
      /media/assets/<bucket>/<id>.png, resolved from each /asset/<id>/ page)
- [x] Phase 2 — player.png from Ethan walk cycle (4 dirs x 3 frames,
      color-keyed, row-baseline anchored); npcs.png = professor + Silver
- [x] Phase 3 — buildings from "Sinnoh Tiles (Outdoor)" by Kyledove & Speed
      (HGSS section has no tileset rips): blue house -> HOME, teal house ->
      LAB, green warehouse -> GYM, orange dome -> CENTER, blue dome -> MART.
      Top building row moved down 1 (rows 2-5) for the taller roofs; doors
      are data-driven per building; fountain/sign shifted east off the new
      lab path (col 8); spawn -> (8,8)
- [x] Phase 4 — ground tiles consciously kept (no clean HGSS source exists;
      current Tuxemon-graded tiles already match the reference)
- [x] Phase 5 — ATTRIBUTION.md rewritten (Nintendo rips + Kyledove/Speed
      credit), build green, smoke test: town/door-modal/NPC-dialogue shots,
      zero console errors
- [x] Bonus — HGSS "!" emote bubble replaces the hand-drawn indicator

## Review

All 6 parts implemented and verified (build + headless-browser smoke).

**Decisions / deviations:**
- Scaffolded Vite manually (dir was non-empty, `npm create vite` would prompt).
- Assets generated programmatically via a dependency-free PNG encoder
  (`scripts/generate-assets.js`) instead of Tuxemon downloads — gives full
  control over tile indices + sprite frame layout and avoids native build deps
  on Windows. Result looks like a clean HGSS town (see verification).
- Whole 320x240 town fits one screen, so no scrolling camera — canvas is
  letterbox-scaled to the viewport with `image-rendering: pixelated`.
- y-sorting done per-drawable by base Y (tall tiles + NPCs + player), so the
  player passes behind building roofs/tree canopies above and in front below.

**Verified:**
- `npm run build` succeeds (45 modules).
- Headless Chrome: canvas renders (28 sampled colors), player walks, HOME modal
  opens (TRAINER CARD) and closes on Escape, **zero console/page errors**.
- Screenshots confirmed town, NPC dialogue (typewriter + ▼), GYM projects modal.
- Mobile touch emulation: D-pad (4 dirs) + A/B buttons render and are wired.

**Out of scope (per spec):** PokéMart shows a placeholder dialogue.

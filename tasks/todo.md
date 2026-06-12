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

---

# Plan: Replace town with town_rev.png (mechanics unchanged) — DONE

## Requirements
- Swap the pre-rendered background from `public/assets/town-bg.png` (800×640, 25×20 tiles) to `town_rev.png` (1536×1024 = 48×32 tiles @ 32px, grid-aligned).
- Keep ALL mechanics intact: tile movement, camera zoom/clamp, y-sorting, wanderers, door/sign interactions, "!" indicator, hold-c collision debug.
- Map the 5 new buildings to existing content: HOME→about, LAB→skills, GYM→projects, CONTACT (P-center)→contact modal, MISC→MART placeholder dialogue.

## Phase 1: Asset swap
- [x] Copy `town_rev.png` → `public/assets/town-bg.png`; bump `ASSET_VERSION` in GameCanvas.jsx

## Phase 2: Constants
- [x] `constants.js`: MAP_W 25→48, MAP_H 20→32 (TILE stays 32); update comments

## Phase 3: Collision derivation
- [x] Rework `scripts/derive-collision.py` for 48×32; widened path thresholds (v>0.55, s<0.8)
- [x] Manual overrides: 5 buildings, fountain (21-24 × 15-17 incl. ring spill), pond, garden, tree borders; forced-open LAB approach (23,9)
- [x] Flood fill from spawn (501 reachable); reviewed overlay at tile level; rows pasted into `mapData.js`

## Phase 4: Map data
- [x] 2-tile-wide door interactions for all 5 buildings; SIGN on the notice board at (25-26, 8); `FOREGROUND_RECTS = []`; `SPAWN` (22,13) north of fountain

## Phase 5: Wanderers
- [x] All 5 re-placed: professor west avenue, Silver east avenue, Pikachu fountain plaza, Eevee grass HOME↔LAB, Piplup lower walkway

## Phase 6: Verify
- [x] `npm run build` green; shot-zoom + new `scripts/verify-town.mjs`: all 11 interaction targets + 4 camera clamps PASS, zero console errors

## Review

- Image is exactly 48×32 tiles at the existing TILE=32 — no engine changes,
  only data (constants, mapData, npc) + ASSET_VERSION bump.
- Collision pipeline: per-tile color heuristic measured numerically per door
  approach (non-walkable %), so every door has a verified 2-tile approach.
- Found + fixed a PRE-EXISTING bug exposed by testing: `ContentModal` treated
  the shared `closeSignal` counter as a boolean, so every modal after the
  first self-closed on mount. Fixed with the same prev-ref pattern
  DialogueBox already used.
- New permanent E2E: `scripts/verify-town.mjs` (doors/sign/camera sweep).
- South stairs lead off-map; kept closed at the tree line (player can stand
  on the landing). Unreachable grass enclaves behind buildings auto-blocked
  by flood fill.

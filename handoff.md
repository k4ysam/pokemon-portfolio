# HANDOFF — Pokémon Portfolio Town

**Status: visual overhaul DONE (2026-06-12).** The town now matches the reference
art the user provided: distinct buildings, autotiled sandy paths, stone fountain,
welcome sign, picket fence, dense pine border and hand-drawn HGSS-style trainers.
Verify with `npm run build` → `npm run preview -- --port 4318` → `node scripts/shot.mjs`
(cache is disabled inside shot.mjs — never screenshot with cache on).

## What was done this pass

1. **Cache-bust fixed**: `GameCanvas.jsx` loads `assets/*.png?v=ASSET_VERSION`.
   Bump `ASSET_VERSION` after every `npm run pack-assets`.
2. **Path autotiling**: transparent 3×3 edge block + inner-corner tiles from
   `prototyping_outdoor.png` (cols 6-8, rows 5-9) are quadrant-composited into
   16 N/E/S/W variants (tileset ids 16-31, `PATH_AUTO_BASE` in constants.js).
   `mapData.js` marks paths in a bool grid, then resolves each cell's mask.
   Paths are 1 tile wide everywhere — the quadrant logic relies on that.
3. **Distinct buildings** (no more hue-shift hack): red-roof cabin → HOME,
   blue storefront → LAB, yellow → GYM, red "+" → CONTACT, green "+" → LINKS
   (all from `core_buildings.png`; cabin cropped by pixel bbox, padded to 80×80).
   All stamps 5×4 tiles, door at local (3,3).
4. **New layout** (`mapData.js`): HOME/LAB/GYM on top, CONTACT/LINKS bottom,
   main avenue row 6, LAB path runs down to a fence-gap exit, fountain (8,9),
   sign (8,13), pine columns on both sides, big pines in bottom corners,
   picket fence row 14, flower beds / shrubs / grass tufts.
5. **Hand-drawn trainers**: `pack-assets.py` generates 13×19 px trainers from
   ASCII templates (4 dirs × 3 walk frames, feet-lift walk animation). Player =
   red cap/blue shirt; NPC1 brown hair/green; NPC2 red hair/rose.
6. **Other art**: hand-drawn stone fountain (32×32) and welcome sign board;
   dense TREETOP canopy fill; transparent pine/round-tree/bush sprites; grass
   graded (+28% saturation) toward the reference's richer green.
7. **Labels**: HTML overlays renamed CONTACT/LINKS; "SAMAKSH TOWN" labels the
   sign. Deprecated `scripts/generate-assets.js` and unused Tuxemon combat
   sprites were deleted; ATTRIBUTION.md updated.

## Verified working
- `npm run build` green, zero console errors in headless run.
- HOME door modal (Trainer Card), NPC dialogue, sign — see shot_*.png artifacts.
- Movement/collision: border, fence, buildings, fountain, sign all block.

## Possible future polish
- Fountain water animation (renderer has no animated tiles yet).
- More walk-frame nuance / side-profile arms on the trainers.
- Resume/links modal for LINKS (currently placeholder dialogue, per CLAUDE.md).

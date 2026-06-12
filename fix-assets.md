# FIX: Replace Generated Assets with Tuxemon Sprites

The current assets are all programmatically generated and look very basic — blocky buildings, green blob trees, stick-figure characters. We need to replace them with real pixel art from the Tuxemon project on GitHub.

## Step 1: Explore the Tuxemon Repo for Assets

Clone or browse the Tuxemon repo to find usable assets:

```bash
# Clone just the asset directories we need (sparse checkout)
git clone --depth 1 --filter=blob:none --sparse https://github.com/Tuxemon/Tuxemon.git tuxemon-assets
cd tuxemon-assets
git sparse-checkout set mods/tuxemon/gfx
```

Then explore what's available:
- `mods/tuxemon/gfx/tilesets/` — look for tileset PNGs (grass, paths, buildings, trees, fences, water, flowers)
- `mods/tuxemon/gfx/sprites/player/` — player walk cycle spritesheets
- `mods/tuxemon/gfx/sprites/npc/` — NPC sprites

List out all available files. Find:
1. A tileset PNG that has outdoor/town tiles (buildings, roofs, trees, paths, grass)
2. A player spritesheet with 4-direction walk animation
3. 1-2 NPC spritesheets

## Step 2: Understand the Tileset Format

Tuxemon tilesets are typically grid-based PNGs where each tile is 16x16. You need to:
1. Open/inspect the tileset PNG to understand the grid layout
2. Map which tile positions correspond to: grass, dirt path, tree trunk, tree canopy, building walls, roofs (red, blue, gray), doors, windows, fences, flowers, water edges
3. Update `mapData.js` tile IDs to reference the correct positions in the new tileset

## Step 3: Replace Assets

Copy the selected Tuxemon assets into `public/assets/`, replacing the generated ones:
- `public/assets/tileset.png` ← Tuxemon tileset
- `public/assets/player.png` ← Tuxemon player spritesheet  
- `public/assets/npcs.png` ← Tuxemon NPC sprites (or individual NPC PNGs)

## Step 4: Update the Renderer

The renderer needs to be updated to correctly reference the new tileset:
- Update tile size if Tuxemon uses a different base (some use 16x16, some 32x32 — check the actual files)
- Update the tile ID mapping so each ID in `mapData.js` points to the correct x,y position in the new tileset PNG
- Update player sprite frame dimensions and animation frame positions to match the Tuxemon spritesheet layout
- Update NPC sprite rendering similarly

## Step 5: Rebuild the Map with Better Tile Variety

With real tiles available, improve the map:
- Use multiple grass variants (not one flat green)
- Add proper path edges/corners (dirt-to-grass transitions)
- Trees should have a trunk tile (bottom) and canopy tile (top) for depth
- Buildings should use proper wall + roof tiles with windows and doors as separate tiles
- Add fence tiles with proper end-caps
- Scatter flower/decoration tiles on grass areas
- The sign near the center should use a proper sign tile if available

## Step 6: Fix Building Appearance

Current buildings are flat colored rectangles. With Tuxemon tiles, buildings should be constructed from multiple tiles:
```
[roof-left] [roof-mid] [roof-mid] [roof-right]
[wall-left] [window]   [door]     [wall-right]
```
Each building assembled from wall, roof, door, and window tiles — not a single flat rectangle. Different roof colors per building (red for home/center, blue for lab/mart, gray for gym).

## Step 7: Fix Character Sprites

Current characters are crude blocky figures. Replace with Tuxemon trainer sprites:
- Player sprite should have 4 directions × 3-4 walk frames
- Verify the spritesheet layout: Tuxemon typically arranges them as rows per direction (row 0 = down, row 1 = left, row 2 = right, row 3 = up) with 3-4 columns per frame
- Update `player.js` frame calculations to match the actual spritesheet dimensions
- NPC sprites: at minimum need a standing frame facing down

## What Good Looks Like

Reference: Pokemon HeartGold/SoulSilver town screenshots. The key visual qualities are:
- Trees have DEPTH — dark trunk base with leafy canopy that overlaps things behind it
- Buildings are assembled from tiles, not flat shapes — visible brick/wood texture, distinct roof angles
- Paths have edge transitions — dirt doesn't just hard-cut to grass, there are border tiles
- Characters have clear silhouettes with visible features (hat, hair, clothing colors)
- Ground has subtle variety — not one repeated grass tile, but 2-3 variants placed semi-randomly
- Small details everywhere — flowers, fence posts, signs, stepping stones

## If Tuxemon Assets Don't Work

If the Tuxemon repo structure has changed or assets aren't where expected:
1. Search the repo more broadly: `find . -name "*.png" | head -50`
2. Check if there's a `resources/` or `data/` folder instead
3. As absolute last resort, improve the programmatic generation significantly — add texture/dithering to buildings, multi-layer trees with shadows, more detailed character sprites with visible hair/clothing features. But real sprites should be the priority.
# GOAL: Build a Pokémon HGSS-Style Explorable Portfolio Town

## Execution Instructions

**This project is broken into 6 sequential parts. Execute them IN ORDER. After completing each part, verify it works by checking for errors, then move to the next part. Do NOT skip ahead. Do NOT ask for input — make reasonable decisions and keep going.**

**The resume/links content modal is OUT OF SCOPE for now. The PokéMart building should exist visually in the town but show a "Coming soon!" dialogue when interacted with. Focus on making the game work smoothly.**

---

## PART 1: Project Setup + Asset Sourcing
1. Scaffold a Vite + React project (`npm create vite@latest . -- --template react`)
2. Install dependencies, clean out boilerplate
3. Add `Press Start 2P` Google Font to `index.html`
4. **Download assets from the Tuxemon project on GitHub** (CC-licensed, free for non-commercial use):
   - Browse the repo at `https://github.com/Tuxemon/Tuxemon` — assets live under `mods/tuxemon/gfx/`
   - Use `raw.githubusercontent.com` to download individual PNGs
   - **Tilesets**: Look in `mods/tuxemon/gfx/tilesets/` for top-down RPG tiles — grab grass, paths, trees, fences, building exteriors, doors, flowers, water
   - **Player sprite**: Look in `mods/tuxemon/gfx/sprites/player/` for trainer walk cycle sprites (4 directions × 3+ frames)
   - **NPC sprites**: Look in `mods/tuxemon/gfx/sprites/npc/` or use palette-swapped player sprites
   - If Tuxemon's folder structure doesn't match exactly, explore the repo to find the right paths — the assets ARE there
5. If any specific asset can't be found in Tuxemon, THEN generate it programmatically as a fallback using node-canvas or embed as base64. But try Tuxemon first — artist-made sprites look far better than generated ones.
6. Organize all assets into `public/assets/` — tileset.png (or individual tile PNGs), player.png (spritesheet), npcs.png
7. **Verify**: `npm run dev` should show the default React app. All asset files should exist in `public/assets/`.

---

## PART 2: Tile Map + Rendering
1. Define the town map as a JS module (`src/game/mapData.js`) with three layers:
   - `ground[][]` — tile IDs for grass, path, flowers
   - `collision[][]` — 0 = walkable, 1 = blocked
   - `interaction[][]` — 0 = nothing, positive integers = interaction trigger IDs
2. Map size: **20 tiles wide × 15 tiles tall** (320×240 base)
3. Layout:
   ```
   Row 0:     Trees all across (border)
   Row 1-2:   Trees border | [HOUSE red roof] gap [LAB blue roof] gap [GYM gray roof] | Trees border
   Row 3-4:   Trees | grass + vertical paths to doors | Trees
   Row 5-7:   Trees | horizontal main path, NPC positions on grass beside path | Trees  
   Row 8-9:   Trees | grass + vertical paths to doors | Trees
   Row 10-11:  Trees | [POKECENTER red+P] gap [POKEMART blue] | Trees border
   Row 12-13:  Trees | grass, flowers, sign near center | Trees
   Row 14:    Trees all across (border)
   ```
4. Create `src/game/renderer.js` — loads the tileset PNG, draws the ground layer tile by tile each frame
5. Create `src/game/GameCanvas.jsx` — React component that mounts a `<canvas>`, scales it to fill viewport with `image-rendering: pixelated`, runs `requestAnimationFrame` loop
6. Hook it up in `App.jsx` — full screen canvas, no scrollbars, black background
7. **Verify**: `npm run dev` should show the full town map rendered. Buildings, paths, trees all visible. No interactivity yet.

---

## PART 3: Player Movement + Collision
1. Create `src/game/player.js` — player state: grid position (tile x,y), facing direction, animation frame, movement interpolation progress
2. Create `src/game/input.js` — keyboard listener for Arrow keys + WASD + Space/Enter/Z (action) + Escape/X (close). Track which keys are currently pressed.
3. Implement grid-snapped movement:
   - Player moves in 16px tile increments
   - Smooth lerp between tiles over ~150ms
   - Cannot start new move while mid-move
   - Check `collision[][]` before allowing move to target tile
   - Update sprite animation frame while moving (cycle walk frames)
   - Player faces direction of last input when standing still
4. Add player rendering to the game loop — draw player sprite at interpolated pixel position, correct frame from spritesheet
5. Player spawns at center of the map (tile 10, 7 approximately)
6. Implement y-sorting: things above the player render behind, things below render in front (specifically tree canopies and building tops)
7. **Verify**: Player sprite visible on map, moves smoothly with arrow keys/WASD, stops at trees/buildings/fences, walk animation plays during movement.

---

## PART 4: Interactions + Dialogue System
1. Create `src/ui/DialogueBox.jsx` — Pokemon-style text box at bottom of screen:
   - Dark border, light fill, Press Start 2P font
   - Typewriter text effect (~30ms per character)
   - "▼" indicator when text is complete, press action to dismiss
   - Renders as a React overlay on top of the canvas
2. Create `src/game/interaction.js`:
   - When player presses action key, check the tile they're FACING
   - Look up `interaction[][]` for that tile
   - If non-zero, dispatch the interaction (NPC dialogue or building entry)
3. Create `src/game/npc.js` — NPC data: position, sprite, dialogue lines:
   - **NPC 1** (on main path): "Welcome to SAMAKSH TOWN! The local dev here builds some cool things."
   - **NPC 2** (near gym): "Check out the Gym — some serious engineering went down there."
4. Show "!" indicator when player is adjacent to and facing an interactable tile
5. NPC interactions open the DialogueBox with their lines
6. Building door interactions should also work (just show a placeholder dialogue for now: "You entered the [Building Name]!")
7. **Verify**: Walking up to NPCs and pressing Space shows dialogue with typewriter effect. Walking up to building doors shows entry message. "!" indicator appears near interactables.

---

## PART 5: Content Modals (Building Interiors)
1. Create `src/ui/ContentModal.jsx` — fullscreen overlay that appears when entering a building:
   - Fade to black transition (~300ms)
   - Pokemon-style bordered frame (pixel art border using CSS box-shadow or border-image)
   - Press Start 2P font
   - Close with Escape or a "← Back" button
   - Fade back to town on close
2. Create content files in `src/content/`:

   **about.js (House):**
   - Samaksh — McGill CS 2026 (Stats + Econ minors)
   - Based in Montreal
   - Working at Depix, a generative AI startup
   - Hack4Impact McGill — sponsorships & partnerships
   - Loves building tools, automation, and ML engineering

   **skills.js (Lab) — present as a "research catalog":**
   - Python, TypeScript/JavaScript, C++, Java, SQL
   - PyTorch, diffusion models, Claude API, LLM integrations
   - CUDA, GPU optimization, Docker
   - React, Next.js, Tailwind, PyQt6
   - Node.js, FastAPI, SQLite, PostgreSQL
   - Git, Linux, Unreal Engine, 3D Slicer

   **projects.js (Gym) — present as "gym challenges":**
   - **OPSIS**: Surgical neuronavigation GUI. Sub-100ms latency. PyQt6, open3d ICP, CUDA optimization.
   - **Depix / ImageLab**: Diffusion model integrations & GPU infrastructure at a gen-AI startup.
   - **RepoRadar**: Automated Instagram pipeline — trending GitHub repos → Claude evaluation → carousel generation → auto-publish.
   - **ProjectScout**: Python CLI scraping Twitter/LinkedIn for project inspiration. Claude-powered eval, SQLite, daily digests.

   **contact.js (Pokemon Center):**
   - Styled as "Let us heal your questions!"
   - Email, LinkedIn, GitHub links (use placeholder URLs for now)
   - "Open to opportunities" line

3. **PokéMart** — do NOT build a full modal. Just show a dialogue: "This shop is restocking... Come back soon!" (placeholder for resume section later)
4. Wire each building door's interaction ID to open the correct modal
5. **Verify**: Entering each building shows the correct styled content. Escape closes back to town. PokéMart shows placeholder dialogue.

---

## PART 6: Mobile Controls + Intro + Polish
1. Create `src/ui/DPad.jsx` — virtual d-pad for mobile/touch:
   - Semi-transparent overlay, bottom-left corner
   - 4 directional buttons (up/down/left/right)
   - "A" action button bottom-right
   - Only visible on touch-capable devices (use `ontouchstart` detection or media query for pointer: coarse)
   - Touch events feed into the same input system as keyboard
2. Create `src/ui/IntroSequence.jsx`:
   - On page load: black screen
   - After 500ms: Pokemon-style text box appears: "Welcome to SAMAKSH TOWN!" with typewriter effect
   - After text completes + user presses action (or 2 second auto-advance): fade into the town
3. Polish:
   - Add building label signs above each door (small pixel text or styled div overlays showing "HOME", "LAB", "GYM", "CENTER", "MART")
   - Ensure canvas properly resizes on window resize
   - Set page title to "Samaksh Town — Portfolio"
   - Add a subtle CSS scanline or CRT overlay effect (optional, very subtle, CSS only — just a repeating linear-gradient)
   - Ensure no scrollbars, no text selection on canvas, cursor set to default
4. Final check:
   - Test all 5 building interactions
   - Test both NPCs
   - Test keyboard AND mobile controls
   - Test window resize
   - Run `npm run build` and verify the dist/ output works
5. **Verify**: Full flow works end to end — intro → walk around → interact with everything → close modals → resume walking. Mobile d-pad works. Build succeeds.

---

## Technical Constraints
- **Canvas 2D only** — no WebGL
- **No game frameworks** — no Phaser, no PixiJS. Vanilla canvas + React for UI overlays.
- **All assets sourced from Tuxemon GitHub repo** (`raw.githubusercontent.com`) — these are CC-licensed and free. Only generate programmatically as a fallback if a specific sprite isn't available.
- **60fps target** — trivial for this scene size but don't do anything silly in the render loop
- **image-rendering: pixelated** on the canvas CSS for crisp pixel scaling
- **Google Font: Press Start 2P** — load via CDN link in index.html

## File Structure
```
pokemon-portfolio/
├── CLAUDE.md
├── goal.md                    (this file)
├── index.html
├── vite.config.js
├── package.json
├── scripts/
│   └── generate-assets.js     (fallback — only if Tuxemon assets unavailable)
├── public/
│   └── assets/
│       ├── tileset.png
│       ├── player.png
│       └── npcs.png
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── game/
│   │   ├── GameCanvas.jsx
│   │   ├── gameLoop.js
│   │   ├── player.js
│   │   ├── input.js
│   │   ├── mapData.js
│   │   ├── npc.js
│   │   ├── interaction.js
│   │   └── renderer.js
│   ├── ui/
│   │   ├── DialogueBox.jsx
│   │   ├── ContentModal.jsx
│   │   ├── DPad.jsx
│   │   └── IntroSequence.jsx
│   ├── content/
│   │   ├── about.js
│   │   ├── skills.js
│   │   ├── projects.js
│   │   └── contact.js
│   └── styles/
│       └── index.css
```
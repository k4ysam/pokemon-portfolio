"""Derive a 48x32 collision grid from public/assets/town-bg.png (1536x1024, 32px tiles).

Heuristic: a tile is walkable when most of its pixels are lawn-green or
path-tan AND it is not high-variance (tree canopies / buildings are busy).
Output: row-strings for mapData.js + a red-tinted overlay png for review.
"""
from PIL import Image, ImageDraw
import colorsys

TILE = 32
COLS, ROWS = 48, 32

img = Image.open(r"C:\Users\Samaksh\Documents\test\pkmn\public\assets\town-bg.png").convert("RGB")
px = img.load()


def classify(c0, r0):
    walk = 0
    total = TILE * TILE
    for y in range(r0 * TILE, (r0 + 1) * TILE):
        for x in range(c0 * TILE, (c0 + 1) * TILE):
            r, g, b = px[x, y]
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            deg = h * 360
            # lawn green: yellow-green hue, bright
            if 70 <= deg <= 140 and v > 0.55 and s > 0.3:
                walk += 1
            # path tan: orange-yellow hue, bright, moderate sat
            elif 25 <= deg <= 55 and v > 0.55 and 0.15 < s < 0.8:
                walk += 1
    return walk / total


grid = [[0 if classify(c, r) > 0.62 else 1 for c in range(COLS)] for r in range(ROWS)]

# ---- manual overrides from pixel-scan measurements ----
def block(c0, r0, c1, r1):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            grid[r][c] = 1


def open_(cells):
    for c, r in cells:
        grid[r][c] = 0


block(8, 3, 13, 8)    # HOME
block(19, 3, 26, 8)   # LAB
block(31, 3, 39, 8)   # GYM
block(9, 18, 16, 23)  # CONTACT
block(31, 18, 36, 23) # MISC
block(21, 15, 24, 17) # fountain pool (basin ring spills into col 24)
block(40, 10, 45, 13) # pond by GYM (incl. rock border)
block(4, 11, 8, 13)   # garden plot west of HOME
block(0, 0, COLS - 1, 2)         # top tree border
block(0, 0, 3, ROWS - 1)         # left tree border
block(COLS - 2, 0, COLS - 1, ROWS - 1)  # right tree border
block(0, 29, COLS - 1, ROWS - 1)  # bottom tree border (stairs lead off-map)
# NPCs/Pokemon wander dynamically (npc.js) — not baked into the grid

# LAB door approach: flower spill pushes (23,9) just over the threshold
open_([(23, 9)])

# ---- flood fill from spawn; anything unreachable becomes blocked ----
SPAWN = (22, 13)
seen = set()
stack = [SPAWN]
while stack:
    c, r = stack.pop()
    if (c, r) in seen or not (0 <= c < COLS and 0 <= r < ROWS) or grid[r][c]:
        continue
    seen.add((c, r))
    stack.extend([(c + 1, r), (c - 1, r), (c, r + 1), (c, r - 1)])
removed = [(c, r) for r in range(ROWS) for c in range(COLS) if grid[r][c] == 0 and (c, r) not in seen]
for c, r in removed:
    grid[r][c] = 1
print(f"reachable cells: {len(seen)}; removed unreachable: {removed}")

rows = ["".join(map(str, row)) for row in grid]
for row in rows:
    print(f"  '{row}',")

# overlay for visual review (1x with grid; review zoomed crops as needed)
ov = img.convert("RGBA")
tint = Image.new("RGBA", ov.size, (0, 0, 0, 0))
d = ImageDraw.Draw(tint)
for r in range(ROWS):
    for c in range(COLS):
        if grid[r][c] == 1:
            d.rectangle([c * TILE, r * TILE, (c + 1) * TILE - 1, (r + 1) * TILE - 1], fill=(255, 0, 0, 90))
for c in range(COLS + 1):
    d.line([(c * TILE, 0), (c * TILE, ov.height)], fill=(255, 255, 255, 100))
for r in range(ROWS + 1):
    d.line([(0, r * TILE), (ov.width, r * TILE)], fill=(255, 255, 255, 100))
Image.alpha_composite(ov, tint).convert("RGB").save(
    r"C:\Users\Samaksh\Documents\test\pkmn\collision-overlay.png"
)
print("overlay saved")

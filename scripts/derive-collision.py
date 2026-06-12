"""Derive a 25x20 collision grid from public/assets/town-bg.png (800x640, 32px tiles).

Heuristic: a tile is walkable when most of its pixels are lawn-green or
path-tan AND it is not high-variance (tree canopies / buildings are busy).
Output: row-strings for mapData.js + a red-tinted overlay png for review.
"""
from PIL import Image, ImageDraw
import colorsys

TILE = 32
COLS, ROWS = 25, 20

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
            if 70 <= deg <= 130 and v > 0.55 and s > 0.3:
                walk += 1
            # path tan: orange-yellow hue, bright, moderate sat
            elif 25 <= deg <= 55 and v > 0.6 and 0.15 < s < 0.75:
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


block(10, 0, 15, 5)   # LAB
block(3, 2, 7, 5)     # HOME
block(16, 1, 22, 5)   # GYM
block(5, 10, 9, 14)   # CONTACT
block(16, 10, 20, 14)  # LINKS
block(15, 11, 15, 14)  # LINKS awning west edge
block(11, 12, 13, 13)  # fountain pool
block(4, 6, 4, 6)     # HOME sign posts
block(8, 5, 8, 6)     # mailbox between HOME and LAB
block(3, 14, 3, 14)   # posts left of CONTACT
block(3, 10, 3, 10)   # flowers left of CONTACT roof
block(0, 19, 24, 19)  # bottom map edge
# NPCs/Pokemon wander dynamically (npc.js) — not baked into the grid

# fountain ring (corner bushes overlap slightly but stay passable) +
# path under the elevated welcome sign + south exit
open_([(14, 11), (10, 13), (14, 13)])
open_([(c, 14) for c in range(10, 15)])
open_([(c, 15) for c in range(10, 15)])
open_([(c, 16) for c in range(10, 15)])
open_([(11, 17), (12, 17), (13, 17)])

# ---- flood fill from spawn; anything unreachable becomes blocked ----
SPAWN = (12, 10)
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

grid = ["".join(map(str, row)) for row in grid]
for row in grid:
    print(f"  '{row}',")

# overlay for visual review
ov = img.resize((1600, 1280), Image.NEAREST).convert("RGBA")
tint = Image.new("RGBA", ov.size, (0, 0, 0, 0))
d = ImageDraw.Draw(tint)
for r in range(ROWS):
    for c in range(COLS):
        if grid[r][c] == "1":
            d.rectangle([c * 64, r * 64, (c + 1) * 64 - 1, (r + 1) * 64 - 1], fill=(255, 0, 0, 90))
for c in range(26):
    d.line([(c * 64, 0), (c * 64, 1280)], fill=(255, 255, 255, 120))
for r in range(21):
    d.line([(0, r * 64), (1600, r * 64)], fill=(255, 255, 255, 120))
Image.alpha_composite(ov, tint).convert("RGB").save(
    r"C:\Users\Samaksh\Documents\test\pkmn\collision-overlay.png"
)
print("overlay saved")

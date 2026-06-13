"""Process the Pokemon Center interior source image + review its collision.

Reads pkmn_center.png (repo root, 1536x1024, ChatGPT-generated on an implied
64px grid) and emits:
  public/assets/center-bg.png                  768x512 (24x16 tiles @ 32px)
  scripts/assets-src/center-grid.png           2x grid overlay for measuring
  scripts/assets-src/center-collision-review.png  red-tinted blocked tiles

The collision itself is hand-authored (interior floors don't fit the town's
color heuristic) and lives in src/game/maps/center.js — this script parses it
from there, so the review always reflects the real grid. Rerun after editing
the image or the collision rows.
"""
import os
import re

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "pkmn_center.png")
OUT_BG = os.path.join(ROOT, "public", "assets", "center-bg.png")
OUT_GRID = os.path.join(ROOT, "scripts", "assets-src", "center-grid.png")
OUT_REVIEW = os.path.join(ROOT, "scripts", "assets-src", "center-collision-review.png")
MAP_JS = os.path.join(ROOT, "src", "game", "maps", "center.js")

TILE = 32
COLS, ROWS = 24, 16

# ---- downscale 2x so tiles land on the game's 32px grid ----
src = Image.open(SRC).convert("RGB")
assert src.size == (1536, 1024), src.size
bg = src.resize((COLS * TILE, ROWS * TILE), Image.LANCZOS)
bg.save(OUT_BG)

# ---- parse the hand-authored collision rows out of center.js ----
js = open(MAP_JS, encoding="utf-8").read()
block = re.search(r"COLLISION_ROWS = \[(.*?)\]", js, re.S).group(1)
rows = re.findall(r"'([01]{%d})'" % COLS, block)
assert len(rows) == ROWS, f"expected {ROWS} rows, found {len(rows)}"

# ---- 2x grid overlay (tile coords every 2 tiles) for measuring ----
grid = bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST)
d = ImageDraw.Draw(grid)
for c in range(COLS + 1):
    d.line([(c * 64, 0), (c * 64, grid.height)], fill=(255, 0, 255), width=1)
for r in range(ROWS + 1):
    d.line([(0, r * 64), (grid.width, r * 64)], fill=(255, 0, 255), width=1)
for c in range(0, COLS, 2):
    for r in range(0, ROWS, 2):
        d.text((c * 64 + 3, r * 64 + 2), f"{c},{r}", fill=(255, 255, 0))
grid.save(OUT_GRID)

# ---- red-tinted collision review ----
review = bg.convert("RGBA")
tint = Image.new("RGBA", review.size, (0, 0, 0, 0))
red = Image.new("RGBA", (TILE, TILE), (255, 0, 0, 110))
for r, row in enumerate(rows):
    for c, ch in enumerate(row):
        if ch == "1":
            tint.paste(red, (c * TILE, r * TILE))
review.alpha_composite(tint)
review.resize((review.width * 2, review.height * 2), Image.NEAREST).save(OUT_REVIEW)

print(f"center-bg.png {bg.size}, review + grid overlays written")

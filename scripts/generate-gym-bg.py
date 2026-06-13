"""Generate gym-bg.png programmatically — 768x512 (24x16 tiles @ 32px).

Layout matches gym.js collision:
  - Rows 0-1  : back wall
  - Row  2    : trophy/badge display (blocked, behind leader)
  - Row  3    : leader platform (blocked; player faces from row 4)
  - Row  4    : platform front step (walkable; interact with leader)
  - Rows 5-12 : battle floor — project stations at left/right edges
  - Row  13   : exit mat (step-on trigger, cols 10-12 open)
  - Rows 14-15: front wall
  - Cols 0, 23: side walls throughout
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "assets", "gym-bg.png")

T = 32
COLS, ROWS = 24, 16
W, H = COLS * T, ROWS * T  # 768 x 512

img = Image.new("RGB", (W, H))
d = ImageDraw.Draw(img)


def fill(c0, r0, c1, r1, color):
    d.rectangle([c0 * T, r0 * T, (c1 + 1) * T - 1, (r1 + 1) * T - 1], fill=color)


def tile(c, r, base, hi=None, sh=None):
    x, y = c * T, r * T
    d.rectangle([x, y, x + T - 1, y + T - 1], fill=base)
    if hi:
        d.line([(x, y), (x + T - 2, y)], fill=hi)
        d.line([(x, y), (x, y + T - 2)], fill=hi)
    if sh:
        d.line([(x + T - 1, y + 1), (x + T - 1, y + T - 1)], fill=sh)
        d.line([(x + 1, y + T - 1), (x + T - 1, y + T - 1)], fill=sh)


# Palette
WALL_D = (42, 35, 52)
WALL_M = (62, 52, 76)
WALL_L = (84, 70, 100)
FL_A   = (188, 168, 128)
FL_B   = (168, 150, 112)
PL_D   = (80, 62, 112)
PL_M   = (98, 78, 135)
PL_L   = (118, 96, 158)
CTRM   = (132, 108, 178)
LDRTL  = (148, 122, 195)
ST_D   = (55, 82, 125)
ST_M   = (72, 102, 148)
ST_L   = (90, 122, 168)
MAT_D  = (168, 32, 32)
MAT_M  = (192, 48, 48)
MAT_L  = (215, 68, 68)
DR_D   = (48, 65, 85)
DR_M   = (65, 85, 108)
GD_D   = (148, 112, 30)
GD_M   = (198, 158, 52)
GD_L   = (228, 192, 80)
STAR   = (210, 185, 65)

# ── 1. Checkerboard floor (base layer) ──────────────────────────────────────
for r in range(ROWS):
    for c in range(COLS):
        tile(c, r, FL_A if (c + r) % 2 == 0 else FL_B)

# ── 2. Back wall rows 0-1 ────────────────────────────────────────────────────
for r in range(2):
    for c in range(COLS):
        tile(c, r, WALL_M, hi=WALL_L, sh=WALL_D)
    # Brick mortar — horizontal joints
    d.line([(0, (r + 1) * T - 1), (W - 1, (r + 1) * T - 1)], fill=WALL_D)
    # Brick mortar — vertical joints (staggered)
    for c in range(COLS):
        jx = c * T + (T // 2 if r % 2 else 0)
        if jx % T == 0:
            d.line([(jx, r * T), (jx, (r + 1) * T - 1)], fill=WALL_D)

# Side wall columns (col 0, col 23) for rows 2-15
for r in range(2, ROWS):
    tile(0,  r, WALL_M, hi=WALL_L, sh=WALL_D)
    tile(23, r, WALL_M, hi=WALL_L, sh=WALL_D)

# ── 3. Front wall rows 14-15, plus row 13 except door cols 10-12 ────────────
for r in range(14, ROWS):
    for c in range(COLS):
        tile(c, r, WALL_M, hi=WALL_L, sh=WALL_D)

for c in range(COLS):
    if 10 <= c <= 12:
        continue
    tile(c, 13, WALL_M, hi=WALL_L, sh=WALL_D)

# ── 4. Leader platform (rows 2-4, cols 4-19) ────────────────────────────────
# Row 2 — trophy/badge display strip
for c in range(4, 20):
    tile(c, 2, PL_D, hi=PL_M, sh=WALL_D)

# Trophy case highlights (cols 10-13)
for c in range(10, 14):
    tile(c, 2, GD_M, hi=GD_L, sh=GD_D)
    cx, cy = c * T + T // 2, 2 * T + T // 2
    d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=GD_D, outline=GD_L)
    d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=GD_L)

# Row 3 — leader zone
for c in range(4, 20):
    tile(c, 3, PL_M, hi=PL_L, sh=PL_D)

for c in range(10, 14):
    tile(c, 3, LDRTL, hi=(165, 140, 210), sh=PL_M)

# Row 4 — platform step (walkable; full row 4 cols 1-22)
# Paint only the raised step cols 4-19; side floor cols already done
for c in range(4, 20):
    tile(c, 4, PL_L, hi=CTRM, sh=PL_M)

for c in range(8, 16):
    tile(c, 4, CTRM, hi=(155, 130, 200), sh=PL_L)
    d.line([(c * T, 4 * T), (c * T + T - 1, 4 * T)], fill=(165, 140, 210), width=2)

# 3D ledge shadow below step
d.line([(4 * T, 5 * T - 1), (19 * T + T - 1, 5 * T - 1)], fill=PL_D, width=2)

# ── 5. Project stations — left (cols 1-3) and right (cols 20-22) rows 6, 8 ──
for c_range, side in [((1, 4), 'L'), ((20, 23), 'R')]:
    for c in range(*c_range):
        for r in [6, 8]:
            tile(c, r, ST_M, hi=ST_L, sh=ST_D)
            # Small monitor screen
            sx, sy = c * T + 5, r * T + 7
            d.rectangle([sx, sy, sx + T - 11, sy + T - 14], fill=ST_D, outline=ST_L)
            d.rectangle([sx + 2, sy + 2, sx + T - 13, sy + T - 16], fill=(18, 38, 75))
            # Green "on" pixel
            d.rectangle([sx + 4, sy + 4, sx + 7, sy + 6], fill=(60, 210, 80))

# ── 6. Battle lane markers (cols 8-15, rows 5-12) ───────────────────────────
# Subtle floor brightening on the center challenge lane
for r in range(5, 13):
    for c in range(8, 16):
        base = (195, 176, 138) if (c + r) % 2 == 0 else (178, 160, 122)
        tile(c, r, base)

# Lane boundary lines
for r in range(5, 13):
    d.line([(8 * T, r * T), (8 * T, (r + 1) * T - 1)],  fill=STAR, width=2)
    d.line([(15 * T + T - 1, r * T), (15 * T + T - 1, (r + 1) * T - 1)], fill=STAR, width=2)

# Star dot markers on lane at rows 6, 9, 12 (guide player upward)
for r in [6, 9, 12]:
    cx = (8 + (15 - 8) // 2) * T + T // 2  # centre of lane cols 8-15
    cy = r * T + T // 2
    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=STAR, outline=GD_D)
    d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=GD_L)

# ── 7. Exit mat (row 13, cols 10-12) ────────────────────────────────────────
for c in range(10, 13):
    tile(c, 13, MAT_M, hi=MAT_L, sh=MAT_D)
    cx, cy = c * T + T // 2, 13 * T + T // 2
    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=MAT_D, outline=MAT_L)

# Door glass panels in front wall (rows 14-15, cols 10-12)
for c in range(10, 13):
    tile(c, 14, DR_M, hi=(85, 108, 135), sh=DR_D)
    tile(c, 15, DR_D, hi=WALL_M, sh=WALL_D)
    # Vertical divider line on glass
    mx = c * T + T // 2
    d.line([(mx, 14 * T + 2), (mx, 15 * T + T - 3)], fill=DR_D, width=1)

img.save(OUT, "PNG")
print(f"Generated gym-bg.png: {W}x{H}")

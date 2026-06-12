#!/usr/bin/env python3
"""Pack Tuxemon source art into the game's runtime assets.

Reads source tilesets/sprites from scripts/assets-src/ and emits:
  public/assets/tileset.png   16x16 ground + small "tall" tiles (linear ids, 8 cols)
  public/assets/objects.png   multi-tile stamps (buildings, trees, fountain, sign)
  public/assets/player.png    4-dir x 3-frame overworld player sheet (CHAR_W x CHAR_H cells)
  public/assets/npcs.png      one down-facing overworld frame per NPC

Run:  python scripts/pack-assets.py
Source art: Tuxemon (CC BY-SA / GPL). See scripts/assets-src/ATTRIBUTION.md.
"""
from __future__ import annotations

import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "assets-src")
OUT = os.path.join(ROOT, "public", "assets")
os.makedirs(OUT, exist_ok=True)

TILE = 16
CHAR_W, CHAR_H = 24, 32  # overworld character frame

proto = Image.open(os.path.join(SRC, "prototyping_outdoor.png")).convert("RGBA")
bld = Image.open(os.path.join(SRC, "core_buildings.png")).convert("RGBA")


def ptile(c, r):
    """One 16x16 tile from prototyping_outdoor."""
    return proto.crop((c * TILE, r * TILE, (c + 1) * TILE, (r + 1) * TILE))


def pcrop(c, r, w, h):
    """A w x h tile rect from prototyping_outdoor."""
    return proto.crop((c * TILE, r * TILE, (c + w) * TILE, (r + h) * TILE))


def bcrop(c0, r0, c1, r1):
    return bld.crop((c0 * TILE, r0 * TILE, c1 * TILE, r1 * TILE))


def over(base, sprite):
    """Composite a (transparent) sprite tile over an opaque base tile."""
    im = base.copy()
    im.alpha_composite(sprite)
    return im


def grade_grass(im, sat=1.28, val=0.98):
    """Push the pale Tuxemon grass toward the richer green of the reference
    art (saturation boost, slight darken). Applied to the grass source only;
    every grass-backed tile composites over it, so the grade stays uniform."""
    import colorsys
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            nr, ng, nb = colorsys.hsv_to_rgb(h, min(1.0, s * sat), min(1.0, v * val))
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return out


GRASS = grade_grass(ptile(1, 1))       # plain grass
GRASS_DECO = grade_grass(ptile(1, 4))  # grass with white tuft accents


# ---------------------------------------------------------------- flowers
def make_flowers(base, seed_pts, palette):
    """Composite small flowers onto a grass base tile."""
    im = base.copy()
    px = im.load()
    for i, (x, y) in enumerate(seed_pts):
        col = palette[i % len(palette)]
        # tiny 3px flower: center + 4 petals
        for dx, dy in [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]:
            xx, yy = x + dx, y + dy
            if 0 <= xx < TILE and 0 <= yy < TILE:
                c = col if (dx or dy) else (250, 240, 150)
                px[xx, yy] = (*c, 255)
    return im


FLOWERS = make_flowers(
    GRASS, [(3, 4), (10, 9), (12, 4), (5, 11)],
    [(225, 70, 70), (245, 215, 80), (235, 235, 245), (210, 110, 210)],
)
FLOWERS2 = make_flowers(
    GRASS, [(4, 3), (11, 5), (6, 10), (12, 12)],
    [(245, 245, 250), (245, 215, 80), (245, 245, 250)],
)


# ---------------------------------------------------------------- treetop fill
# A single foliage tile has transparent gaps; overlap five copies (corners +
# center of a 2x2 area, then crop the middle) for a solid canopy wall.
def make_treetop():
    fol = ptile(18, 0)
    big = Image.new("RGBA", (3 * TILE, 3 * TILE), (0, 0, 0, 0))
    for ty in range(0, 3 * TILE, TILE):
        for tx in range(0, 3 * TILE, TILE):
            big.alpha_composite(fol, (tx, ty))
    for ty in (TILE // 2, TILE + TILE // 2):
        for tx in (TILE // 2, TILE + TILE // 2):
            big.alpha_composite(fol, (tx, ty))
    return over(GRASS, big.crop((TILE, TILE, 2 * TILE, 2 * TILE)))


TREETOP = make_treetop()


# ---------------------------------------------------------------- bush
# The round shrub at (19,16) is baked onto plain pale grass; exact positional
# diff against that grass tile recovers a transparent sprite.
def key_against(sprite, bg):
    out = sprite.copy()
    sp, bp = out.load(), bg.load()
    for y in range(out.height):
        for x in range(out.width):
            if sp[x, y] == bp[x % TILE, y % TILE]:
                sp[x, y] = (0, 0, 0, 0)
    return out


BUSH = over(GRASS, key_against(ptile(19, 16), GRASS))

# ---------------------------------------------------------------- path autotile
# Transparent sandy-path autotile pieces in prototyping_outdoor:
#   3x3 edge block at (6,5)-(8,7)  (rounded outer border, transparent corners)
#   inner-corner tiles at (6,8)-(7,9) (notch at BR, BL, TR, TL respectively)
# Each 16-variant tile (mask bits N=1 E=2 S=4 W=8; bit set = neighbour IS path)
# is assembled from four 8x8 quadrants and composited over grass.
P_NW, P_N, P_NE = ptile(6, 5), ptile(7, 5), ptile(8, 5)
P_W, P_C, P_E = ptile(6, 6), ptile(7, 6), ptile(8, 6)
P_SW, P_S, P_SE = ptile(6, 7), ptile(7, 7), ptile(8, 7)
IC_BR, IC_BL = ptile(6, 8), ptile(7, 8)
IC_TR, IC_TL = ptile(6, 9), ptile(7, 9)

# per-quadrant source tile: (corner-pos, vert-bit, horz-bit) -> tile for the
# four neighbour cases (both grass, vert path only, horz path only, both path)
QUADS = {
    # (qx, qy): (vert bit, horz bit, corner tile, v-edge tile, h-edge tile, inner tile)
    (0, 0): (1, 8, P_NW, P_W, P_N, IC_TL),  # TL: vert=N, horz=W
    (1, 0): (1, 2, P_NE, P_E, P_N, IC_TR),  # TR: vert=N, horz=E
    (0, 1): (4, 8, P_SW, P_W, P_S, IC_BL),  # BL: vert=S, horz=W
    (1, 1): (4, 2, P_SE, P_E, P_S, IC_BR),  # BR: vert=S, horz=E
}


def path_variant(mask):
    im = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    for (qx, qy), (vbit, hbit, t_corner, t_vedge, t_hedge, t_inner) in QUADS.items():
        vp, hp = bool(mask & vbit), bool(mask & hbit)
        if vp and hp:
            src = t_inner
        elif vp:
            src = t_vedge  # path continues vertically -> border on the side
        elif hp:
            src = t_hedge  # path continues horizontally -> border on top/bottom
        else:
            src = t_corner
        q = src.crop((qx * 8, qy * 8, qx * 8 + 8, qy * 8 + 8))
        im.alpha_composite(q, (qx * 8, qy * 8))
    return over(GRASS, im)


PATH_VARIANTS = [path_variant(m) for m in range(16)]

# ---------------------------------------------------------------- tileset.png
# index -> 16x16 image. Order MUST match src/game/constants.js T map.
tiles = [
    GRASS,                    # 0 GRASS
    GRASS_DECO,               # 1 GRASS2 (white tuft accents)
    over(GRASS, P_C),         # 2 PATH (plain sandy center)
    ptile(1, 6),              # 3 SAND (plain tan)
    ptile(13, 11),            # 4 WATER (wavy)
    ptile(1, 16),             # 5 COBBLE (plaza stone)
    FLOWERS,                  # 6 FLOWERS (mixed)
    FLOWERS2,                 # 7 FLOWERS2 (white/yellow)
    TREETOP,                  # 8 TREETOP  (dense foliage border fill)
    BUSH,                     # 9 BUSH (round shrub)
    ptile(18, 1),             # 10 ROCK
    over(GRASS, ptile(21, 6)),   # 11 FENCE_H (picket fence)
    over(GRASS, ptile(21, 7)),   # 12 FENCE_POST
    over(GRASS, ptile(21, 9)),   # 13 SIGN (small board)
    over(GRASS, ptile(15, 8)),   # 14 TREE_TOP (legacy slot: pine top)
    over(GRASS, ptile(15, 9)),   # 15 TREE_BOT (legacy slot: pine trunk)
] + PATH_VARIANTS             # 16..31 PATH autotile (mask N=1 E=2 S=4 W=8)

COLS = 8
rows = (len(tiles) + COLS - 1) // COLS
tileset = Image.new("RGBA", (COLS * TILE, rows * TILE), (0, 0, 0, 0))
for i, t in enumerate(tiles):
    tileset.alpha_composite(t, ((i % COLS) * TILE, (i // COLS) * TILE))
tileset.save(os.path.join(OUT, "tileset.png"))

# ---------------------------------------------------------------- buildings
# Distinct buildings straight from core_buildings.png (no recolouring):
#   red-roof cabin (Tilemap 0 section)      -> HOME
#   blue storefront                          -> LAB
#   yellow storefront                        -> GYM
#   red storefront with "+" medallion        -> CENTER (contact)
#   green storefront with "+" medallion      -> MART (links)
# All stamps are 5x4 tiles with the door at local tile (3, 3).

# The cabin isn't tile-aligned in the sheet: crop a generous box, trim to the
# sprite via bbox, then pad to 80x80 (bottom-anchored, centred) so it shares
# the storefronts' 5-wide footprint with the door at local col 3.
_cab = bld.crop((186, 312, 270, 402))
_cab = _cab.crop(_cab.getbbox())
home_cab = Image.new("RGBA", (80, 80), (0, 0, 0, 0))
home_cab.alpha_composite(_cab, ((80 - _cab.width) // 2, 80 - _cab.height))

BUILDINGS = {
    "home":   (home_cab, 3, 3),
    "lab":    (bcrop(10, 5, 15, 9),   3, 3),
    "gym":    (bcrop(15, 5, 20, 9),   3, 3),
    "center": (bcrop(20, 5, 25, 9),   3, 3),
    "mart":   (bcrop(25, 5, 30, 9),   3, 3),
}

# ---------------------------------------------------------------- trees
# Natively transparent sprites in prototyping_outdoor.
pine = pcrop(15, 8, 1, 2)        # skinny pine, 1x2
pine_big = pcrop(16, 8, 2, 2)    # broad pine, 2x2
tree_round = pcrop(15, 10, 1, 2)  # narrow round tree, 1x2

# ---------------------------------------------------------------- fountain
# Hand-drawn 2x2-tile stone fountain: rounded stone rim, blue water with wave
# accents, central jet with spray — matching the reference art's fountain.
def make_fountain():
    F = 2 * TILE
    im = Image.new("RGBA", (F, F), (0, 0, 0, 0))
    px = im.load()
    OUTLINE = (58, 64, 88, 255)
    RIM = (198, 204, 216, 255)
    RIM_D = (148, 155, 173, 255)
    WATER = (74, 134, 208, 255)
    WAVE = (140, 190, 240, 255)
    WHITE = (244, 250, 255, 255)
    SPRAY = (180, 222, 248, 255)

    CUT = 4  # rounded corner cut
    for y in range(F):
        for x in range(F):
            cx, cy = min(x, F - 1 - x), min(y, F - 1 - y)
            if cx + cy < CUT:
                continue  # outside the rounded silhouette
            on_outline = cx == 0 or cy == 0 or cx + cy == CUT
            in_rim = cx < 4 or cy < 4 or cx + cy < CUT + 4
            if on_outline:
                px[x, y] = OUTLINE
            elif in_rim:
                px[x, y] = RIM_D if y >= F - 7 else RIM
            else:
                px[x, y] = WATER
    # inner rim shadow line (top of the water)
    for x in range(5, F - 5):
        if px[x, 4][:3] == WATER[:3]:
            px[x, 4] = (54, 99, 168, 255)
    # wave accents
    for x, y in [(7, 12), (8, 12), (22, 10), (23, 10), (7, 22), (8, 22),
                 (23, 22), (24, 22), (12, 25), (13, 25), (19, 8), (20, 8)]:
        if px[x, y][:3] == WATER[:3]:
            px[x, y] = WAVE
    # central pedestal + jet + spray
    for x in range(13, 19):
        px[x, 17] = OUTLINE
        px[x, 15] = RIM
        px[x, 16] = RIM_D
    for x, y in [(15, 7), (16, 7), (15, 8), (16, 8)]:
        px[x, y] = WHITE
    for x, y in [(14, 9), (17, 9), (15, 10), (16, 10), (13, 11), (18, 11),
                 (15, 12), (16, 12), (12, 13), (19, 13), (14, 13), (17, 13)]:
        px[x, y] = SPRAY
    return im


fountain = make_fountain()

# ---------------------------------------------------------------- town sign
# Custom 2x1 wooden welcome board (text is an HTML overlay in App.jsx).
sign_town = Image.new("RGBA", (2 * TILE, TILE), (0, 0, 0, 0))
spx = sign_town.load()
BOARD, BORDER, LIGHT, LEG = (200, 152, 88, 255), (110, 66, 38, 255), (226, 189, 126, 255), (138, 90, 54, 255)
for y in range(1, 11):
    for x in range(2, 30):
        edge = y in (1, 10) or x in (2, 29)
        spx[x, y] = BORDER if edge else (LIGHT if y == 2 else BOARD)
for x, y in [(2, 1), (29, 1), (2, 10), (29, 10)]:  # soften corners
    spx[x, y] = (0, 0, 0, 0)
for leg_x in (6, 24):  # legs
    for y in range(11, 16):
        spx[leg_x, y] = BORDER
        spx[leg_x + 1, y] = LEG
        spx[leg_x + 2, y] = BORDER
for y in (4, 6, 8):  # text dashes
    for x in range(6, 26, 1):
        if (x + y) % 3:
            spx[x, y] = BORDER

# ---------------------------------------------------------------- objects.png
# Horizontal strip of stamps; record pixel rects for src/game/objects.
OBJ = []  # (key, image)
for name, (img, *_rest) in BUILDINGS.items():
    OBJ.append((f"bld_{name}", img))
OBJ.append(("pine", pine))
OBJ.append(("pine_big", pine_big))
OBJ.append(("tree_round", tree_round))
OBJ.append(("fountain", fountain))
OBJ.append(("sign_town", sign_town))

oh = max(im.height for _, im in OBJ)
ow = sum(im.width for _, im in OBJ)
objects = Image.new("RGBA", (ow, oh), (0, 0, 0, 0))
rects = {}
x = 0
for key, im in OBJ:
    objects.alpha_composite(im, (x, 0))
    rects[key] = (x, 0, im.width, im.height)
    x += im.width
objects.save(os.path.join(OUT, "objects.png"))

# emit a JS table of object rects + building door info
door_info = {f"bld_{n}": (d[1], d[2]) for n, d in BUILDINGS.items()}
with open(os.path.join(ROOT, "src", "game", "objectAtlas.js"), "w") as f:
    f.write("// AUTO-GENERATED by scripts/pack-assets.py - do not edit by hand.\n")
    f.write("// key -> [sx, sy, w, h] pixel rect within public/assets/objects.png\n")
    f.write("export const OBJ_RECTS = {\n")
    for key, (sx, sy, w, h) in rects.items():
        f.write(f"  {key}: [{sx}, {sy}, {w}, {h}],\n")
    f.write("}\n\n")
    f.write("// building key -> [doorLocalCol, doorLocalRow]\n")
    f.write("export const BUILDING_DOORS = {\n")
    for key, (dc, dr) in door_info.items():
        f.write(f"  {key}: [{dc}, {dr}],\n")
    f.write("}\n")

# ---------------------------------------------------------------- characters
# Hand-drawn HGSS-style mini trainers (Tuxemon has no overworld walk sheets).
# 13x19 px sprites from ASCII templates; 4 directions x 3 walk frames.
SPR_W, SPR_H = 13, 19

# head + torso (13 rows); legs (6 rows) appended per frame
HEAD_FRONT = [
    ".....CCCC....",
    "...CCCCCCC...",
    "..CCCCCCCCC..",
    "..ccccccccc..",
    "..HHHHHHHHH..",
    "..HFFFFFFFH..",
    "..HFEFFFEFH..",
    "...FFFFFFF...",
    "....SSSSS....",
    "..SSSSSSSSS..",
    ".SSSSSSSSSSS.",
    ".FSSSSSSSSSF.",
    "...SSSSSSS...",
]
HEAD_BACK = [
    ".....CCCC....",
    "...CCCCCCC...",
    "..CCCCCCCCC..",
    "..CCCCCCCCC..",
    "..HHHHHHHHH..",
    "..HHHHHHHHH..",
    "..HHHHHHHHH..",
    "...HHHHHHH...",
    "....SSSSS....",
    "..SSSSSSSSS..",
    ".SSSSSSSSSSS.",
    ".FSSSSSSSSSF.",
    "...SSSSSSS...",
]
HEAD_LEFT = [
    ".....CCCC....",
    "...CCCCCCC...",
    "..CCCCCCCCC..",
    "..cccccCCCC..",
    "..HHHHHHHHH..",
    "..HFFFFFHHH..",
    "..HFEFFFHHH..",
    "...FFFFFHH...",
    "....SSSSS....",
    "...SSSSSSS...",
    "..SSSSSSSSS..",
    "..FSSSSSSSS..",
    "...SSSSSSS...",
]
LEGS_IDLE = [
    "...PPPPPPP...",
    "...PPPPPPP...",
    "...PP...PP...",
    "...PP...PP...",
    "...BB...BB...",
    "..BBB...BBB..",
]
LEGS_SIDE = [
    "...PPPPPPP...",
    "...PPPPPPP...",
    "....PP.PP....",
    "....PP.PP....",
    "....BB.BB....",
    "...BBB.BBB...",
]


def pixel_sprite(rows, pal):
    im = Image.new("RGBA", (SPR_W, SPR_H), (0, 0, 0, 0))
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            c = pal.get(ch)
            if c:
                px[x, y] = (*c, 255)
    return im


def to_cell(im, dy=0):
    cell = Image.new("RGBA", (CHAR_W, CHAR_H), (0, 0, 0, 0))
    cell.alpha_composite(im, ((CHAR_W - SPR_W) // 2, CHAR_H - SPR_H + dy))
    return cell


def step_frame(idle, lift_left):
    """Walk frame: body bobs up 1px and one foot lifts (its bottom rows clear)."""
    im = Image.new("RGBA", (SPR_W, SPR_H), (0, 0, 0, 0))
    im.alpha_composite(idle, (0, -1))
    px = im.load()
    half = SPR_W // 2
    xs = range(0, half) if lift_left else range(half, SPR_W)
    for y in (SPR_H - 1, SPR_H - 2):
        for x in xs:
            px[x, y] = (0, 0, 0, 0)
    return im


def trainer_sheet(colors, cap=True):
    """4-dir x 3-frame CHAR_W x CHAR_H sheet. Rows: DOWN, UP, LEFT, RIGHT."""
    pal = dict(colors)
    if not cap:  # bare head: hair replaces the cap
        pal["C"] = pal["H"]
        pal["c"] = pal["H"]
    front = pixel_sprite(HEAD_FRONT + LEGS_IDLE, pal)
    back = pixel_sprite(HEAD_BACK + LEGS_IDLE, pal)
    left = pixel_sprite(HEAD_LEFT + LEGS_SIDE, pal)
    right = left.transpose(Image.FLIP_LEFT_RIGHT)
    sheet = Image.new("RGBA", (3 * CHAR_W, 4 * CHAR_H), (0, 0, 0, 0))
    for r, idle in enumerate([front, back, left, right]):
        frames = [step_frame(idle, True), idle, step_frame(idle, False)]
        for col, fr in enumerate(frames):
            sheet.alpha_composite(to_cell(fr), (col * CHAR_W, r * CHAR_H))
    return sheet


PLAYER_COLORS = {  # red cap, blue shirt — classic trainer
    "C": (214, 56, 50), "c": (150, 32, 30), "H": (56, 42, 36),
    "F": (244, 205, 168), "E": (38, 38, 48), "S": (58, 108, 196),
    "P": (62, 62, 76), "B": (74, 52, 46),
}
NPC_COLORS = [
    {  # NPC1: brown-haired, green shirt
        "C": (0, 0, 0), "c": (0, 0, 0), "H": (110, 74, 44),
        "F": (240, 198, 160), "E": (38, 38, 48), "S": (92, 152, 92),
        "P": (96, 78, 60), "B": (70, 52, 44),
    },
    {  # NPC2: red-haired, rose shirt
        "C": (0, 0, 0), "c": (0, 0, 0), "H": (182, 74, 52),
        "F": (246, 206, 170), "E": (38, 38, 48), "S": (204, 96, 116),
        "P": (90, 90, 104), "B": (76, 56, 50),
    },
]

player_sheet = trainer_sheet(PLAYER_COLORS, cap=True)
player_sheet.save(os.path.join(OUT, "player.png"))

# NPCs: one down-facing idle frame each, packed left-to-right
npc_sheet = Image.new("RGBA", (len(NPC_COLORS) * CHAR_W, CHAR_H), (0, 0, 0, 0))
for i, colors in enumerate(NPC_COLORS):
    fr = trainer_sheet(colors, cap=False)
    npc_sheet.alpha_composite(fr.crop((CHAR_W, 0, 2 * CHAR_W, CHAR_H)), (i * CHAR_W, 0))
npc_sheet.save(os.path.join(OUT, "npcs.png"))

print("Packed assets:")
for fn in ("tileset.png", "objects.png", "player.png", "npcs.png"):
    p = os.path.join(OUT, fn)
    print(f"  {fn}: {Image.open(p).size}")
print("Object rects:", list(rects.keys()))

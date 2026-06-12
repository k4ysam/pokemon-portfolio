#!/usr/bin/env python3
"""Pack source art into the game's runtime assets.

Reads source tilesets/sprites from scripts/assets-src/ and emits:
  public/assets/tileset.png   16x16 ground + small "tall" tiles (linear ids, 8 cols)
  public/assets/objects.png   multi-tile stamps (buildings, trees, fountain, sign)
  public/assets/player.png    4-dir x 3-frame overworld player sheet (CHAR_W x CHAR_H cells)
  public/assets/npcs.png      one down-facing overworld frame per NPC

Run:  python scripts/pack-assets.py
Sources (see scripts/assets-src/ATTRIBUTION.md):
  Tuxemon (CC BY-SA / GPL)            ground tiles, trees
  HGSS rips (spriters-resource)       player + NPC overworld sprites
  Sinnoh Tiles by Kyledove & Speed    buildings (custom, credit required)
"""
from __future__ import annotations

import collections
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
ethan = Image.open(os.path.join(SRC, "hgss", "ethan.png")).convert("RGBA")
trainers = Image.open(os.path.join(SRC, "hgss", "trainers-overworld.png")).convert("RGBA")
sinnoh = Image.open(os.path.join(SRC, "hgss", "sinnoh-tiles-outdoor.png")).convert("RGBA")
emotions = Image.open(os.path.join(SRC, "hgss", "emotions.png")).convert("RGBA")


def keyed(sheet, x0, y0, x1, y1, bg):
    """Crop the inclusive box and turn the flat background color transparent."""
    fr = sheet.crop((x0, y0, x1 + 1, y1 + 1))
    px = fr.load()
    for yy in range(fr.height):
        for xx in range(fr.width):
            if px[xx, yy][:3] == bg[:3]:
                px[xx, yy] = (0, 0, 0, 0)
    return fr


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
# Gen-4 style buildings from the Sinnoh Tiles (Outdoor) custom sheet by
# Kyledove & Speed (credit required — see ATTRIBUTION.md):
#   blue gable house    -> HOME      teal gable house     -> LAB
#   green warehouse     -> GYM       orange Pokeball dome -> CENTER
#   blue Mart dome      -> MART
# Every stamp is padded to 80px (5 tiles) wide and bottom-anchored; heights
# vary (tall roofs y-sort over whatever stands behind them). The door column
# differs per sprite, so each entry carries its own door tile.


def sin_stamp(x, y, w, h, pad_left):
    """Crop a building from the white-bg Sinnoh sheet and make the exterior
    white transparent (flood fill from a 1px margin, so white *windows* etc.
    inside the silhouette are kept), then left-pad into an 80px-wide cell."""
    box = sinnoh.crop((x - 1, y - 1, x + w + 1, y + h + 1))
    px = box.load()
    bw, bh = box.size
    queue = collections.deque(
        [(xx, 0) for xx in range(bw)] + [(xx, bh - 1) for xx in range(bw)]
        + [(0, yy) for yy in range(bh)] + [(bw - 1, yy) for yy in range(bh)]
    )
    while queue:
        cx, cy = queue.popleft()
        if not (0 <= cx < bw and 0 <= cy < bh):
            continue
        if px[cx, cy][:3] != (255, 255, 255) or px[cx, cy][3] == 0:
            continue
        px[cx, cy] = (0, 0, 0, 0)
        queue.extend(((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)))
    cell = Image.new("RGBA", (80, h), (0, 0, 0, 0))
    cell.alpha_composite(box.crop((1, 1, 1 + w, 1 + h)), (pad_left, 0))
    return cell


BUILDINGS = {
    # name: (stamp, doorLocalCol, doorLocalRow)
    "home":   (sin_stamp(263, 71, 80, 95, 0),    1, 3),
    "lab":    (sin_stamp(347, 70, 80, 94, 0),    1, 3),
    "gym":    (sin_stamp(807, 404, 77, 67, 1),   2, 3),
    "center": (sin_stamp(434, 145, 78, 81, 2),   2, 3),
    "mart":   (sin_stamp(366, 255, 62, 62, 18),  2, 3),
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
# HGSS "!" speech-bubble emote (interaction indicator above the player)
OBJ.append(("emote_excl", keyed(emotions, 4, 21, 18, 36, emotions.getpixel((0, 0)))))

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
# Authentic HGSS overworld sprites (ripped sheets, see ATTRIBUTION.md):
# Ethan's walk cycle for the player; the scientist (Prof. Elm style) and
# Silver from the trainers sheet as the two town NPCs.
#
# The rips are irregular: frames are color-keyed on the sheet's background
# and bottom-anchored per row on the row's common baseline, so the walking
# stride extends slightly below the idle feet exactly like the source rows.


def cellify(fr, bottom_gap=0):
    """Centre a frame in a CHAR_W x CHAR_H cell, feet bottom_gap px above the
    cell's bottom edge."""
    cell = Image.new("RGBA", (CHAR_W, CHAR_H), (0, 0, 0, 0))
    cell.alpha_composite(fr, ((CHAR_W - fr.width) // 2, CHAR_H - fr.height - bottom_gap))
    return cell


ETHAN_BG = ethan.getpixel((0, 0))
# Inclusive frame boxes per output row (DIR order: DOWN, UP, LEFT, RIGHT);
# columns are (step, idle, step) to match player.frameCol semantics.
ETHAN_FRAMES = [
    [(7, 5, 23, 29), (26, 5, 42, 27), (45, 5, 61, 29)],        # down
    [(6, 61, 22, 85), (27, 61, 43, 83), (49, 61, 65, 85)],     # up
    [(5, 33, 23, 56), (26, 34, 44, 56), (47, 34, 65, 56)],     # left
    [(5, 89, 23, 111), (26, 89, 44, 111), (47, 89, 65, 112)],  # right
]

player_sheet = Image.new("RGBA", (3 * CHAR_W, 4 * CHAR_H), (0, 0, 0, 0))
for r, frames in enumerate(ETHAN_FRAMES):
    baseline = max(b[3] for b in frames)
    for c, (x0, y0, x1, y1) in enumerate(frames):
        fr = keyed(ethan, x0, y0, x1, y1, ETHAN_BG)
        player_sheet.alpha_composite(cellify(fr, baseline - y1), (c * CHAR_W, r * CHAR_H))
player_sheet.save(os.path.join(OUT, "player.png"))

# NPCs: full 4-dir x 3-frame walk cycles from the trainers sheet. Each
# character occupies a 3x4 block of 32px cells on its own flat bg color.
# Output layout matches player.png: rows DOWN/UP/LEFT/RIGHT, cols
# (step, idle, step); blocks of 3 columns side by side per NPC.
NPC_BLOCKS = [0, 96]  # block origin x: scientist / professor, Silver (rival)
# (cellCol, cellRow) within a block for each output (row, col); the sheet has
# no right-facing walk frames — Gen 4 mirrors them from the left-facing row.
NPC_CELLS = [
    [(2, 1), (1, 1), (2, 2)],  # down
    [(2, 0), (0, 0), (1, 3)],  # up
    [(0, 2), (0, 1), (0, 3)],  # left
    [(0, 2), (0, 1), (0, 3)],  # right (mirrored left)
]
npc_sheet = Image.new("RGBA", (len(NPC_BLOCKS) * 3 * CHAR_W, 4 * CHAR_H), (0, 0, 0, 0))
for i, bx in enumerate(NPC_BLOCKS):
    npc_bg = trainers.getpixel((bx + 1, 1))
    for r, cells in enumerate(NPC_CELLS):
        for c, (cc, cr) in enumerate(cells):
            fr = keyed(trainers, bx + cc * 32, cr * 32, bx + cc * 32 + 31, cr * 32 + 31, npc_bg)
            fr = fr.crop(fr.getbbox())
            if r == 3:
                fr = fr.transpose(Image.FLIP_LEFT_RIGHT)
            npc_sheet.alpha_composite(cellify(fr, 2), ((i * 3 + c) * CHAR_W, r * CHAR_H))
npc_sheet.save(os.path.join(OUT, "npcs.png"))

# ---------------------------------------------------------------- pokemon
# Wandering overworld Pokemon from PMD SpriteCollab (see ATTRIBUTION.md):
# scripts/assets-src/pmd/<id>-Walk-Anim.png is FrameWidth x FrameHeight cells,
# 8 direction rows (0 = down, clockwise), variable frame count per row.
# Output pokemon.png mirrors the NPC layout with 32x32 cells.
import re

POKE = 32
PMD_IDS = ["0025", "0133", "0393"]  # Pikachu, Eevee, Piplup
PMD_DIR_ROWS = [0, 4, 6, 2]  # PMD row for our DOWN/UP/LEFT/RIGHT

poke_sheet = Image.new("RGBA", (len(PMD_IDS) * 3 * POKE, 4 * POKE), (0, 0, 0, 0))
for i, pid in enumerate(PMD_IDS):
    walk = Image.open(os.path.join(SRC, "pmd", f"{pid}-Walk-Anim.png")).convert("RGBA")
    xml = open(os.path.join(SRC, "pmd", f"{pid}-AnimData.xml")).read()
    m = re.search(r"<Name>Walk</Name>.*?<FrameWidth>(\d+)</FrameWidth>\s*<FrameHeight>(\d+)</FrameHeight>", xml, re.S)
    fw, fh = int(m.group(1)), int(m.group(2))
    nf = walk.width // fw
    frame_cols = [max(1, nf // 4), 0, (3 * nf) // 4]  # (step, idle, step)
    for r, pmd_row in enumerate(PMD_DIR_ROWS):
        for c, f in enumerate(frame_cols):
            fr = walk.crop((f * fw, pmd_row * fh, (f + 1) * fw, (pmd_row + 1) * fh))
            fr = fr.crop(fr.getbbox())
            if fr.width > POKE:
                x0 = (fr.width - POKE) // 2
                fr = fr.crop((x0, 0, x0 + POKE, fr.height))
            if fr.height > POKE:
                fr = fr.crop((0, fr.height - POKE, fr.width, fr.height))
            cell = Image.new("RGBA", (POKE, POKE), (0, 0, 0, 0))
            cell.alpha_composite(fr, ((POKE - fr.width) // 2, POKE - fr.height - 1))
            poke_sheet.alpha_composite(cell, ((i * 3 + c) * POKE, r * POKE))
poke_sheet.save(os.path.join(OUT, "pokemon.png"))

print("Packed assets:")
for fn in ("tileset.png", "objects.png", "player.png", "npcs.png", "pokemon.png"):
    p = os.path.join(OUT, fn)
    print(f"  {fn}: {Image.open(p).size}")
print("Object rects:", list(rects.keys()))


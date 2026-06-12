// Town map data for the pre-rendered background (town-bg.png, 25x20 tiles).
//
// The collision grid below was derived from the image by
// scripts/derive-collision.py (color classification + hand-measured overrides
// + flood fill from spawn) — rerun that script after editing the image.
//
// Layout: HOME (cols 3-7, door 6,5) / LAB (10-15, door 12,5) /
// GYM (16-22, door 19,5) on top; CONTACT (5-9, door 7,14) and LINKS
// (15-20, door 18,14) below; fountain pool at (11-13, 12-13) with a walkable
// ring; the welcome sign is elevated over the south exit path (cols 11-13),
// so the player walks under it (see FOREGROUND_RECTS).

import { MAP_W, MAP_H, TILE, INT } from './constants.js'

const COLLISION_ROWS = [
  '1111111111111111111111111',
  '1111111111111111111111111',
  '1111111111111111111111111',
  '1111111111111111111111111',
  '1111111110111111111111101',
  '1111111110111111111111101',
  '1111100010110111011011001',
  '1110000000000000000001001',
  '1110000000000000000000001',
  '1100000000000000000000001',
  '1111011111000000111110001',
  '1110011111000001111111011',
  '1111011111011101111111111',
  '1110011111011101111111111',
  '1111011111000001111111111',
  '1110000000000000000000011',
  '1111110000000000000111111',
  '1111111111100011111111111',
  '1111111111100011111111111',
  '1111111111111111111111111',
]

const collision = COLLISION_ROWS.map((row) => [...row].map(Number))

// ---- interaction triggers ----
const interaction = Array.from({ length: MAP_H }, () =>
  Array.from({ length: MAP_W }, () => 0),
)

function set(c, r, id) {
  interaction[r][c] = id
}

set(6, 5, INT.HOUSE) // HOME door
set(12, 5, INT.LAB) // LAB door
set(19, 5, INT.GYM) // GYM door
set(7, 14, INT.CENTER) // CONTACT door
set(18, 14, INT.MART) // LINKS door
set(11, 16, INT.SIGN) // welcome sign (faced from the exit path)
set(12, 16, INT.SIGN)
set(13, 16, INT.SIGN)
// NPCs/Pokemon are dynamic — collision + interaction come from npc.js

// Background sub-rects (px) re-drawn over the sprites so the player passes
// behind them: the elevated welcome sign board + posts over the south exit.
export const FOREGROUND_RECTS = [[326, 477, 152, 62]]

export const mapData = { collision, interaction }
export const SPAWN = { col: 12, row: 10 } // on the plaza above the fountain

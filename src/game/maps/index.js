// Map registry. Each map def carries its own background image, dimensions,
// collision/interaction grids, an `actions` table (interaction id -> what it
// does), named spawn points and wanderer definitions. Wanderer defs are
// instantiated once here, so residents keep their positions across map swaps.

import { createWanderer } from '../wander.js'
import { townDef } from './town.js'
import { centerDef } from './center.js'

const MAPS = {}
for (const def of [townDef, centerDef]) {
  MAPS[def.id] = { ...def, wanderers: def.wanderers.map(createWanderer) }
}

export function getMap(id) {
  const m = MAPS[id]
  if (!m) throw new Error(`Unknown map: ${id}`)
  return m
}

export const ALL_MAPS = Object.values(MAPS)

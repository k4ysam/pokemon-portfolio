# Asset Attribution

`scripts/pack-assets.py` slices and composites these sources into `public/assets/`.

## Tuxemon (ground tiles, trees)

Pixel art from the **Tuxemon** project (https://github.com/Tuxemon/Tuxemon),
licensed CC BY-SA 3.0 / GPL-3.0.

- `prototyping_outdoor.png` — `mods/tuxemon/gfx/tilesets/prototyping_outdoor.png`
  (grass/path autotiles, pines, round trees, fence, signs, foliage, shrub)
- `core_buildings.png` — `mods/tuxemon/gfx/tilesets/core_buildings.png`
  (no longer used in the packed output; kept for reference)

## Pokémon HGSS sprite rips (player + NPCs)

Overworld character sprites ripped from **Pokémon HeartGold / SoulSilver**
(© Nintendo / Creatures / GAME FREAK), via The Spriters Resource. Used in a
non-commercial personal fan/portfolio project; all rights remain with the
copyright holders.

- `hgss/ethan.png` — Ethan overworld sheet (ripped by Dazz)
  https://www.spriters-resource.com/ds_dsi/pokemonheartgoldsoulsilver/asset/26778/
- `hgss/trainers-overworld.png` — Trainers (Overworld) sheet
  https://www.spriters-resource.com/ds_dsi/pokemonheartgoldsoulsilver/asset/26955/
- `hgss/emotions.png` — emote bubbles, ripped by Lemon (the "!" indicator)
  https://www.spriters-resource.com/ds_dsi/pokemonheartgoldsoulsilver/asset/30497/
- `hgss/text-boxes.png` — UI reference sheet (unused so far)

## Sinnoh Tiles (buildings)

- `hgss/sinnoh-tiles-outdoor.png` — **"Sinnoh Tiles (Outdoor)" by Kyledove
  (Kymotonian) and Speed (Speedialga)** — custom Gen-4-style tiles, credit
  required by the authors.
  https://www.spriters-resource.com/custom_edited/pokemoncustoms/asset/24115/
  Used for the five town buildings (houses, gym warehouse, Center/Mart domes).

## PMD SpriteCollab (wandering Pokémon)

Overworld walk animations from **PMDCollab SpriteCollab**
(https://github.com/PMDCollab/SpriteCollab), the community sprite repository
for Pokémon Mystery Dungeon (sprites © Nintendo / Creatures / GAME FREAK /
Spike Chunsoft; collab assets CC BY-NC 4.0). Used in a non-commercial
personal fan/portfolio project.

- `pmd/0025-Walk-Anim.png` — Pikachu
- `pmd/0133-Walk-Anim.png` — Eevee
- `pmd/0393-Walk-Anim.png` — Piplup

## Original art

The stone fountain and the welcome sign board are original pixel art generated
programmatically in `scripts/pack-assets.py`.

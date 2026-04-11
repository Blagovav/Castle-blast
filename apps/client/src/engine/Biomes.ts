import type { BiomeConfig, BiomeType } from './types.js';

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  castle: {
    type: 'castle',
    name: 'Royal Castle',
    bgColor: 0x13121d,
    cellColor1: 0x343460,
    cellColor2: 0x2e2e55,
    blockedColor: 0x4a4a5e,
    blockedHighlight: 0x5a5a6e,
  },
  forest: {
    type: 'forest',
    name: 'Enchanted Forest',
    bgColor: 0x0d1a0d,
    cellColor1: 0x1e3d2a,
    cellColor2: 0x1a3525,
    blockedColor: 0x3d5a3d,
    blockedHighlight: 0x4d6a4d,
  },
  desert: {
    type: 'desert',
    name: 'Golden Desert',
    bgColor: 0x1a150d,
    cellColor1: 0x3d3020,
    cellColor2: 0x352a1c,
    blockedColor: 0x5a4a30,
    blockedHighlight: 0x6a5a40,
  },
  ice: {
    type: 'ice',
    name: 'Frozen Peaks',
    bgColor: 0x0d1520,
    cellColor1: 0x253550,
    cellColor2: 0x203048,
    blockedColor: 0x4a6080,
    blockedHighlight: 0x5a7090,
  },
  volcano: {
    type: 'volcano',
    name: 'Lava Forge',
    bgColor: 0x1a0d0d,
    cellColor1: 0x3d2020,
    cellColor2: 0x351c1c,
    blockedColor: 0x5a3030,
    blockedHighlight: 0x6a4040,
  },
};

/** Get biome for a level number */
export function getBiomeForLevel(levelNum: number): BiomeConfig {
  if (levelNum <= 10) return BIOMES.castle;
  if (levelNum <= 20) return BIOMES.forest;
  if (levelNum <= 30) return BIOMES.desert;
  if (levelNum <= 40) return BIOMES.ice;
  return BIOMES.volcano;
}

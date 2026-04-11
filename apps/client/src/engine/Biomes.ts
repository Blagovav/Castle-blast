import type { BiomeConfig, BiomeType } from './types.js';

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  castle: {
    type: 'castle',
    name: 'Royal Castle',
    bgColor: 0x87CEEB, // sky blue
    cellColor1: 0xe8e4f0, // very light lavender (almost white)
    cellColor2: 0xdcd8ea, // light lavender
    blockedColor: 0x8a8a9a,
    blockedHighlight: 0xa0a0b0,
  },
  forest: {
    type: 'forest',
    name: 'Enchanted Forest',
    bgColor: 0x5a9e5a,
    cellColor1: 0xc8e0c8,
    cellColor2: 0xbcd8bc,
    blockedColor: 0x6a7a5a,
    blockedHighlight: 0x7a8a6a,
  },
  desert: {
    type: 'desert',
    name: 'Golden Desert',
    bgColor: 0xd4a050,
    cellColor1: 0xe8dcc0,
    cellColor2: 0xdcd0b4,
    blockedColor: 0xa08850,
    blockedHighlight: 0xb09860,
  },
  ice: {
    type: 'ice',
    name: 'Frozen Peaks',
    bgColor: 0x6aafe0,
    cellColor1: 0xd0e8f0,
    cellColor2: 0xc4dce8,
    blockedColor: 0x7090a8,
    blockedHighlight: 0x80a0b8,
  },
  volcano: {
    type: 'volcano',
    name: 'Lava Forge',
    bgColor: 0xc04040,
    cellColor1: 0xe0c8c0,
    cellColor2: 0xd4bcb4,
    blockedColor: 0x8a5050,
    blockedHighlight: 0x9a6060,
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

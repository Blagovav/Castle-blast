import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LevelDefinition, LevelResult } from '@castle-blast/shared';

export const useGameStore = defineStore('game', () => {
  const levelNum = ref(0);
  const levelDef = ref<LevelDefinition | null>(null);
  const movesLeft = ref(0);
  const score = ref(0);
  const isPlaying = ref(false);
  const result = ref<LevelResult | null>(null);
  const showResult = ref(false);

  async function loadLevel(num: number): Promise<LevelDefinition> {
    const padded = String(num).padStart(3, '0');
    const mod = await import(`../levels/level-${padded}.json`);
    const def = mod.default as LevelDefinition;
    levelNum.value = num;
    levelDef.value = def;
    movesLeft.value = def.maxMoves;
    score.value = 0;
    result.value = null;
    showResult.value = false;
    isPlaying.value = true;
    return def;
  }

  function setMovesLeft(moves: number) {
    movesLeft.value = moves;
  }

  function setScore(s: number) {
    score.value = s;
  }

  function finishLevel(r: { score: number; movesUsed: number; starsEarned: number; objectivesCompleted: boolean }) {
    isPlaying.value = false;
    result.value = {
      levelNum: levelNum.value,
      score: r.score,
      movesUsed: r.movesUsed,
      starsEarned: r.starsEarned,
      objectivesCompleted: r.objectivesCompleted,
    };
    showResult.value = true;
  }

  function failLevel() {
    isPlaying.value = false;
    result.value = {
      levelNum: levelNum.value,
      score: score.value,
      movesUsed: (levelDef.value?.maxMoves ?? 0) - movesLeft.value,
      starsEarned: 0,
      objectivesCompleted: false,
    };
    showResult.value = true;
  }

  function closeResult() {
    showResult.value = false;
  }

  return {
    levelNum,
    levelDef,
    movesLeft,
    score,
    isPlaying,
    result,
    showResult,
    loadLevel,
    setMovesLeft,
    setScore,
    finishLevel,
    failLevel,
    closeResult,
  };
});

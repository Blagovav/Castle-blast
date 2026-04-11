<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/player';
import { ScreenLayout } from '@umbrella-software-corp/ui-kit';
import { getBiomeForLevel } from '@/engine/Biomes';

const router = useRouter();
const playerStore = usePlayerStore();

const TOTAL_LEVELS = 50;
const currentLevel = computed(() => playerStore.profile?.currentLevel ?? 1);

interface LevelInfo {
  num: number;
  unlocked: boolean;
  completed: boolean;
  biomeName: string;
  biomeColor: string;
}

const levels = computed((): LevelInfo[] => {
  return Array.from({ length: TOTAL_LEVELS }, (_, i) => {
    const biome = getBiomeForLevel(i + 1);
    return {
      num: i + 1,
      unlocked: i + 1 <= currentLevel.value,
      completed: i + 1 < currentLevel.value,
      biomeName: biome.name,
      biomeColor: `#${biome.cellColor1.toString(16).padStart(6, '0')}`,
    };
  });
});

// Group levels by biome
const biomeGroups = computed(() => {
  const groups: { name: string; levels: LevelInfo[] }[] = [];
  let currentBiome = '';
  for (const level of levels.value) {
    if (level.biomeName !== currentBiome) {
      currentBiome = level.biomeName;
      groups.push({ name: currentBiome, levels: [] });
    }
    groups[groups.length - 1].levels.push(level);
  }
  return groups;
});

function goBack() {
  router.push({ name: 'home' });
}

function playLevel(num: number) {
  if (num > currentLevel.value) return;
  router.push({ name: 'play', params: { levelNum: num } });
}
</script>

<template>
  <ScreenLayout title="Select Level" @back="goBack">
    <div class="ls">
      <div v-for="group in biomeGroups" :key="group.name" class="ls__biome">
        <div class="ls__biome-header">{{ group.name }}</div>
        <div class="ls__grid">
          <button
            v-for="level in group.levels"
            :key="level.num"
            class="ls__btn"
            :class="{
              'ls__btn--locked': !level.unlocked,
              'ls__btn--current': level.num === currentLevel,
              'ls__btn--completed': level.completed,
            }"
            :disabled="!level.unlocked"
            @click="playLevel(level.num)"
          >
            <span class="ls__num">{{ level.num }}</span>
            <span v-if="level.num === currentLevel" class="ls__play">PLAY</span>
            <span v-if="!level.unlocked" class="ls__lock">🔒</span>
          </button>
        </div>
      </div>
    </div>
  </ScreenLayout>
</template>

<style scoped>
.ls {
  padding: 0 0 24px;
}

.ls__biome {
  margin-bottom: 16px;
}

.ls__biome-header {
  font-family: var(--font-family, "Unbounded"), sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary, rgba(255,255,255,0.7));
  padding: 8px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ls__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.ls__btn {
  position: relative;
  aspect-ratio: 1;
  border: none;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  transition: transform 0.1s;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  background: linear-gradient(145deg, var(--accent-blue, #0060DF), #2855a8);
  box-shadow: var(--shadow-btn-3d-sm, 0 3px 0 #000);
}

.ls__btn:active:not(:disabled) {
  transform: scale(0.93) translateY(2px);
  box-shadow: 0 1px 0 #000;
}

.ls__btn--locked {
  background: var(--color-bg-card, #2B2A34);
  cursor: not-allowed;
}

.ls__btn--current {
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  color: var(--color-bg-darkest, #13121D);
  animation: pulse 2s infinite;
}

.ls__btn--completed {
  background: linear-gradient(145deg, #2d8f4e, #1e6b38);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

.ls__num {
  font-size: 16px;
  font-weight: 800;
}

.ls__play {
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 1px;
}

.ls__lock {
  font-size: 14px;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ls__btn--locked .ls__num { opacity: 0; }
</style>

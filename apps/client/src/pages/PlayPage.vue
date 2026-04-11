<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { GameEngine } from '@/engine/GameEngine';
import { GameWinOverlay, GameLoseOverlay } from '@umbrella-software-corp/ui-kit';

const props = defineProps<{ levelNum: number }>();
const router = useRouter();
const gameStore = useGameStore();
const canvasRef = ref<HTMLDivElement>();
const loading = ref(true);
let engine: GameEngine | null = null;
const tg = window.Telegram?.WebApp;

function goBack() {
  engine?.destroy();
  engine = null;
  router.push({ name: 'home' });
}

onMounted(async () => {
  tg?.BackButton.show();
  tg?.BackButton.onClick(goBack);

  if (!canvasRef.value) return;

  try {
    const levelDef = await gameStore.loadLevel(props.levelNum);

    engine = new GameEngine({
      container: canvasRef.value,
      levelDef,
    });

    await engine.init();
    loading.value = false;

    // Engine → Store
    engine.on('moveUsed', (movesLeft) => gameStore.setMovesLeft(movesLeft));
    engine.on('scoreChanged', (score) => gameStore.setScore(score));
    engine.on('levelComplete', (result) => gameStore.finishLevel(result));
    engine.on('levelFailed', () => gameStore.failLevel());
  } catch (err) {
    console.error('Failed to init game engine:', err);
  }
});

onUnmounted(() => {
  tg?.BackButton.hide();
  tg?.BackButton.offClick(goBack);
  engine?.destroy();
  engine = null;
});
</script>

<template>
  <div class="play">
    <header class="play__hud">
      <button class="play__back" @click="goBack">←</button>
      <span class="play__level">Level {{ levelNum }}</span>
      <div class="play__stat play__stat--moves">
        <img src="/sprites/icon_moves.png" class="play__stat-icon" alt="" onerror="this.style.display='none'" />
        <span class="play__stat-value">{{ gameStore.movesLeft }}</span>
        <span class="play__stat-label">moves</span>
      </div>
      <div class="play__stat play__stat--score">
        <img src="/sprites/icon_star_gold.png" class="play__stat-icon" alt="" onerror="this.style.display='none'" />
        <span class="play__stat-value">{{ gameStore.score.toLocaleString() }}</span>
      </div>
    </header>

    <div ref="canvasRef" class="play__canvas">
      <p v-if="loading" class="play__loading">Loading...</p>
    </div>

    <!-- Win Overlay (UI Kit) -->
    <GameWinOverlay
      v-if="gameStore.showResult && gameStore.result?.starsEarned"
      :earned-stars="gameStore.result?.starsEarned ?? 0"
      :score="gameStore.result?.score ?? 0"
      :coins-reward="Math.floor((gameStore.result?.score ?? 0) * 0.1)"
      victory-label="Level Complete!"
      score-label="Your score"
      share-label="Share"
      continue-label="Continue"
      home-label="Home"
      next-level-label="Next Level"
      @continue="router.push({ name: 'play', params: { levelNum: levelNum + 1 } })"
      @home="goBack"
      @next-level="router.push({ name: 'play', params: { levelNum: levelNum + 1 } })"
    />

    <!-- Lose Overlay (UI Kit) -->
    <GameLoseOverlay
      v-if="gameStore.showResult && !gameStore.result?.starsEarned"
      :current-energy="4"
      title-label="Level Failed"
      energy-left-label="Lives left"
      exit-label="Home"
      exit-to-menu-label="Home"
      replay-level-label="Retry"
      next-level-label="Next Level"
      @exit="goBack"
      @exit-to-menu="goBack"
      @replay-level="router.push({ name: 'play', params: { levelNum } })"
    />
  </div>
</template>

<style scoped>
.play {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--color-bg-darkest, #13121D);
}

.play__hud {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg-dark, #1B1A26);
  z-index: 10;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__back {
  background: var(--color-bg-card, #2B2A34);
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
}

.play__level {
  font-weight: 800;
  font-size: 15px;
  flex: 1;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__stat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
}

.play__stat--moves {
  border: 1px solid rgba(74, 144, 217, 0.3);
}

.play__stat--score {
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.play__stat-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.play__stat-label {
  font-size: 10px;
  opacity: 0.5;
}

.play__stat-value {
  font-size: 16px;
  font-weight: 800;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.play__loading {
  text-align: center;
  padding-top: 40%;
  opacity: 0.5;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__btn-secondary {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  background: var(--color-bg-card, #2B2A34);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}
</style>

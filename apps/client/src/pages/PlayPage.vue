<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { GameEngine } from '@/engine/GameEngine';

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
      <div class="play__stat">
        <span class="play__stat-label">Moves</span>
        <span class="play__stat-value">{{ gameStore.movesLeft }}</span>
      </div>
      <div class="play__stat">
        <span class="play__stat-label">Score</span>
        <span class="play__stat-value">{{ gameStore.score }}</span>
      </div>
    </header>

    <div ref="canvasRef" class="play__canvas">
      <p v-if="loading" class="play__loading">Loading...</p>
    </div>

    <!-- Win/Lose Modal -->
    <div v-if="gameStore.showResult" class="play__modal-overlay">
      <div class="play__modal">
        <h2 v-if="gameStore.result?.starsEarned">Level Complete!</h2>
        <h2 v-else>Level Failed</h2>

        <div v-if="gameStore.result?.starsEarned" class="play__stars">
          <span v-for="i in 3" :key="i" :class="{ 'play__star--earned': i <= (gameStore.result?.starsEarned ?? 0) }">
            ★
          </span>
        </div>

        <p>Score: {{ gameStore.result?.score }}</p>
        <p>Moves used: {{ gameStore.result?.movesUsed }}</p>

        <div class="play__modal-actions">
          <button @click="goBack">Home</button>
          <button v-if="!gameStore.result?.starsEarned" @click="goBack">Retry</button>
          <button v-else @click="router.push({ name: 'play', params: { levelNum: levelNum + 1 } })">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.play {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.play__hud {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #16213e;
  z-index: 10;
}

.play__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
}

.play__level {
  font-weight: 700;
  font-size: 16px;
  flex: 1;
}

.play__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.play__stat-label {
  font-size: 10px;
  opacity: 0.6;
  text-transform: uppercase;
}

.play__stat-value {
  font-size: 18px;
  font-weight: 700;
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
}

.play__modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.play__modal {
  background: #1e2a4a;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  min-width: 260px;
}

.play__modal h2 {
  margin-bottom: 16px;
  font-size: 24px;
}

.play__stars {
  font-size: 36px;
  margin-bottom: 16px;
  color: #555;
}

.play__star--earned {
  color: #ffd700;
}

.play__modal p {
  margin: 4px 0;
  opacity: 0.8;
}

.play__modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.play__modal-actions button {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.play__modal-actions button:active {
  transform: scale(0.95);
}
</style>

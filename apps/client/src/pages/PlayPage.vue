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
    <!-- Royal Match style HUD -->
    <header class="play__hud">
      <!-- King Avatar -->
      <div class="play__avatar">
        <img src="/sprites/king_avatar.png" class="play__avatar-img" alt="" onerror="this.parentElement.innerHTML='👑'" />
      </div>

      <!-- Objectives -->
      <div class="play__objectives">
        <span class="play__obj-label">Goals</span>
        <div class="play__obj-icons">
          <div class="play__obj-item">
            <span class="play__obj-icon">⭐</span>
            <span class="play__obj-count">{{ gameStore.score }}</span>
          </div>
        </div>
      </div>

      <!-- Moves Counter -->
      <div class="play__moves">
        <span class="play__moves-label">Moves</span>
        <span class="play__moves-value">{{ gameStore.movesLeft }}</span>
      </div>
    </header>

    <!-- Game Canvas -->
    <div ref="canvasRef" class="play__canvas">
      <div v-if="loading" class="play__loading">
        <div class="play__loading-spinner"></div>
        <span>Loading Level {{ levelNum }}...</span>
      </div>
    </div>

    <!-- Boosters Bar -->
    <div class="play__boosters">
      <button class="play__booster" disabled>
        <img src="/sprites/booster_rocket.png" class="play__booster-img" alt="" onerror="this.parentElement.innerHTML='🚀'" />
        <span class="play__booster-lock">🔒</span>
      </button>
      <button class="play__booster" disabled>
        <img src="/sprites/booster_bomb.png" class="play__booster-img" alt="" onerror="this.parentElement.innerHTML='💣'" />
        <span class="play__booster-lock">🔒</span>
      </button>
      <button class="play__booster" disabled>
        <img src="/sprites/booster_shuffle.png" class="play__booster-img" alt="" onerror="this.parentElement.innerHTML='🔀'" />
        <span class="play__booster-lock">🔒</span>
      </button>
      <button class="play__booster" disabled>
        <img src="/sprites/booster_color_bomb.png" class="play__booster-img" alt="" onerror="this.parentElement.innerHTML='🌈'" />
        <span class="play__booster-lock">🔒</span>
      </button>
      <button class="play__booster-settings">
        <span>⚙️</span>
      </button>
    </div>

    <!-- Win Overlay -->
    <GameWinOverlay
      v-if="gameStore.showResult && gameStore.result?.starsEarned"
      :earned-stars="gameStore.result?.starsEarned ?? 0"
      :score="gameStore.result?.score ?? 0"
      :coins-reward="Math.floor((gameStore.result?.score ?? 0) * 0.1)"
      victory-label="Level Complete!"
      score-label="Your score"
      continue-label="Continue"
      home-label="Home"
      next-level-label="Next Level"
      @continue="router.push({ name: 'play', params: { levelNum: levelNum + 1 } })"
      @home="goBack"
      @next-level="router.push({ name: 'play', params: { levelNum: levelNum + 1 } })"
    />

    <!-- Lose Overlay -->
    <GameLoseOverlay
      v-if="gameStore.showResult && !gameStore.result?.starsEarned"
      :current-energy="4"
      title-label="Level Failed"
      exit-label="Home"
      exit-to-menu-label="Home"
      replay-level-label="Retry"
      @exit="goBack"
      @exit-to-menu="goBack"
      @replay-level="router.push({ name: 'play', params: { levelNum } })"
    />
  </div>
</template>

<style scoped>
.play {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #87CEEB 0%, #6bb3d9 60%, #8a9aaa 100%);
}

/* HUD — Royal Match style */
.play__hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 100%);
}

.play__avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid #c8960a;
  background: linear-gradient(135deg, #8b4513, #654321);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.play__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play__objectives {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #7a2040, #5a1830);
  padding: 4px 16px 6px;
  border-radius: 0 0 14px 14px;
  border: 2px solid #a03050;
  border-top: none;
  min-width: 90px;
}

.play__obj-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.7);
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__obj-icons {
  display: flex;
  gap: 6px;
}

.play__obj-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.play__obj-icon { font-size: 14px; }

.play__obj-count {
  font-size: 13px;
  font-weight: 800;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__moves {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #7a2040, #5a1830);
  padding: 4px 14px 6px;
  border-radius: 0 0 14px 14px;
  border: 2px solid #a03050;
  border-top: none;
}

.play__moves-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.7);
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__moves-value {
  font-size: 26px;
  font-weight: 900;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  text-shadow: var(--shadow-text, 1px 2px 0 #000);
  line-height: 1;
}

/* Canvas */
.play__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.play__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  font-size: 14px;
  color: rgba(0,0,0,0.5);
}

.play__loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0,0,0,0.1);
  border-top-color: #c8960a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Boosters Bar */
.play__boosters {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.2));
  flex-shrink: 0;
  padding-bottom: max(8px, var(--tma-bottom-ui-safe-bottom, 0px));
}

.play__booster {
  position: relative;
  width: 52px;
  height: 52px;
  border: 2px solid #c8960a;
  border-radius: 12px;
  background: linear-gradient(180deg, #f0d860, #c8960a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 0 #8a6a08;
}

.play__booster:disabled {
  opacity: 0.7;
}

.play__booster-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.play__booster-lock {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 12px;
}

.play__booster-settings {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
</style>

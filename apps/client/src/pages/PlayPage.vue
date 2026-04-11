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

    // Wait for flex layout to settle so canvas has correct dimensions
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

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
    <!-- HUD Banner — connected panels like Royal Match -->
    <header class="play__hud">
      <div class="play__avatar">
        <img src="/sprites/king_avatar.png" class="play__avatar-img" alt="" onerror="this.textContent='👑'" />
      </div>
      <div class="play__hud-banner">
        <div class="play__goals-panel">
          <span class="play__panel-label">Goals</span>
          <div class="play__panel-value">⭐ {{ gameStore.score }}</div>
        </div>
        <div class="play__moves-panel">
          <span class="play__panel-label">Moves</span>
          <div class="play__moves-num">{{ gameStore.movesLeft }}</div>
        </div>
      </div>
    </header>

    <!-- Castle wall scene -->
    <div class="play__castle-wall">
      <div class="play__battlement"></div>
      <div class="play__bricks"></div>
    </div>

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
  background: linear-gradient(180deg, #7ec8e8 0%, #5aaccc 40%, #8a8a7a 70%, #6a6a5a 100%);
}

/* HUD Banner — Royal Match connected panels */
.play__hud {
  display: flex;
  align-items: flex-start;
  padding: 4px 8px 0;
  flex-shrink: 0;
  gap: 6px;
}

.play__avatar {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  overflow: hidden;
  border: 3px solid #d4a010;
  background: linear-gradient(135deg, #6a3a18, #4a2810);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.4);
  flex-shrink: 0;
}

.play__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play__hud-banner {
  flex: 1;
  display: flex;
  gap: 0;
}

.play__goals-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #8a2848, #6a1830);
  padding: 5px 12px 7px;
  border-radius: 0 0 0 14px;
  border: 2px solid #a83858;
  border-top: none;
  border-right: 1px solid #a83858;
}

.play__moves-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #8a2848, #6a1830);
  padding: 5px 16px 7px;
  border-radius: 0 0 14px 0;
  border: 2px solid #a83858;
  border-top: none;
  border-left: 1px solid #6a1830;
  min-width: 70px;
}

.play__panel-label {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.65);
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.play__panel-value {
  font-size: 12px;
  font-weight: 800;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  text-shadow: 1px 1px 0 #000;
}

.play__moves-num {
  font-size: 28px;
  font-weight: 900;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  text-shadow: 2px 3px 0 #000;
  line-height: 1;
}

/* Castle wall decoration between HUD and board */
.play__castle-wall {
  flex-shrink: 0;
  height: 28px;
  position: relative;
  margin: 0 16px;
}

.play__battlement {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(180deg, #8a7a5a, #6a5a3a);
  border-radius: 4px 4px 0 0;
}

.play__battlement::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    #8a7a5a 0px, #8a7a5a 18px,
    transparent 18px, transparent 24px
  );
}

.play__bricks {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 12px;
  background: repeating-linear-gradient(
    90deg,
    #7a6a4a 0px, #7a6a4a 22px,
    #5a4a2a 22px, #5a4a2a 24px
  );
}

/* Canvas — takes remaining space between HUD and boosters */
.play__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0; /* Critical: allows flex shrink */
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
  gap: 8px;
  padding: 6px 16px;
  background: linear-gradient(180deg, rgba(100,80,50,0.4), rgba(60,40,20,0.6));
  flex-shrink: 0;
  padding-bottom: max(10px, var(--tma-bottom-ui-safe-bottom, 0px));
  border-top: 2px solid rgba(200,150,10,0.3);
}

.play__booster {
  position: relative;
  width: 56px;
  height: 56px;
  border: 3px solid #c8960a;
  border-radius: 14px;
  background: linear-gradient(180deg, #f5e070, #d0a010);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #8a6a08, inset 0 1px 0 rgba(255,255,255,0.3);
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

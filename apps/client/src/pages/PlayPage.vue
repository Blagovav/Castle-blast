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
    <!-- Background image -->
    <div class="play__bg"></div>

    <!-- HUD -->
    <header class="play__hud">
      <!-- King Avatar -->
      <div class="play__avatar">
        <img src="/sprites/king_avatar_v2.png" class="play__avatar-img" alt="" />
      </div>

      <!-- Goals Panel -->
      <div class="play__panel play__panel--goals">
        <div class="play__panel-inner">
          <span class="play__panel-label">Goals</span>
          <div class="play__panel-content">
            <img src="/sprites/ui_star_filled.png" class="play__panel-icon" alt="" onerror="this.style.display='none'" />
            <span class="play__panel-value">{{ gameStore.score }}</span>
          </div>
        </div>
      </div>

      <!-- Moves Panel -->
      <div class="play__panel play__panel--moves">
        <div class="play__panel-inner">
          <span class="play__panel-label">Moves</span>
          <span class="play__moves-num">{{ gameStore.movesLeft }}</span>
        </div>
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
        <img src="/sprites/booster_hammer_v2.png" class="play__booster-img" alt="" />
        <span class="play__booster-badge">🔒</span>
      </button>
      <button class="play__booster" disabled>
        <img src="/sprites/booster_cannon_v2.png" class="play__booster-img" alt="" />
        <span class="play__booster-badge">🔒</span>
      </button>
      <button class="play__booster" disabled>
        <img src="/sprites/booster_jester_v2.png" class="play__booster-img" alt="" />
        <span class="play__booster-badge">🔒</span>
      </button>
      <button class="play__booster" disabled>
        <img src="/sprites/booster_arrow_v2.png" class="play__booster-img" alt="" />
        <span class="play__booster-badge">🔒</span>
      </button>
      <button class="play__settings">⚙️</button>
    </div>

    <!-- Win Overlay -->
    <GameWinOverlay
      v-if="gameStore.showResult && gameStore.result?.starsEarned"
      :earned-stars="gameStore.result?.starsEarned ?? 0"
      :score="gameStore.result?.score ?? 0"
      :coins-reward="Math.floor((gameStore.result?.score ?? 0) * 0.1)"
      victory-label="Level Complete!"
      score-label="Your score"
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
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

/* Full-screen background image */
.play__bg {
  position: absolute;
  inset: 0;
  background-image: url('/sprites/bg_biome_castle.png');
  background-size: cover;
  background-position: center top;
  z-index: 0;
}

/* HUD */
.play__hud {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  padding: 6px 8px 0;
  gap: 6px;
  flex-shrink: 0;
}

.play__avatar {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
}

.play__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* HUD Panels */
.play__panel {
  flex: 1;
  min-width: 0;
}

.play__panel-inner {
  background: linear-gradient(180deg, #7a2040, #551530);
  border-radius: 0 0 16px 16px;
  border: 2.5px solid #a83858;
  border-top: none;
  padding: 5px 12px 8px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.35);
}

.play__panel-label {
  display: block;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255,255,255,0.65);
  font-family: var(--font-family, "Unbounded"), sans-serif;
  margin-bottom: 2px;
}

.play__panel-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.play__panel-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.play__panel-value {
  font-size: 15px;
  font-weight: 800;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  text-shadow: 1px 2px 0 #000;
}

.play__moves-num {
  font-size: 34px;
  font-weight: 900;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  text-shadow: 2px 3px 0 #000;
  line-height: 1;
  color: #fff;
}

/* Canvas */
.play__canvas {
  position: relative;
  z-index: 5;
  flex: 1;
  min-height: 0;
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
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.play__loading-spinner {
  width: 36px;
  height: 36px;
  border: 4px solid rgba(255,255,255,0.2);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Boosters Bar */
.play__boosters {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(180deg, rgba(60,40,20,0.85), rgba(40,25,10,0.95));
  border-top: 2px solid rgba(200,150,10,0.4);
  flex-shrink: 0;
  padding-bottom: max(10px, var(--tma-bottom-ui-safe-bottom, 0px));
}

.play__booster {
  position: relative;
  width: 58px;
  height: 58px;
  border: 3px solid #c8960a;
  border-radius: 14px;
  background: linear-gradient(180deg, #f5e070, #c8960a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #7a5808, inset 0 2px 0 rgba(255,255,255,0.25);
  padding: 6px;
}

.play__booster:disabled { opacity: 0.75; }

.play__booster-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.play__booster-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 14px;
  background: rgba(0,0,0,0.5);
  border-radius: 8px;
  padding: 1px 3px;
}

.play__settings {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  cursor: pointer;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

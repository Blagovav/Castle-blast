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

    <!-- Castle scene above board -->
    <div class="play__scene">
      <div class="play__tower play__tower--left"></div>
      <div class="play__wall"></div>
      <div class="play__tower play__tower--right"></div>
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
  padding: 6px 20px 8px;
  border-radius: 0 0 16px 16px;
  border: 2px solid #a03050;
  border-top: none;
  min-width: 100px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
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
  padding: 6px 18px 8px;
  border-radius: 0 0 16px 16px;
  border: 2px solid #a03050;
  border-top: none;
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
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
  font-size: 32px;
  font-weight: 900;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  text-shadow: 2px 3px 0 #000;
  line-height: 1;
  color: #fff;
}

/* Castle scene decoration */
.play__scene {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 40px;
  flex-shrink: 0;
  overflow: hidden;
  padding: 0 20px;
}

.play__tower {
  width: 28px;
  height: 36px;
  background: linear-gradient(180deg, #8a7a60, #6a5a40);
  border-radius: 4px 4px 0 0;
  position: relative;
}

.play__tower::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-bottom: 10px solid #7a6a50;
}

.play__wall {
  flex: 1;
  height: 24px;
  background: linear-gradient(180deg, #7a6a50, #5a4a30);
  position: relative;
}

.play__wall::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    #8a7a60 0px, #8a7a60 14px,
    #6a5a40 14px, #6a5a40 16px
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

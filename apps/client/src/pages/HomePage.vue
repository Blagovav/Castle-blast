<script setup lang="ts">
import { computed } from 'vue';
import { useTelegram } from '@/composables/useTelegram';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/player';
import { useEconomyStore } from '@/stores/economy';
import { MAX_LIVES } from '@castle-blast/shared';

const { user } = useTelegram();
const router = useRouter();
const playerStore = usePlayerStore();
const economyStore = useEconomyStore();

const TOTAL_LEVELS = 50;
const currentLevel = computed(() => playerStore.profile?.currentLevel ?? 1);

const levels = computed(() => {
  return Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
    num: i + 1,
    unlocked: i + 1 <= currentLevel.value,
    completed: i + 1 < currentLevel.value,
  }));
});

function playLevel(num: number) {
  if (num > currentLevel.value) return;
  if (!playerStore.canPlay) return;
  router.push({ name: 'play', params: { levelNum: num } });
}
</script>

<template>
  <div class="home">
    <!-- Top Bar -->
    <header class="home__topbar">
      <div class="home__user">
        <div class="home__avatar">{{ user?.first_name?.[0] ?? '?' }}</div>
        <span>{{ user?.first_name ?? 'Player' }}</span>
      </div>
      <div class="home__currencies">
        <div class="home__currency">
          <span class="home__currency-icon">🪙</span>
          <span>{{ economyStore.coins }}</span>
        </div>
        <div class="home__currency">
          <span class="home__currency-icon">⭐</span>
          <span>{{ economyStore.stars }}</span>
        </div>
      </div>
    </header>

    <!-- Title + Lives -->
    <div class="home__hero">
      <h1 class="home__title">Castle Blast</h1>
      <div class="home__lives">
        <span v-for="i in MAX_LIVES" :key="i" class="home__heart" :class="{ 'home__heart--empty': i > playerStore.lives }">
          ❤️
        </span>
        <span v-if="playerStore.nextLifeIn" class="home__lives-timer">{{ playerStore.nextLifeIn }}</span>
      </div>
    </div>

    <!-- Level Select Grid -->
    <div class="home__levels">
      <button
        v-for="level in levels"
        :key="level.num"
        class="home__level-btn"
        :class="{
          'home__level-btn--locked': !level.unlocked,
          'home__level-btn--current': level.num === currentLevel,
          'home__level-btn--completed': level.completed,
        }"
        :disabled="!level.unlocked"
        @click="playLevel(level.num)"
      >
        <span class="home__level-num">{{ level.num }}</span>
        <span v-if="level.num === currentLevel" class="home__level-current">▶</span>
        <span v-if="!level.unlocked" class="home__level-lock">🔒</span>
      </button>
    </div>

    <!-- Bottom Nav -->
    <nav class="home__nav">
      <router-link to="/kingdom" class="home__nav-item">
        <span class="home__nav-icon">🏰</span>
        <span>Kingdom</span>
      </router-link>
      <router-link to="/leaderboard" class="home__nav-item">
        <span class="home__nav-icon">🏆</span>
        <span>Top</span>
      </router-link>
      <router-link to="/" class="home__nav-item home__nav-item--active">
        <span class="home__nav-icon">🎮</span>
        <span>Play</span>
      </router-link>
      <router-link to="/referral" class="home__nav-item">
        <span class="home__nav-icon">🎁</span>
        <span>Invite</span>
      </router-link>
      <router-link to="/shop" class="home__nav-item">
        <span class="home__nav-icon">🛒</span>
        <span>Shop</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.home__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #16213e;
}

.home__user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.home__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.home__currencies {
  display: flex;
  gap: 12px;
}

.home__currency {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 14px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
}

.home__currency-icon {
  font-size: 14px;
}

.home__hero {
  text-align: center;
  padding: 16px 16px 8px;
}

.home__title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}

.home__lives {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 18px;
}

.home__heart--empty {
  opacity: 0.25;
  filter: grayscale(1);
}

.home__lives-timer {
  font-size: 12px;
  color: #ffd700;
  margin-left: 8px;
  font-weight: 600;
}

.home__levels {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 8px 12px;
  overflow-y: auto;
  align-content: start;
}

.home__level-btn {
  position: relative;
  aspect-ratio: 1;
  border: none;
  border-radius: 14px;
  background: linear-gradient(145deg, #3a7bd5, #2c5fa1);
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: transform 0.1s;
  box-shadow: 0 3px 0 #1e3a6e;
}

.home__level-btn:active:not(:disabled) {
  transform: scale(0.93) translateY(2px);
  box-shadow: 0 1px 0 #1e3a6e;
}

.home__level-btn--locked {
  background: #2a2a3e;
  box-shadow: 0 3px 0 #1a1a2a;
  cursor: not-allowed;
}

.home__level-btn--current {
  background: linear-gradient(145deg, #ff8c00, #e67300);
  box-shadow: 0 3px 0 #b35900;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.home__level-num {
  font-size: 17px;
  font-weight: 800;
}

.home__level-current {
  font-size: 8px;
}

.home__level-lock {
  font-size: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.home__level-btn--locked .home__level-num {
  opacity: 0;
}

.home__nav {
  display: flex;
  background: #16213e;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.home__nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 0;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
}

.home__nav-item--active {
  color: #ffd700;
}

.home__nav-icon {
  font-size: 20px;
}
</style>

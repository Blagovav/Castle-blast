<script setup lang="ts">
import { computed } from 'vue';
import { useTelegram } from '@/composables/useTelegram';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/player';
import { useEconomyStore } from '@/stores/economy';
import { MAX_LIVES } from '@castle-blast/shared';
import { ScreenLayout, CoinsCounter, PrimaryCtaButton, InlineEnergyBar } from '@umbrella-software-corp/ui-kit';

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

const energyPercent = computed(() => (playerStore.lives / MAX_LIVES) * 100);

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
        <div class="home__user-info">
          <span class="home__username">{{ user?.first_name ?? 'Player' }}</span>
          <span class="home__user-level">Level {{ currentLevel }}</span>
        </div>
      </div>
      <div class="home__currencies">
        <div class="home__currency home__currency--coins">
          <img src="/sprites/icon_coin.png" class="home__currency-img" alt="" />
          <span>{{ economyStore.coins.toLocaleString() }}</span>
        </div>
        <div class="home__currency home__currency--stars">
          <img src="/sprites/icon_star_gold.png" class="home__currency-img" alt="" />
          <span>{{ economyStore.stars }}</span>
        </div>
      </div>
    </header>

    <!-- Energy Bar -->
    <div class="home__energy">
      <div class="home__energy-bar">
        <div class="home__energy-fill" :style="{ width: energyPercent + '%' }"></div>
      </div>
      <div class="home__energy-info">
        <img src="/sprites/icon_heart_full.png" class="home__energy-icon" alt="" />
        <span class="home__energy-count">{{ playerStore.lives }}/{{ MAX_LIVES }}</span>
        <span v-if="playerStore.nextLifeIn" class="home__energy-timer">{{ playerStore.nextLifeIn }}</span>
      </div>
    </div>

    <!-- Logo -->
    <div class="home__logo">
      <img v-if="false" src="/sprites/logo.png" alt="Castle Blast" class="home__logo-img" />
      <h1 class="home__title">Castle Blast</h1>
    </div>

    <!-- Level Select Grid -->
    <div class="home__levels">
      <button
        v-for="level in levels"
        :key="level.num"
        class="level-btn"
        :class="{
          'level-btn--locked': !level.unlocked,
          'level-btn--current': level.num === currentLevel,
          'level-btn--completed': level.completed,
        }"
        :disabled="!level.unlocked"
        @click="playLevel(level.num)"
      >
        <span class="level-btn__num">{{ level.num }}</span>
        <span v-if="level.num === currentLevel" class="level-btn__play">PLAY</span>
        <span v-if="!level.unlocked" class="level-btn__lock">🔒</span>
      </button>
    </div>

    <!-- Bottom Nav -->
    <nav class="home__nav">
      <router-link to="/kingdom" class="nav-item">
        <img src="/sprites/building_castle.png" class="nav-item__img" alt="" />
        <span>Kingdom</span>
      </router-link>
      <router-link to="/leaderboard" class="nav-item">
        <span class="nav-item__emoji">🏆</span>
        <span>Top</span>
      </router-link>
      <router-link to="/" class="nav-item nav-item--active">
        <span class="nav-item__emoji">🎮</span>
        <span>Play</span>
      </router-link>
      <router-link to="/referral" class="nav-item">
        <span class="nav-item__emoji">🎁</span>
        <span>Invite</span>
      </router-link>
      <router-link to="/shop" class="nav-item">
        <span class="nav-item__emoji">🛒</span>
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
  background: linear-gradient(180deg, #0f1028 0%, #1a1a3e 50%, #12122a 100%);
}

/* Top Bar */
.home__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
}

.home__user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: #1a1a2e;
  border: 2px solid rgba(255, 215, 0, 0.5);
}

.home__user-info {
  display: flex;
  flex-direction: column;
}

.home__username {
  font-weight: 700;
  font-size: 14px;
}

.home__user-level {
  font-size: 11px;
  opacity: 0.5;
}

.home__currencies {
  display: flex;
  gap: 8px;
}

.home__currency {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.home__currency-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* Energy Bar */
.home__energy {
  padding: 6px 12px;
}

.home__energy-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.home__energy-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4466, #ff6b8a);
  border-radius: 4px;
  transition: width 0.3s;
}

.home__energy-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
}

.home__energy-icon {
  width: 14px;
  height: 14px;
}

.home__energy-count {
  font-size: 12px;
  font-weight: 700;
  color: #ff6b8a;
}

.home__energy-timer {
  font-size: 11px;
  color: #ffd700;
  margin-left: auto;
}

/* Logo */
.home__logo {
  text-align: center;
  padding: 8px 0 4px;
}

.home__logo-img {
  height: 48px;
}

.home__title {
  font-size: 26px;
  font-weight: 900;
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

/* Level Grid */
.home__levels {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 6px 10px;
  overflow-y: auto;
  align-content: start;
}

.level-btn {
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
  background: linear-gradient(145deg, #3a6fd8, #2855a8);
  box-shadow: 0 3px 0 #1c3a70, inset 0 1px 0 rgba(255,255,255,0.15);
}

.level-btn:active:not(:disabled) {
  transform: scale(0.93) translateY(2px);
  box-shadow: 0 1px 0 #1c3a70;
}

.level-btn--locked {
  background: linear-gradient(145deg, #2a2a3e, #222235);
  box-shadow: 0 3px 0 #151525;
  cursor: not-allowed;
}

.level-btn--current {
  background: linear-gradient(145deg, #ff8c00, #e06800);
  box-shadow: 0 3px 0 #a04500, inset 0 1px 0 rgba(255,255,255,0.2);
  animation: pulse 2s infinite;
}

.level-btn--completed {
  background: linear-gradient(145deg, #2d8f4e, #1e6b38);
  box-shadow: 0 3px 0 #14482a, inset 0 1px 0 rgba(255,255,255,0.1);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

.level-btn__num {
  font-size: 16px;
  font-weight: 800;
}

.level-btn__play {
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 1px;
  opacity: 0.9;
}

.level-btn__lock {
  font-size: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.level-btn--locked .level-btn__num {
  opacity: 0;
}

/* Bottom Nav */
.home__nav {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2px 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 8px 0 6px;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  font-size: 10px;
  font-weight: 600;
  transition: color 0.2s;
}

.nav-item--active {
  color: #ffd700;
}

.nav-item__img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.nav-item__emoji {
  font-size: 20px;
}
</style>

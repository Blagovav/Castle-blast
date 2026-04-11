<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTelegram } from '@/composables/useTelegram';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '@/stores/player';
import { useEconomyStore } from '@/stores/economy';
import { MAX_LIVES } from '@castle-blast/shared';
import { CoinsCounter, InlineEnergyBar, EnergyPlusButton, NoEnergyModal, OfflineIncomePopup } from '@umbrella-software-corp/ui-kit';

const { user } = useTelegram();
const router = useRouter();
const playerStore = usePlayerStore();
const economyStore = useEconomyStore();

const TOTAL_LEVELS = 50;
const currentLevel = computed(() => playerStore.profile?.currentLevel ?? 1);
const showNoEnergy = ref(false);
const showOfflineIncome = ref(false);
const offlineAmount = ref(247);

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
  if (!playerStore.canPlay) {
    showNoEnergy.value = true;
    return;
  }
  router.push({ name: 'play', params: { levelNum: num } });
}

function collectOffline() {
  economyStore.coins += offlineAmount.value;
  offlineAmount.value = 0;
  showOfflineIncome.value = false;
}
</script>

<template>
  <div class="home">
    <!-- Top Bar with UI Kit components -->
    <header class="home__topbar">
      <div class="home__user">
        <div class="home__avatar">{{ user?.first_name?.[0] ?? '?' }}</div>
        <div class="home__user-info">
          <span class="home__username">{{ user?.first_name ?? 'Player' }}</span>
          <span class="home__user-level">Level {{ currentLevel }}</span>
        </div>
      </div>
      <div class="home__currencies">
        <CoinsCounter :value="economyStore.coins" />
      </div>
    </header>

    <!-- Energy Bar (UI Kit) -->
    <div class="home__energy-wrap">
      <InlineEnergyBar :energy="playerStore.lives" :max-energy="MAX_LIVES" />
      <EnergyPlusButton @click="router.push({ name: 'shop' })" />
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

    <!-- No Energy Modal (UI Kit) -->
    <NoEnergyModal
      v-if="showNoEnergy"
      :time-to-next="playerStore.nextLifeIn ?? ''"
      title="Out of lives!"
      description="You need lives to play. Wait or buy more!"
      next-energy-label="Next life in"
      shop-label="Go to Shop"
      wait-label="Wait"
      @close="showNoEnergy = false"
      @go-shop="showNoEnergy = false; router.push({ name: 'shop' })"
    />

    <!-- Offline Income Popup (UI Kit) -->
    <OfflineIncomePopup
      :visible="showOfflineIncome && offlineAmount > 0"
      :amount="offlineAmount"
      title="Welcome back!"
      subtitle="Your kingdom earned while you were away"
      collect-label="Collect"
      @close="showOfflineIncome = false"
      @claim="collectOffline"
    />
  </div>
</template>

<style scoped>
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-darkest, #13121D);
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

/* Top Bar */
.home__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-dark, #1B1A26);
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
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: var(--color-bg-darkest, #13121D);
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

/* CoinsCounter from UI kit handles styling */

/* Energy Bar (UI Kit) */
.home__energy-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
}

.home__energy-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
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
  font-family: var(--font-family, "Unbounded"), sans-serif;
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
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
  font-family: var(--font-family, "Unbounded"), sans-serif;
  background: linear-gradient(145deg, var(--accent-blue, #0060DF), #2855a8);
  box-shadow: 0 3px 0 #1c3a70, inset 0 1px 0 rgba(255,255,255,0.15);
}

.level-btn:active:not(:disabled) {
  transform: scale(0.93) translateY(2px);
  box-shadow: 0 1px 0 #1c3a70;
}

.level-btn--locked {
  background: linear-gradient(145deg, var(--color-bg-card, #2B2A34), #222235);
  box-shadow: 0 3px 0 #151525;
  cursor: not-allowed;
}

.level-btn--current {
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  color: var(--color-bg-darkest, #13121D);
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
  background: var(--color-bg-dark, #1B1A26);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2px 0;
  padding-bottom: var(--tma-bottom-ui-safe-bottom, 0px);
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
  font-family: var(--font-family, "Unbounded"), sans-serif;
  transition: color 0.2s;
}

.nav-item--active {
  color: var(--color-gold, #FFD700);
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

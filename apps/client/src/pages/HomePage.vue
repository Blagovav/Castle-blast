<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTelegram } from '@/composables/useTelegram';
import { usePlayerStore } from '@/stores/player';
import { useEconomyStore } from '@/stores/economy';
import { MAX_LIVES } from '@castle-blast/shared';
import { CoinsCounter, InlineEnergyBar, EnergyPlusButton, NoEnergyModal, OfflineIncomePopup, PrimaryCtaButton } from '@umbrella-software-corp/ui-kit';

const { user } = useTelegram();
const router = useRouter();
const playerStore = usePlayerStore();
const economyStore = useEconomyStore();

const currentLevel = computed(() => playerStore.profile?.currentLevel ?? 1);
const showNoEnergy = ref(false);
const showOfflineIncome = ref(true); // Show on first load
const offlineAmount = ref(247);

function goPlay() {
  if (!playerStore.canPlay) {
    showNoEnergy.value = true;
    return;
  }
  // Go directly to current level
  router.push({ name: 'play', params: { levelNum: currentLevel.value } });
}

function goLevelSelect() {
  router.push({ name: 'levels' });
}

function collectOffline() {
  economyStore.coins += offlineAmount.value;
  offlineAmount.value = 0;
  showOfflineIncome.value = false;
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
        </div>
      </div>
      <div class="home__stats">
        <CoinsCounter :value="economyStore.coins" />
        <div class="home__energy-pill">
          <span class="home__energy-icon">⚡</span>
          <span class="home__energy-text">{{ playerStore.lives }}/{{ MAX_LIVES }}</span>
        </div>
      </div>
    </header>

    <!-- Quick Actions -->
    <div class="home__actions">
      <button class="home__action-btn" @click="router.push({ name: 'leaderboard' })">
        <span class="home__action-emoji">🏆</span>
        <span class="home__action-label">RANKS</span>
      </button>
      <button class="home__action-btn home__action-btn--gold" @click="router.push({ name: 'referral' })">
        <span class="home__action-emoji">👥</span>
        <span class="home__action-label">FRIENDS</span>
      </button>
    </div>

    <!-- Main Content Area -->
    <div class="home__content">
      <!-- Kingdom Preview Card -->
      <div class="home__kingdom-card" @click="router.push({ name: 'kingdom' })">
        <img src="/sprites/building_castle.png" class="home__kingdom-img" alt="" />
        <div class="home__kingdom-info">
          <span class="home__kingdom-title">Your Kingdom</span>
          <span class="home__kingdom-income">
            <img src="/sprites/icon_coin.png" class="home__kingdom-coin" alt="" />
            80 / hour
          </span>
        </div>
        <span class="home__kingdom-arrow">›</span>
      </div>

      <!-- Current Level Card -->
      <div class="home__level-card" @click="goPlay">
        <div class="home__level-badge">Level {{ currentLevel }}</div>
        <div class="home__level-center">
          <img src="/sprites/icon_star_gold.png" class="home__level-star" alt="" />
          <span class="home__level-text">Tap to Play!</span>
        </div>
      </div>

      <!-- Play Button -->
      <div class="home__play-wrap">
        <button class="home__play-btn" @click="goPlay">
          <span class="home__play-icon">▶</span>
          <span class="home__play-text">PLAY</span>
        </button>
        <button class="home__levels-btn" @click="goLevelSelect">
          Select Level
        </button>
      </div>

      <!-- Daily Quests Preview -->
      <div class="home__quests">
        <div class="home__quest">
          <span class="home__quest-icon">🎯</span>
          <div class="home__quest-info">
            <span class="home__quest-title">Complete 3 levels</span>
            <div class="home__quest-bar">
              <div class="home__quest-fill" style="width: 33%"></div>
            </div>
          </div>
          <span class="home__quest-reward">🪙 200</span>
        </div>
        <div class="home__quest">
          <span class="home__quest-icon">💎</span>
          <div class="home__quest-info">
            <span class="home__quest-title">Match 50 gems</span>
            <div class="home__quest-bar">
              <div class="home__quest-fill" style="width: 0%"></div>
            </div>
          </div>
          <span class="home__quest-reward">⭐ 1</span>
        </div>
      </div>
    </div>

    <!-- Bottom Nav -->
    <nav class="home__nav">
      <router-link to="/kingdom" class="nav-tab">
        <img src="/sprites/building_castle.png" class="nav-tab__img" alt="" />
        <span>BASE</span>
      </router-link>
      <router-link to="/leaderboard" class="nav-tab">
        <img src="/sprites/icon_star_gold.png" class="nav-tab__img" alt="" />
        <span>RANKS</span>
      </router-link>
      <router-link to="/levels" class="nav-tab nav-tab--play">
        <div class="nav-tab__play-circle">▶</div>
        <span>PLAY</span>
      </router-link>
      <router-link to="/referral" class="nav-tab">
        <img src="/sprites/chest_common.png" class="nav-tab__img" alt="" />
        <span>INVITE</span>
      </router-link>
      <router-link to="/shop" class="nav-tab">
        <img src="/sprites/chest_rare.png" class="nav-tab__img" alt="" />
        <span>SHOP</span>
      </router-link>
    </nav>

    <!-- Modals -->
    <NoEnergyModal
      v-if="showNoEnergy"
      :time-to-next="playerStore.nextLifeIn ?? ''"
      title="Out of lives!"
      description="You need lives to play. Wait or buy more!"
      @close="showNoEnergy = false"
      @go-shop="showNoEnergy = false; router.push({ name: 'shop' })"
    />

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
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
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
  flex-shrink: 0;
}

.home__user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
  color: var(--color-bg-darkest, #13121D);
  border: 2px solid rgba(255, 215, 0, 0.4);
}

.home__username {
  font-weight: 700;
  font-size: 14px;
}

.home__stats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.home__energy-pill {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--color-bg-card, #2B2A34);
  border: 1px solid rgba(255, 165, 0, 0.3);
  font-size: 12px;
  font-weight: 700;
  color: #FFA500;
}

.home__energy-icon { font-size: 12px; }

/* Quick Actions */
.home__actions {
  display: flex;
  gap: 8px;
  padding: 10px 12px 0;
  flex-shrink: 0;
}

.home__action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: var(--color-bg-card, #2B2A34);
  color: #fff;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  letter-spacing: 0.5px;
}

.home__action-btn--gold {
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  color: var(--color-bg-darkest, #13121D);
  border-color: transparent;
}

.home__action-emoji { font-size: 16px; }

/* Main Content */
.home__content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Kingdom Preview */
.home__kingdom-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--color-bg-card, #2B2A34);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
}

.home__kingdom-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 10px;
}

.home__kingdom-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.home__kingdom-title { font-weight: 700; font-size: 14px; }

.home__kingdom-income {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-gold, #FFD700);
}

.home__kingdom-coin { width: 14px; height: 14px; }
.home__kingdom-arrow { font-size: 24px; opacity: 0.3; }

/* Current Level */
.home__level-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(145deg, var(--color-bg-card, #2B2A34), #1e1d2a);
  border: 1px solid rgba(255, 215, 0, 0.15);
  cursor: pointer;
}

.home__level-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  color: var(--color-bg-darkest, #13121D);
}

.home__level-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.home__level-star { width: 36px; height: 36px; }
.home__level-text { font-size: 13px; opacity: 0.6; }

/* Play Button */
.home__play-wrap {
  display: flex;
  gap: 8px;
}

.home__play-btn {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: none;
  border-radius: 14px;
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  color: var(--color-bg-darkest, #13121D);
  font-family: var(--font-family, "Unbounded"), sans-serif;
  font-weight: 900;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 0 #b37400;
  letter-spacing: 1px;
}

.home__play-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #b37400;
}

.home__play-icon { font-size: 20px; }

.home__levels-btn {
  flex: 1;
  padding: 16px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  background: var(--color-bg-card, #2B2A34);
  color: #fff;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  font-weight: 600;
  font-size: 11px;
  cursor: pointer;
}

/* Quests */
.home__quests {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home__quest {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--color-bg-card, #2B2A34);
}

.home__quest-icon { font-size: 20px; }

.home__quest-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.home__quest-title { font-size: 12px; font-weight: 600; }

.home__quest-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.home__quest-fill {
  height: 100%;
  background: var(--accent-green, #C5FF00);
  border-radius: 2px;
}

.home__quest-reward {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-gold, #FFD700);
  white-space: nowrap;
}

/* Bottom Nav */
.home__nav {
  display: flex;
  background: var(--color-bg-dark, #1B1A26);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  padding-bottom: var(--tma-bottom-ui-safe-bottom, 0px);
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0 6px;
  color: var(--text-muted, rgba(255,255,255,0.4));
  text-decoration: none;
  font-size: 9px;
  font-weight: 800;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  letter-spacing: 0.5px;
}

.nav-tab__img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.nav-tab--play {
  color: var(--color-gold, #FFD700);
  position: relative;
  margin-top: -8px;
}

.nav-tab__play-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  color: var(--color-bg-darkest, #13121D);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 3px 0 #b37400, 0 0 12px rgba(255, 215, 0, 0.3);
}

.router-link-active.nav-tab {
  color: var(--color-gold, #FFD700);
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTelegram } from '@/composables/useTelegram';

const router = useRouter();
const { user } = useTelegram();
const tg = window.Telegram?.WebApp;
const activeTab = ref<'weekly' | 'allTime'>('weekly');

interface LeaderEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  isMe: boolean;
}

// Mock data
const weeklyBoard = ref<LeaderEntry[]>([
  { rank: 1, name: 'ProGamer99', score: 52400, level: 45, isMe: false },
  { rank: 2, name: 'BlastKing', score: 48200, level: 42, isMe: false },
  { rank: 3, name: 'CrushQueen', score: 41800, level: 38, isMe: false },
  { rank: 4, name: 'MatchMaster', score: 38500, level: 35, isMe: false },
  { rank: 5, name: 'TileWizard', score: 35100, level: 33, isMe: false },
  { rank: 6, name: 'SwapNinja', score: 31200, level: 30, isMe: false },
  { rank: 7, name: 'ComboFreak', score: 28800, level: 28, isMe: false },
  { rank: 8, name: 'StarHunter', score: 25400, level: 25, isMe: false },
  { rank: 9, name: 'BombSquad', score: 22100, level: 22, isMe: false },
  { rank: 10, name: 'RocketMan', score: 19800, level: 20, isMe: false },
  { rank: 11, name: 'CastleLord', score: 17500, level: 18, isMe: false },
  { rank: 12, name: 'GemCollector', score: 15200, level: 16, isMe: false },
  { rank: 13, name: 'PuzzleAce', score: 12900, level: 14, isMe: false },
  { rank: 14, name: 'ChainReactor', score: 10600, level: 12, isMe: false },
  { rank: 15, name: 'TileBreaker', score: 8300, level: 10, isMe: false },
  { rank: 42, name: user.value?.first_name ?? 'You', score: 1200, level: 1, isMe: true },
]);

const allTimeBoard = ref<LeaderEntry[]>([
  { rank: 1, name: 'ProGamer99', score: 284000, level: 50, isMe: false },
  { rank: 2, name: 'BlastKing', score: 256000, level: 50, isMe: false },
  { rank: 3, name: 'CrushQueen', score: 231000, level: 48, isMe: false },
  { rank: 4, name: 'MatchMaster', score: 198000, level: 46, isMe: false },
  { rank: 5, name: 'TileWizard', score: 175000, level: 44, isMe: false },
  { rank: 6, name: 'SwapNinja', score: 162000, level: 42, isMe: false },
  { rank: 7, name: 'ComboFreak', score: 148000, level: 40, isMe: false },
  { rank: 8, name: 'StarHunter', score: 134000, level: 38, isMe: false },
  { rank: 9, name: 'BombSquad', score: 121000, level: 36, isMe: false },
  { rank: 10, name: 'RocketMan', score: 108000, level: 34, isMe: false },
  { rank: 78, name: user.value?.first_name ?? 'You', score: 1200, level: 1, isMe: true },
]);

const currentBoard = ref(weeklyBoard.value);
const playerRank = ref(42);

function switchTab(tab: 'weekly' | 'allTime') {
  activeTab.value = tab;
  currentBoard.value = tab === 'weekly' ? weeklyBoard.value : allTimeBoard.value;
  playerRank.value = tab === 'weekly' ? 42 : 78;
}

function goBack() {
  router.push({ name: 'home' });
}

onMounted(() => {
  tg?.BackButton.show();
  tg?.BackButton.onClick(goBack);
});

onUnmounted(() => {
  tg?.BackButton.hide();
  tg?.BackButton.offClick(goBack);
});

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}
</script>

<template>
  <div class="lb">
    <header class="lb__header">
      <button class="lb__back" @click="goBack">←</button>
      <h2>Leaderboard</h2>
    </header>

    <!-- Tabs -->
    <div class="lb__tabs">
      <button
        class="lb__tab"
        :class="{ 'lb__tab--active': activeTab === 'weekly' }"
        @click="switchTab('weekly')"
      >
        Weekly
      </button>
      <button
        class="lb__tab"
        :class="{ 'lb__tab--active': activeTab === 'allTime' }"
        @click="switchTab('allTime')"
      >
        All Time
      </button>
    </div>

    <!-- Player Rank Banner -->
    <div class="lb__my-rank">
      <span>Your Rank</span>
      <strong>#{{ playerRank }}</strong>
    </div>

    <!-- Leaderboard List -->
    <div class="lb__list">
      <div
        v-for="entry in currentBoard"
        :key="entry.rank"
        class="lb__entry"
        :class="{ 'lb__entry--me': entry.isMe, 'lb__entry--top3': entry.rank <= 3 }"
      >
        <div class="lb__rank">
          <span v-if="entry.rank <= 3" class="lb__medal">{{ getMedalEmoji(entry.rank) }}</span>
          <span v-else class="lb__rank-num">{{ entry.rank }}</span>
        </div>
        <div class="lb__avatar" :class="{ 'lb__avatar--me': entry.isMe }">
          {{ entry.name[0] }}
        </div>
        <div class="lb__info">
          <span class="lb__name">{{ entry.name }}</span>
          <span class="lb__level">Lvl {{ entry.level }}</span>
        </div>
        <div class="lb__score">{{ entry.score.toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lb {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.lb__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #16213e;
}

.lb__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}

.lb__header h2 {
  font-size: 20px;
}

.lb__tabs {
  display: flex;
  margin: 12px 16px 0;
  background: #22264a;
  border-radius: 12px;
  padding: 3px;
}

.lb__tab {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.lb__tab--active {
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
}

.lb__my-rank {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #2d3a6a, #1e2a4a);
  border: 1px solid rgba(74, 144, 217, 0.3);
  border-radius: 12px;
}

.lb__my-rank span {
  font-size: 14px;
  opacity: 0.7;
}

.lb__my-rank strong {
  font-size: 22px;
  color: #ffd700;
}

.lb__list {
  flex: 1;
  padding: 0 12px 16px;
  overflow-y: auto;
}

.lb__entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  margin-bottom: 4px;
}

.lb__entry--me {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.lb__entry--top3 {
  background: rgba(255, 255, 255, 0.04);
}

.lb__rank {
  width: 32px;
  text-align: center;
}

.lb__medal {
  font-size: 22px;
}

.lb__rank-num {
  font-size: 14px;
  font-weight: 700;
  opacity: 0.5;
}

.lb__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.lb__avatar--me {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a1a2e;
}

.lb__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.lb__name {
  font-weight: 600;
  font-size: 14px;
}

.lb__level {
  font-size: 11px;
  opacity: 0.5;
}

.lb__score {
  font-weight: 700;
  font-size: 14px;
  color: #ffd700;
}
</style>

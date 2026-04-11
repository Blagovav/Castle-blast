<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTelegram } from '@/composables/useTelegram';
import { ScreenLayout, BaseTabs } from '@umbrella-software-corp/ui-kit';

const router = useRouter();
const { user } = useTelegram();
const activeTab = ref('weekly');

const tabs = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'allTime', label: 'All Time' },
];

interface LeaderEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  isMe: boolean;
}

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

const currentBoard = computed(() =>
  activeTab.value === 'weekly' ? weeklyBoard.value : allTimeBoard.value,
);

const playerRank = computed(() =>
  activeTab.value === 'weekly' ? 42 : 78,
);

function goBack() {
  router.push({ name: 'home' });
}

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}
</script>

<template>
  <ScreenLayout title="Leaderboard" @back="goBack">
    <!-- Tabs using UI Kit -->
    <div class="lb__tabs-wrap">
      <BaseTabs :tabs="tabs" v-model="activeTab" />
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
  </ScreenLayout>
</template>

<style scoped>
.lb__tabs-wrap {
  padding: 12px 16px 0;
}

.lb__my-rank {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
  padding: 14px 16px;
  background: var(--color-bg-card, #2B2A34);
  border: 1px solid rgba(74, 144, 217, 0.3);
  border-radius: 12px;
}

.lb__my-rank span {
  font-size: 14px;
  opacity: 0.7;
}

.lb__my-rank strong {
  font-size: 22px;
  color: var(--color-gold, #FFD700);
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.lb__list {
  padding: 0 0 16px;
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
  background: var(--color-bg-card, #2B2A34);
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
  background: linear-gradient(135deg, var(--accent-blue, #0060DF), #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  flex-shrink: 0;
}

.lb__avatar--me {
  background: var(--gradient-gold, linear-gradient(135deg, #FFD700, #FFA500));
  color: var(--color-bg-darkest, #13121D);
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
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.lb__level {
  font-size: 11px;
  opacity: 0.5;
}

.lb__score {
  font-weight: 700;
  font-size: 14px;
  color: var(--color-gold, #FFD700);
  font-family: var(--font-family, "Unbounded"), sans-serif;
}
</style>

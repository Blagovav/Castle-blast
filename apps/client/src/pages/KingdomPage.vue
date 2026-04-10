<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEconomyStore } from '@/stores/economy';

const router = useRouter();
const economyStore = useEconomyStore();

interface BuildingDisplay {
  type: string;
  name: string;
  icon: string;
  level: number;
  incomePerHour: number;
  upgradeCost: number;
  color: string;
}

const buildings = ref<BuildingDisplay[]>([
  { type: 'castle', name: 'Castle', icon: '🏰', level: 1, incomePerHour: 50, upgradeCost: 500, color: '#4a90d9' },
  { type: 'farm', name: 'Farm', icon: '🌾', level: 1, incomePerHour: 30, upgradeCost: 300, color: '#2ecc71' },
  { type: 'mine', name: 'Mine', icon: '⛏️', level: 0, incomePerHour: 0, upgradeCost: 800, color: '#e67e22' },
  { type: 'barracks', name: 'Barracks', icon: '⚔️', level: 0, incomePerHour: 0, upgradeCost: 1200, color: '#e74c3c' },
  { type: 'tower', name: 'Tower', icon: '🗼', level: 0, incomePerHour: 0, upgradeCost: 2000, color: '#9b59b6' },
]);

const pendingIncome = ref(120);

const totalIncomePerHour = computed(() =>
  buildings.value.reduce((sum, b) => sum + b.incomePerHour, 0),
);

function goBack() {
  router.push({ name: 'home' });
}

// Telegram Back Button
const tg = window.Telegram?.WebApp;
onMounted(() => {
  tg?.BackButton.show();
  tg?.BackButton.onClick(goBack);
});
onUnmounted(() => {
  tg?.BackButton.hide();
  tg?.BackButton.offClick(goBack);
});

function collectIncome() {
  economyStore.coins += pendingIncome.value;
  pendingIncome.value = 0;
}

function upgradeBuilding(b: BuildingDisplay) {
  if (economyStore.coins < b.upgradeCost) return;
  economyStore.coins -= b.upgradeCost;
  b.level++;
  b.incomePerHour = Math.floor(b.level * 30 * (b.type === 'castle' ? 1.5 : 1));
  b.upgradeCost = Math.floor(b.upgradeCost * 1.4);
}
</script>

<template>
  <div class="kingdom">
    <header class="kingdom__header">
      <button class="kingdom__back" @click="goBack">←</button>
      <h2>Kingdom</h2>
      <div class="kingdom__coins">🪙 {{ economyStore.coins }}</div>
    </header>

    <div class="kingdom__income" v-if="pendingIncome > 0" @click="collectIncome">
      <div class="kingdom__income-text">
        <span>Idle Income Ready!</span>
        <strong>+{{ pendingIncome }} coins</strong>
      </div>
      <button class="kingdom__collect-btn">Collect</button>
    </div>

    <div class="kingdom__rate">
      Income: {{ totalIncomePerHour }} coins/hour
    </div>

    <div class="kingdom__buildings">
      <div
        v-for="b in buildings"
        :key="b.type"
        class="kingdom__building"
        :class="{ 'kingdom__building--locked': b.level === 0 }"
      >
        <div class="kingdom__building-icon" :style="{ background: b.level > 0 ? b.color : '#333' }">
          {{ b.icon }}
        </div>
        <div class="kingdom__building-info">
          <span class="kingdom__building-name">{{ b.name }}</span>
          <span v-if="b.level > 0" class="kingdom__building-level">Lvl {{ b.level }}</span>
          <span v-else class="kingdom__building-level">Locked</span>
          <span v-if="b.level > 0" class="kingdom__building-rate">{{ b.incomePerHour }}/hr</span>
        </div>
        <button
          class="kingdom__upgrade-btn"
          :disabled="economyStore.coins < b.upgradeCost"
          @click="upgradeBuilding(b)"
        >
          {{ b.level === 0 ? 'Build' : 'Upgrade' }}
          <br>
          <small>🪙 {{ b.upgradeCost }}</small>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kingdom {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.kingdom__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #16213e;
}

.kingdom__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}

.kingdom__header h2 {
  flex: 1;
  font-size: 20px;
}

.kingdom__coins {
  font-weight: 700;
  font-size: 16px;
  color: #ffd700;
}

.kingdom__income {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #2d6a1e, #1a4a0e);
  border-radius: 14px;
  cursor: pointer;
}

.kingdom__income-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kingdom__income-text span {
  font-size: 12px;
  opacity: 0.8;
}

.kingdom__income-text strong {
  font-size: 18px;
  color: #ffd700;
}

.kingdom__collect-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a1a2e;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.kingdom__rate {
  text-align: center;
  font-size: 13px;
  opacity: 0.5;
  padding: 4px 0 8px;
}

.kingdom__buildings {
  flex: 1;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.kingdom__building {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #22264a;
}

.kingdom__building--locked {
  opacity: 0.6;
}

.kingdom__building-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.kingdom__building-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kingdom__building-name {
  font-weight: 700;
  font-size: 15px;
}

.kingdom__building-level {
  font-size: 12px;
  opacity: 0.6;
}

.kingdom__building-rate {
  font-size: 12px;
  color: #ffd700;
}

.kingdom__upgrade-btn {
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  line-height: 1.3;
  min-width: 80px;
}

.kingdom__upgrade-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.kingdom__upgrade-btn small {
  font-size: 11px;
  opacity: 0.8;
}
</style>

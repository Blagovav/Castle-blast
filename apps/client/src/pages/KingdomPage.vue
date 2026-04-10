<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEconomyStore } from '@/stores/economy';
import { BaseModal, PrimaryCtaButton, ProgressBar } from '@umbrella-software-corp/ui-kit';

const router = useRouter();
const economyStore = useEconomyStore();
const tg = window.Telegram?.WebApp;

interface BuildingDisplay {
  type: string;
  name: string;
  sprite: string;
  level: number;
  maxLevel: number;
  incomePerHour: number;
  upgradeCost: number;
  color: string;
  description: string;
  unlockLevel: number;
}

const buildings = ref<BuildingDisplay[]>([
  { type: 'castle', name: 'Castle', sprite: '/sprites/building_castle.png', level: 1, maxLevel: 10, incomePerHour: 50, upgradeCost: 500, color: '#4a90d9', description: 'Royal residence. Generates gold from taxes.', unlockLevel: 1 },
  { type: 'farm', name: 'Farm', sprite: '/sprites/building_farm.png', level: 1, maxLevel: 10, incomePerHour: 30, upgradeCost: 300, color: '#2ecc71', description: 'Grows crops for trade income.', unlockLevel: 1 },
  { type: 'mine', name: 'Gold Mine', sprite: '/sprites/building_mine.png', level: 0, maxLevel: 10, incomePerHour: 0, upgradeCost: 800, color: '#e67e22', description: 'Extracts precious gold ore.', unlockLevel: 5 },
  { type: 'barracks', name: 'Barracks', sprite: '/sprites/building_barracks.png', level: 0, maxLevel: 10, incomePerHour: 0, upgradeCost: 1200, color: '#e74c3c', description: 'Trains warriors for bounty hunts.', unlockLevel: 10 },
  { type: 'tower', name: 'Wizard Tower', sprite: '/sprites/building_tower.png', level: 0, maxLevel: 10, incomePerHour: 0, upgradeCost: 2000, color: '#9b59b6', description: 'Magical research generates arcane income.', unlockLevel: 15 },
]);

const pendingIncome = ref(247);
const showUpgradeModal = ref(false);
const selectedBuilding = ref<BuildingDisplay | null>(null);

const totalIncomePerHour = computed(() =>
  buildings.value.reduce((sum, b) => sum + b.incomePerHour, 0),
);

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

function collectIncome() {
  if (pendingIncome.value <= 0) return;
  economyStore.coins += pendingIncome.value;
  pendingIncome.value = 0;
}

function openUpgrade(b: BuildingDisplay) {
  selectedBuilding.value = b;
  showUpgradeModal.value = true;
}

function upgradeBuilding() {
  const b = selectedBuilding.value;
  if (!b || economyStore.coins < b.upgradeCost) return;
  economyStore.coins -= b.upgradeCost;
  b.level++;
  b.incomePerHour = Math.floor(b.level * 25 * (b.type === 'castle' ? 2 : b.type === 'tower' ? 1.8 : 1));
  b.upgradeCost = Math.floor(b.upgradeCost * 1.5);
  showUpgradeModal.value = false;
}
</script>

<template>
  <div class="kingdom">
    <header class="kingdom__header">
      <button class="kingdom__back" @click="goBack">←</button>
      <h2>Kingdom</h2>
      <div class="kingdom__coins">
        <img src="/sprites/icon_coin.png" class="kingdom__coin-img" alt="" />
        {{ economyStore.coins.toLocaleString() }}
      </div>
    </header>

    <!-- Idle Income Collection -->
    <div class="kingdom__collect" v-if="pendingIncome > 0" @click="collectIncome">
      <div class="kingdom__collect-glow"></div>
      <div class="kingdom__collect-content">
        <div class="kingdom__collect-left">
          <img src="/sprites/chest_common.png" class="kingdom__chest" alt="" />
          <div>
            <div class="kingdom__collect-label">Idle Income Ready!</div>
            <div class="kingdom__collect-amount">
              <img src="/sprites/icon_coin.png" class="kingdom__mini-coin" alt="" />
              +{{ pendingIncome.toLocaleString() }}
            </div>
          </div>
        </div>
        <button class="kingdom__collect-btn">Collect</button>
      </div>
    </div>

    <!-- Income Rate -->
    <div class="kingdom__rate">
      <img src="/sprites/icon_coin.png" class="kingdom__rate-icon" alt="" />
      {{ totalIncomePerHour }} / hour
    </div>

    <!-- Buildings -->
    <div class="kingdom__buildings">
      <div
        v-for="b in buildings"
        :key="b.type"
        class="building"
        :class="{ 'building--locked': b.level === 0 }"
        @click="b.level > 0 || economyStore.coins >= b.upgradeCost ? openUpgrade(b) : null"
      >
        <div class="building__sprite-wrap" :style="{ borderColor: b.level > 0 ? b.color : '#333' }">
          <img :src="b.sprite" class="building__sprite" :class="{ 'building__sprite--locked': b.level === 0 }" alt="" />
          <div v-if="b.level > 0" class="building__level-badge" :style="{ background: b.color }">{{ b.level }}</div>
        </div>
        <div class="building__info">
          <div class="building__name">{{ b.name }}</div>
          <div class="building__desc">{{ b.description }}</div>
          <div v-if="b.level > 0" class="building__income">
            <img src="/sprites/icon_coin.png" class="building__income-icon" alt="" />
            {{ b.incomePerHour }}/hr
          </div>
          <div v-else class="building__unlock">Unlock at Level {{ b.unlockLevel }}</div>
          <div v-if="b.level > 0" class="building__progress">
            <div class="building__progress-bar">
              <div class="building__progress-fill" :style="{ width: (b.level / b.maxLevel * 100) + '%', background: b.color }"></div>
            </div>
            <span class="building__progress-text">{{ b.level }}/{{ b.maxLevel }}</span>
          </div>
        </div>
        <button
          class="building__upgrade-btn"
          :disabled="economyStore.coins < b.upgradeCost"
          :style="{ background: economyStore.coins >= b.upgradeCost ? `linear-gradient(135deg, ${b.color}, ${b.color}dd)` : '' }"
        >
          {{ b.level === 0 ? 'Build' : 'Upgrade' }}
          <div class="building__upgrade-cost">
            <img src="/sprites/icon_coin.png" class="building__cost-icon" alt="" />
            {{ b.upgradeCost.toLocaleString() }}
          </div>
        </button>
      </div>
    </div>

    <!-- Upgrade Modal -->
    <BaseModal v-if="showUpgradeModal && selectedBuilding" @close="showUpgradeModal = false" max-width="320px">
      <div class="upgrade-modal">
        <img :src="selectedBuilding.sprite" class="upgrade-modal__sprite" alt="" />
        <h3>{{ selectedBuilding.name }}</h3>
        <p>{{ selectedBuilding.description }}</p>

        <div class="upgrade-modal__stats">
          <div class="upgrade-modal__stat">
            <span>Level</span>
            <strong>{{ selectedBuilding.level }} → {{ selectedBuilding.level + 1 }}</strong>
          </div>
          <div class="upgrade-modal__stat">
            <span>Income</span>
            <strong>
              {{ selectedBuilding.incomePerHour }}/hr →
              {{ Math.floor((selectedBuilding.level + 1) * 25 * (selectedBuilding.type === 'castle' ? 2 : selectedBuilding.type === 'tower' ? 1.8 : 1)) }}/hr
            </strong>
          </div>
        </div>

        <div class="upgrade-modal__cost">
          <img src="/sprites/icon_coin.png" class="upgrade-modal__cost-icon" alt="" />
          {{ selectedBuilding.upgradeCost.toLocaleString() }}
        </div>

        <div class="upgrade-modal__actions">
          <button class="upgrade-modal__cancel" @click="showUpgradeModal = false">Cancel</button>
          <PrimaryCtaButton
            :disabled="economyStore.coins < selectedBuilding.upgradeCost"
            @click="upgradeBuilding"
          >
            {{ selectedBuilding.level === 0 ? 'Build' : 'Upgrade' }}
          </PrimaryCtaButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.kingdom {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0f1028 0%, #1a2040 50%, #12122a 100%);
}

.kingdom__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
}

.kingdom__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}

.kingdom__header h2 { flex: 1; font-size: 20px; }

.kingdom__coins {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-size: 15px;
  color: #ffd700;
}

.kingdom__coin-img { width: 18px; height: 18px; }

/* Collect Banner */
.kingdom__collect {
  position: relative;
  margin: 12px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(135deg, #1a5e2a, #0d3a18);
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.kingdom__collect-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 50%, rgba(46, 204, 113, 0.15), transparent 70%);
}

.kingdom__collect-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.kingdom__collect-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kingdom__chest { width: 40px; height: 40px; object-fit: contain; }

.kingdom__collect-label { font-size: 12px; opacity: 0.8; }

.kingdom__collect-amount {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 20px;
  font-weight: 800;
  color: #ffd700;
}

.kingdom__mini-coin { width: 16px; height: 16px; }

.kingdom__collect-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a1a2e;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.kingdom__rate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  opacity: 0.5;
  padding: 0 0 8px;
}

.kingdom__rate-icon { width: 14px; height: 14px; }

/* Buildings */
.kingdom__buildings {
  flex: 1;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.building {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.2s;
}

.building:active { background: rgba(255, 255, 255, 0.08); }
.building--locked { opacity: 0.5; }

.building__sprite-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 2px solid;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
}

.building__sprite {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.building__sprite--locked { filter: grayscale(1) brightness(0.5); }

.building__level-badge {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 20px;
  height: 20px;
  border-radius: 6px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.building__info {
  flex: 1;
  min-width: 0;
}

.building__name { font-weight: 700; font-size: 14px; }
.building__desc { font-size: 11px; opacity: 0.5; margin: 1px 0; }

.building__income {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #ffd700;
  font-weight: 600;
}

.building__income-icon { width: 12px; height: 12px; }
.building__unlock { font-size: 11px; color: #ff6b6b; }

.building__progress { display: flex; align-items: center; gap: 6px; margin-top: 4px; }

.building__progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.building__progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.building__progress-text { font-size: 10px; opacity: 0.4; }

.building__upgrade-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4a4a6a, #3a3a5a);
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
  min-width: 70px;
}

.building__upgrade-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.building__upgrade-cost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 10px;
  margin-top: 2px;
  opacity: 0.8;
}

.building__cost-icon { width: 10px; height: 10px; }

/* Upgrade Modal */
.upgrade-modal { text-align: center; }
.upgrade-modal__sprite { width: 80px; height: 80px; object-fit: contain; margin-bottom: 12px; }
.upgrade-modal h3 { font-size: 20px; margin-bottom: 4px; }
.upgrade-modal p { font-size: 13px; opacity: 0.6; margin-bottom: 16px; }

.upgrade-modal__stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.upgrade-modal__stat {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.upgrade-modal__stat span { opacity: 0.6; }
.upgrade-modal__stat strong { color: #2ecc71; }

.upgrade-modal__cost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 22px;
  font-weight: 800;
  color: #ffd700;
  margin-bottom: 16px;
}

.upgrade-modal__cost-icon { width: 22px; height: 22px; }

.upgrade-modal__actions { display: flex; gap: 10px; }

.upgrade-modal__cancel {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
</style>

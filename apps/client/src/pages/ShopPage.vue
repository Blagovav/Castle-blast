<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEconomyStore } from '@/stores/economy';
import { usePlayerStore } from '@/stores/player';
import { BaseModal, PrimaryCtaButton } from '@umbrella-software-corp/ui-kit';
import {
  COST_LIVES_REFILL,
  COST_EXTRA_MOVES,
  COST_BOOSTER_PACK,
  COST_STARTER_PACK,
  COST_PREMIUM,
} from '@castle-blast/shared';

const router = useRouter();
const economyStore = useEconomyStore();
const playerStore = usePlayerStore();
const showConfirm = ref(false);
const selectedItem = ref<typeof shopItems[number] | null>(null);

const shopItems = [
  { id: 'lives_refill', name: 'Lives Refill', desc: '+5 lives instantly', price: COST_LIVES_REFILL, icon: '❤️', color: '#e74c3c' },
  { id: 'extra_moves', name: 'Extra Moves', desc: '+3 moves on fail', price: COST_EXTRA_MOVES, icon: '🔄', color: '#3498db' },
  { id: 'booster_rockets', name: 'Rocket Pack', desc: '3 rockets', price: COST_BOOSTER_PACK, icon: '🚀', color: '#e67e22' },
  { id: 'booster_bombs', name: 'Bomb Pack', desc: '3 bombs', price: COST_BOOSTER_PACK, icon: '💣', color: '#9b59b6' },
  { id: 'starter_pack', name: 'Starter Pack', desc: 'Lives + Boosters + Coins', price: COST_STARTER_PACK, icon: '🎁', color: '#2ecc71' },
  { id: 'premium', name: 'Premium', desc: 'Monthly: fast regen, +idle cap, +spins', price: COST_PREMIUM, icon: '👑', color: '#f1c40f' },
];

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

function selectItem(item: typeof shopItems[number]) {
  selectedItem.value = item;
  showConfirm.value = true;
}

async function confirmPurchase() {
  if (!selectedItem.value) return;
  // TODO: Trigger Telegram Stars payment flow
  // For now, simulate
  if (selectedItem.value.id === 'lives_refill') {
    playerStore.addLives(5);
  }
  showConfirm.value = false;
  selectedItem.value = null;
}
</script>

<template>
  <div class="shop">
    <header class="shop__header">
      <button class="shop__back" @click="goBack">←</button>
      <h2>Shop</h2>
      <div class="shop__balance">⭐ {{ economyStore.stars }}</div>
    </header>

    <div class="shop__grid">
      <button
        v-for="item in shopItems"
        :key="item.id"
        class="shop__card"
        @click="selectItem(item)"
      >
        <div class="shop__card-icon" :style="{ background: item.color }">
          {{ item.icon }}
        </div>
        <div class="shop__card-info">
          <span class="shop__card-name">{{ item.name }}</span>
          <span class="shop__card-desc">{{ item.desc }}</span>
        </div>
        <div class="shop__card-price">{{ item.price }} ⭐</div>
      </button>
    </div>

    <!-- Purchase Confirm Modal (using UI Kit BaseModal) -->
    <BaseModal v-if="showConfirm && selectedItem" @close="showConfirm = false" max-width="300px">
      <div class="shop__modal-content">
        <div class="shop__modal-icon" :style="{ background: selectedItem.color }">
          {{ selectedItem.icon }}
        </div>
        <h3>{{ selectedItem.name }}</h3>
        <p>{{ selectedItem.desc }}</p>
        <div class="shop__modal-price">{{ selectedItem.price }} ⭐</div>
        <div class="shop__modal-actions">
          <button class="shop__btn-cancel" @click="showConfirm = false">Cancel</button>
          <PrimaryCtaButton @click="confirmPurchase">Buy Now</PrimaryCtaButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.shop {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.shop__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #16213e;
}

.shop__back {
  background: none;
  border: none;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}

.shop__header h2 {
  flex: 1;
  font-size: 20px;
}

.shop__balance {
  font-weight: 700;
  font-size: 16px;
  color: #ffd700;
}

.shop__grid {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.shop__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  background: #22264a;
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: transform 0.1s;
}

.shop__card:active {
  transform: scale(0.98);
}

.shop__card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.shop__card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shop__card-name {
  font-weight: 700;
  font-size: 15px;
}

.shop__card-desc {
  font-size: 12px;
  opacity: 0.6;
}

.shop__card-price {
  font-weight: 700;
  font-size: 16px;
  color: #ffd700;
  white-space: nowrap;
}

.shop__modal-content {
  text-align: center;
}

.shop__modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 16px;
}

.shop__modal h3 {
  font-size: 20px;
  margin-bottom: 4px;
}

.shop__modal p {
  font-size: 14px;
  opacity: 0.6;
  margin-bottom: 16px;
}

.shop__modal-price {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
  margin-bottom: 20px;
}

.shop__modal-actions {
  display: flex;
  gap: 12px;
}

.shop__btn-cancel,
.shop__btn-buy {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}

.shop__btn-cancel {
  background: #333;
  color: #fff;
}

.shop__btn-buy {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a1a2e;
}
</style>

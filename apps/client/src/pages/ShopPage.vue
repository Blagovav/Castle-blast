<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useEconomyStore } from '@/stores/economy';
import { usePlayerStore } from '@/stores/player';
import { ScreenLayout, BaseModal, PrimaryCtaButton, PurchaseButton } from '@umbrella-software-corp/ui-kit';
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
  <ScreenLayout title="Shop" @back="goBack">
    <div class="shop__balance-bar">
      <span class="shop__balance-label">Balance</span>
      <div class="shop__balance">⭐ {{ economyStore.stars }}</div>
    </div>

    <div class="shop__grid">
      <div
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
        <PurchaseButton @click.stop="selectItem(item)">
          {{ item.price }} ⭐
        </PurchaseButton>
      </div>
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
  </ScreenLayout>
</template>

<style scoped>
.shop__balance-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  margin-bottom: 4px;
}

.shop__balance-label {
  font-size: 13px;
  opacity: 0.5;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.shop__balance {
  font-weight: 700;
  font-size: 16px;
  color: var(--color-gold, #FFD700);
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.shop__grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 4px;
}

.shop__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: var(--color-bg-card, #2B2A34);
  color: #fff;
  cursor: pointer;
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
  font-family: var(--font-family, "Unbounded"), sans-serif;
}

.shop__card-desc {
  font-size: 12px;
  opacity: 0.6;
}

.shop__modal-content {
  text-align: center;
  font-family: var(--font-family, "Unbounded"), sans-serif;
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

.shop__modal-content h3 {
  font-size: 20px;
  margin-bottom: 4px;
}

.shop__modal-content p {
  font-size: 14px;
  opacity: 0.6;
  margin-bottom: 16px;
}

.shop__modal-price {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-gold, #FFD700);
  margin-bottom: 20px;
}

.shop__modal-actions {
  display: flex;
  gap: 12px;
}

.shop__btn-cancel {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  background: var(--color-bg-card, #2B2A34);
  color: #fff;
  font-family: var(--font-family, "Unbounded"), sans-serif;
}
</style>

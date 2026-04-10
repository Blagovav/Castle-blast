import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ShopItem } from '@castle-blast/shared';
import { fetchShopItems, purchaseItem } from '../api/shop';

export const useEconomyStore = defineStore('economy', () => {
  const coins = ref(0);
  const stars = ref(0);
  const shopItems = ref<ShopItem[]>([]);

  async function fetchShop() {
    const res = await fetchShopItems();
    shopItems.value = res.items;
  }

  async function purchase(itemId: string) {
    const res = await purchaseItem(itemId);
    if (res.success) {
      coins.value = res.player.coins;
      stars.value = res.player.stars;
    }
    return res;
  }

  function setFromProfile(c: number, s: number) {
    coins.value = c;
    stars.value = s;
  }

  return {
    coins,
    stars,
    shopItems,
    fetchShop,
    purchase,
    setFromProfile,
  };
});

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Building, BuildingType, KingdomResponse } from '@castle-blast/shared';
import { OFFLINE_CAP_HOURS, OFFLINE_CAP_PREMIUM_HOURS } from '@castle-blast/shared';
import { get, post } from '../api/client';
import type { CollectIdleResponse } from '@castle-blast/shared';

export const useKingdomStore = defineStore('kingdom', () => {
  const buildings = ref<Building[]>([]);
  const pendingIncome = ref(0);

  const totalIdleRate = computed(() => {
    // Sum of income per hour across all buildings
    // Actual rate depends on building level and config (server-driven)
    // For now we estimate based on pendingIncome and time elapsed
    return buildings.value.reduce((sum, b) => {
      // Base rate placeholder: each building level contributes
      // Real config should come from server; this is a client-side approximation
      return sum + b.level;
    }, 0);
  });

  const offlineIncome = computed(() => {
    return pendingIncome.value;
  });

  async function fetchBuildings() {
    const res = await get<KingdomResponse>('/kingdom');
    buildings.value = res.buildings;
    pendingIncome.value = res.pendingIncome;
  }

  async function collectIdle() {
    const res = await post<CollectIdleResponse>('/kingdom/collect');
    pendingIncome.value = 0;
    return res;
  }

  async function upgradeBuilding(type: BuildingType) {
    const res = await post<KingdomResponse>(`/kingdom/upgrade`, { buildingType: type });
    buildings.value = res.buildings;
    pendingIncome.value = res.pendingIncome;
    return res;
  }

  return {
    buildings,
    pendingIncome,
    totalIdleRate,
    offlineIncome,
    fetchBuildings,
    collectIdle,
    upgradeBuilding,
  };
});

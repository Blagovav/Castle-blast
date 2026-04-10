import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PlayerProfile } from '@castle-blast/shared';
import { MAX_LIVES, LIFE_REGEN_MS, LIFE_REGEN_PREMIUM_MS } from '@castle-blast/shared';
import { fetchPlayerProfile } from '../api/player';

export const usePlayerStore = defineStore('player', () => {
  const profile = ref<PlayerProfile | null>(null);
  const lives = ref(0);
  const livesRegenAt = ref<number | null>(null);

  let regenTimer: ReturnType<typeof setInterval> | null = null;

  const canPlay = computed(() => lives.value > 0);

  const nextLifeIn = computed(() => {
    if (lives.value >= MAX_LIVES || !livesRegenAt.value) return null;
    const diff = livesRegenAt.value - Date.now();
    if (diff <= 0) return '00:00';
    const totalSec = Math.ceil(diff / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  async function fetchProfile() {
    const res = await fetchPlayerProfile();
    profile.value = res.player;
    lives.value = res.player.lives;
    recalcRegenTime();
    startLivesTimer();
  }

  function recalcRegenTime() {
    if (lives.value >= MAX_LIVES) {
      livesRegenAt.value = null;
      return;
    }
    const regenMs = profile.value?.isPremium ? LIFE_REGEN_PREMIUM_MS : LIFE_REGEN_MS;
    const lastUpdate = profile.value?.livesUpdatedAt
      ? new Date(profile.value.livesUpdatedAt).getTime()
      : Date.now();
    livesRegenAt.value = lastUpdate + regenMs;
  }

  function decrementLife() {
    if (lives.value <= 0) return;
    lives.value--;
    if (lives.value < MAX_LIVES && !livesRegenAt.value) {
      const regenMs = profile.value?.isPremium ? LIFE_REGEN_PREMIUM_MS : LIFE_REGEN_MS;
      livesRegenAt.value = Date.now() + regenMs;
    }
  }

  function addLives(count: number) {
    lives.value = Math.min(lives.value + count, MAX_LIVES);
    if (lives.value >= MAX_LIVES) {
      livesRegenAt.value = null;
    }
  }

  function startLivesTimer() {
    if (regenTimer) clearInterval(regenTimer);

    regenTimer = setInterval(() => {
      if (lives.value >= MAX_LIVES) {
        livesRegenAt.value = null;
        return;
      }

      if (livesRegenAt.value && Date.now() >= livesRegenAt.value) {
        lives.value = Math.min(lives.value + 1, MAX_LIVES);
        if (lives.value < MAX_LIVES) {
          const regenMs = profile.value?.isPremium ? LIFE_REGEN_PREMIUM_MS : LIFE_REGEN_MS;
          livesRegenAt.value = Date.now() + regenMs;
        } else {
          livesRegenAt.value = null;
        }
      }
    }, 1000);
  }

  function stopLivesTimer() {
    if (regenTimer) {
      clearInterval(regenTimer);
      regenTimer = null;
    }
  }

  return {
    profile,
    lives,
    livesRegenAt,
    canPlay,
    nextLifeIn,
    fetchProfile,
    decrementLife,
    addLives,
    startLivesTimer,
    stopLivesTimer,
  };
});

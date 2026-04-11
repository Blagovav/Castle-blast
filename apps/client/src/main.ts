import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { useAuthStore } from './stores/auth';
import { usePlayerStore } from './stores/player';
import { useEconomyStore } from './stores/economy';
import '@umbrella-software-corp/ui-kit/style.css';
import { vPress } from '@umbrella-software-corp/ui-kit';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.directive('press', vPress);

app.mount('#app');

// Tell Telegram the app is ready
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// Initialize auth and player data
async function init() {
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const economyStore = useEconomyStore();

  try {
    if (tg?.initData) {
      // Real Telegram environment
      const res = await authStore.authenticate();
      economyStore.setFromProfile(res.player.coins, res.player.stars);
      playerStore.lives = res.player.lives;
    } else {
      // Dev mode — use mock data
      authStore.setToken('dev-token');
      playerStore.lives = 5;
      economyStore.setFromProfile(1000, 10);
    }
  } catch (err) {
    console.error('Auth failed:', err);
    // Fallback for dev
    playerStore.lives = 5;
    economyStore.setFromProfile(1000, 10);
  }
}

init();

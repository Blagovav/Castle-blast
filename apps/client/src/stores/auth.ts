import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authenticateTelegram } from '../api/auth';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const telegramUser = ref<TelegramUser | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  function setToken(jwt: string) {
    token.value = jwt;
    localStorage.setItem('auth_token', jwt);
  }

  function clearToken() {
    token.value = null;
    telegramUser.value = null;
    localStorage.removeItem('auth_token');
  }

  async function authenticate() {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) {
      throw new Error('Telegram WebApp not available');
    }

    const initData = tg.initData;

    // Parse user info from Telegram WebApp
    if (tg.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      telegramUser.value = {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        username: u.username,
      };
    }

    const response = await authenticateTelegram(initData);
    setToken(response.token);

    return response;
  }

  return {
    token,
    telegramUser,
    isAuthenticated,
    authenticate,
    setToken,
    clearToken,
  };
});

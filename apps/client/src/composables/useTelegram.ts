import { computed } from 'vue';

export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  const initData = computed(() => tg?.initData ?? '');
  const user = computed(() => tg?.initDataUnsafe?.user ?? null);
  const colorScheme = computed(() => tg?.colorScheme ?? 'dark');
  const isAvailable = computed(() => !!tg);

  return { tg, initData, user, colorScheme, isAvailable };
}

import { computed } from 'vue';

export function useSafeArea() {
  const tg = window.Telegram?.WebApp;

  const contentInset = tg?.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const safeInset = tg?.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };

  const style = computed(() => ({
    paddingTop: `${contentInset.top + safeInset.top}px`,
    paddingBottom: `${contentInset.bottom + safeInset.bottom}px`,
    paddingLeft: `${contentInset.left + safeInset.left}px`,
    paddingRight: `${contentInset.right + safeInset.right}px`,
  }));

  return { style, contentInset, safeInset };
}

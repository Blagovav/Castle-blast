<script setup lang="ts">
import { onMounted } from 'vue';

function applySafeAreaVars() {
  const tg = window.Telegram?.WebApp;
  const content = tg?.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const safe = tg?.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };

  const root = document.documentElement;
  root.style.setProperty('--tma-safe-top', `${safe.top}px`);
  root.style.setProperty('--tma-content-safe-top', `${content.top}px`);
  root.style.setProperty('--tma-bottom-ui-safe-bottom', `${safe.bottom + content.bottom}px`);
}

onMounted(() => {
  applySafeAreaVars();
});
</script>

<template>
  <div class="app">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--font-family, "Unbounded"), sans-serif;
  background: var(--color-bg-darkest, #13121D);
  color: #fff;
}

.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: var(--tma-content-safe-top, 0px);
}
</style>

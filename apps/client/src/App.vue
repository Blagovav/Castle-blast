<script setup lang="ts">
import { useSafeArea } from '@/composables/useSafeArea';

const { style } = useSafeArea();
</script>

<template>
  <div class="app" :style="style">
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #fff;
}

.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

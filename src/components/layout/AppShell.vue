<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
</script>

<template>
  <div class="min-h-screen text-white">
    <AppHeader />
    <main class="page-surface">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

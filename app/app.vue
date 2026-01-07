<script setup lang="ts">
// import type { NavigationMenuItem } from '@nuxt/ui';

// const HeaderItems: NavigationMenuItem[] = [
//   { label: '演示', to: '/' },
// ];
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        Logic Bingo
      </template>

      <!-- UNavigationMenu :items="HeaderItems" / -->

      <template #right>
        <UColorModeButton />
        <UTooltip text="Open on GitHub">
          <UButton
            color="neutral"
            variant="ghost"
            to="https://github.com/typed-sigterm/logic-bingo"
            target="_blank"
            icon="i-simple-icons-github"
            aria-label="GitHub"
          />
        </UTooltip>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>

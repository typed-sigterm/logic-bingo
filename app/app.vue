<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const HeaderItems: NavigationMenuItem[] = [
  { label: '求解', icon: 'lucide:play', to: '/solve' },
  { label: '验证', icon: 'lucide:grid-2x2-check', to: '/verify' },
];
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        Logic Bingo
      </template>

      <UNavigationMenu :items="HeaderItems" />

      <template #right>
        <UColorModeButton />
        <UTooltip text="Open on GitHub">
          <UButton
            color="neutral"
            variant="ghost"
            to="https://github.com/typed-sigterm/logic-bingo"
            target="_blank"
            icon="simple-icons:github"
            aria-label="GitHub"
          />
        </UTooltip>
      </template>

      <template #body>
        <UNavigationMenu :items="HeaderItems" orientation="vertical" class="-mx-2.5 text-center" />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>

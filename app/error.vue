<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{
  error: NuxtError
}>();
</script>

<template>
  <UApp>
    <UHeader />
    <UError :error />
    <UFooter />
  </UApp>
</template>

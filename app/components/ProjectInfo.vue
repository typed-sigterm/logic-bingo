<script setup lang="ts">
import type { Project } from '~/utils/game';

defineProps<{
  project: Project
}>();

const emit = defineEmits<{
  reset: []
}>();
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold">
            问题描述
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ project.width }}×{{ project.height }} 网格约束
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-path"
          @click="emit('reset')"
        >
          重新选择
        </UButton>
      </div>
    </template>

    <div class="overflow-x-auto">
      <div
        class="grid gap-3"
        :style="{ gridTemplateColumns: `repeat(${project.width}, minmax(120px, 1fr))` }"
      >
        <template v-for="(row, r) in project.labels" :key="r">
          <div
            v-for="(desc, c) in row"
            :key="`${r}-${c}`"
            class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-center min-h-28 hover:border-primary-400 dark:hover:border-primary-600 transition-colors text-sm"
          >
            {{ desc }}
          </div>
        </template>
      </div>
    </div>
  </UCard>
</template>

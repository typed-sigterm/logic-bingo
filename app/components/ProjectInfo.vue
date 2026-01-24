<script setup lang="ts">
const { project, interactive = false } = defineProps<{
  project: Project
  interactive?: boolean
}>();

const emit = defineEmits<{
  reset: []
  toggle: [row: number, col: number]
}>();

const grid = defineModel<boolean[][]>({ required: false });

function toggleCell(row: number, col: number) {
  if (!interactive || !grid.value)
    return;
  const newGrid = grid.value.map(r => [...r]);
  newGrid[row]![col] = !newGrid[row]![col];
  grid.value = newGrid;
  emit('toggle', row, col);
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold">
            {{ interactive ? '你的答案' : '问题描述' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ project.width }}×{{ project.height }} 网格约束
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="lucide:refresh-cw"
          @click="emit('reset')"
        >
          {{ interactive ? '清空' : '重新选择' }}
        </UButton>
      </div>
    </template>

    <div class="overflow-x-auto">
      <div
        class="grid gap-3"
        :style="{ gridTemplateColumns: `repeat(${project.width}, minmax(${interactive ? '80px' : '120px'}, 1fr))` }"
      >
        <template v-for="(row, r) in project.labels" :key="r">
          <div
            v-for="(desc, c) in row"
            :key="`${r}-${c}`"
            class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-900 flex items-center justify-center text-center min-h-28 transition-colors text-sm"
            :class="[
              interactive
                ? 'cursor-pointer hover:border-primary-400 dark:hover:border-primary-600'
                : 'hover:border-primary-400 dark:hover:border-primary-600',
              grid && interactive && grid[r]?.[c]
                ? 'bg-primary-400 dark:bg-primary-400 text-white dark:text-white'
                : '',
            ]"
            @click="toggleCell(r, c)"
            v-text="desc"
          />
        </template>
      </div>
    </div>
  </UCard>
</template>

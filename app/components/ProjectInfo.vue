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

function handleClearGrid() {
  grid.value = Array.from(
    { length: project.height },
    () => Array.from({ length: project.width }, () => false),
  );
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-bold">
            {{ interactive ? '点击格子，完成作答' : '问题描述' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            选中至少一行、列或对角线上的所有格子，并满足 {{ project.width }}×{{ project.height }} 网格约束
          </p>
        </div>

        <div class="flex gap-2 shrink-0">
          <UButton
            v-if="interactive"
            color="neutral"
            variant="ghost"
            icon="lucide:trash-2"
            @click="handleClearGrid"
          >
            清空
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            icon="lucide:refresh-cw"
            @click="emit('reset')"
          >
            重新选择
          </UButton>
        </div>
      </div>
    </template>

    <div class="overflow-x-auto">
      <div
        class="grid gap-3"
        :style="{ gridTemplateColumns: `repeat(${project.width}, minmax(7rem, 1fr))` }"
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
              grid && interactive && grid[r]![c]
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

<script setup lang="ts">
const props = defineProps<{
  width: number
  height: number
}>();

const grid = defineModel<boolean[][]>({ required: true });

function toggleCell(row: number, col: number) {
  const newGrid = grid.value.map(r => [...r]);
  newGrid[row]![col] = !newGrid[row]![col];
  grid.value = newGrid;
}

function checkBingo(): { hasBingo: boolean, type?: string, index?: number } {
  // Check rows
  for (let i = 0; i < props.height; i++) {
    if (grid.value[i]?.every(cell => cell))
      return { hasBingo: true, type: 'row', index: i };
  }

  // Check columns
  for (let j = 0; j < props.width; j++) {
    let allTrue = true;
    for (let i = 0; i < props.height; i++) {
      if (!grid.value[i]?.[j]) {
        allTrue = false;
        break;
      }
    }
    if (allTrue)
      return { hasBingo: true, type: 'col', index: j };
  }

  // Check diagonals (if square)
  if (props.width === props.height) {
    let mainDiagAllTrue = true;
    let antiDiagAllTrue = true;

    for (let i = 0; i < props.width; i++) {
      if (!grid.value[i]?.[i])
        mainDiagAllTrue = false;
      if (!grid.value[i]?.[props.width - 1 - i])
        antiDiagAllTrue = false;
    }

    if (mainDiagAllTrue)
      return { hasBingo: true, type: 'main-diag' };
    if (antiDiagAllTrue)
      return { hasBingo: true, type: 'anti-diag' };
  }

  return { hasBingo: false };
}

const bingoStatus = computed(() => checkBingo());

function isCellHighlighted(row: number, col: number): boolean {
  if (!bingoStatus.value.hasBingo)
    return false;

  const { type, index } = bingoStatus.value;

  if (type === 'row' && index === row)
    return true;
  if (type === 'col' && index === col)
    return true;
  if (type === 'main-diag' && row === col)
    return true;
  if (type === 'anti-diag' && row === props.width - 1 - col)
    return true;

  return false;
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div
      class="grid gap-1 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg"
      :style="{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }"
    >
      <template v-for="(row, r) in grid" :key="r">
        <button
          v-for="(cell, c) in row"
          :key="`${r}-${c}`"
          class="w-12 h-12 flex items-center justify-center transition-all rounded cursor-pointer hover:scale-105"
          :class="[
            cell
              ? isCellHighlighted(r, c)
                ? 'bg-green-500 dark:bg-green-400 shadow-lg'
                : 'bg-primary-500 dark:bg-primary-400'
              : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600',
          ]"
          @click="toggleCell(r, c)"
        />
      </template>
    </div>
  </div>
</template>

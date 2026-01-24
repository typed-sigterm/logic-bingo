<script setup lang="ts">
import type { Bool, Context, Solver } from 'z3-solver';
import { refManualReset } from '@vueuse/core';

if (import.meta.hot)
  import.meta.hot.accept();

const toast = useToast();
const { data: z3, status: z3Status, error: z3Error } = useZ3();
const { project, resetProject } = useProject();

watch(z3Error, (x) => {
  console.error(x);
  showErrorToast(toast, '求解模块加载失败，请检查网络连接', x);
});

const solutions = refManualReset<boolean[][][]>([]);
const status = refManualReset<'idle' | 'init-solving' | 'append-solving' | 'has-solution' | 'no-solution'>('idle');
const error = refManualReset<string | undefined>(undefined);
const timeUsed = refManualReset<number>(0);
const displayIndex = refManualReset<number>(0);
const allSolutionsFetched = refManualReset<boolean>(false);
let solver: Solver | undefined;
let ctx: Context | undefined;
let board: Bool[][] = [];
let solveStartTime = 0;

watch(project, () => {
  try {
    board = [];
    if (ctx)
      z3.value?.Z3.del_context(ctx.ptr);
    solver = ctx = undefined;
  } catch (err) {
    console.warn('Error cleaning up Z3 context:', err);
    ctx = undefined;
  }

  solutions.reset();
  displayIndex.reset();
  status.reset();
  error.reset();
  allSolutionsFetched.reset();
});

async function initSolver() {
  if (!z3.value || z3Status.value !== 'success' || !project.value)
    return false;

  try {
    const { Context } = z3.value;
    ctx = Context('main');
    const { Solver, Bool } = ctx;

    solver = new Solver();
    board = [];

    for (let i = 0; i < project.value.height; i++) {
      const rowArr = [];
      for (let j = 0; j < project.value.width; j++)
        rowArr.push(Bool.const(`@${i}_${j}`));
      board.push(rowArr);
    }

    solver.fromString(project.value.smtlib);
    solver.add(getBingoConstraint(ctx, project.value.width, project.value.height, board));
    return true;
  } catch (err) {
    console.error(err);
    showErrorToast(toast, '初始化失败', err);
    return false;
  }
}

async function fetchNextSolution() {
  if (!solver || !ctx || !board || !project.value)
    return false;

  try {
    const { Or, Not } = ctx;
    const checkResult = await solver.check();

    if (checkResult === 'sat') {
      const model = solver.model();
      const grid: boolean[][] = [];
      const block: Bool[] = [];

      for (let i = 0; i < project.value!.height; i++) {
        const rowRes: boolean[] = [];
        for (let j = 0; j < project.value!.width; j++) {
          const cellVal = model.eval(board[i]![j]!).toString() === 'true';
          rowRes.push(cellVal);
          block.push(cellVal ? Not(board[i]![j]!) : board[i]![j]!);
        }
        grid.push(rowRes);
      }
      solutions.value.push(grid);
      solver.add(Or(...block));
      return true;
    } else {
      allSolutionsFetched.value = true;
      return false;
    }
  } catch (err) {
    console.error(err);
    showErrorToast(toast, '求解失败', err);
    return false;
  }
}

async function runSolver() {
  if (!z3.value || z3Status.value !== 'success' || !project.value)
    return;

  status.value = 'init-solving';
  solutions.value = [];
  displayIndex.value = 0;
  error.value = undefined;
  allSolutionsFetched.value = false;
  solveStartTime = performance.now();
  if (!await initSolver())
    return;

  // 确保 `allSolutionsFetched` 初始值正确
  await fetchNextSolution();
  await fetchNextSolution();

  displayIndex.value = Math.max(0, solutions.value.length - 2);
  timeUsed.value = Math.round(performance.now() - solveStartTime) / 1000;
  status.value = solutions.value.length > 0 ? 'has-solution' : 'no-solution';
}

async function handleNextClick() {
  if (status.value === 'init-solving' || status.value === 'append-solving' || !solver)
    return;

  if (displayIndex.value < solutions.value.length - 1) {
    displayIndex.value += 1;
    return;
  }

  if ((status.value === 'has-solution' || status.value === 'no-solution') && !allSolutionsFetched.value && solutions.value.length >= 1) {
    status.value = 'append-solving';
    try {
      const hasSolution = await fetchNextSolution();
      timeUsed.value = Math.round(performance.now() - solveStartTime) / 1000;

      if (hasSolution) {
        displayIndex.value += 1;
      } else {
        status.value = 'has-solution';
      }
    } catch (err) {
      console.error(err);
      showErrorToast(toast, '求解失败', err);
    }
  }
}
</script>

<template>
  <UContainer class="py-8">
    <ProjectUploader v-if="!project" />

    <template v-else>
      <ProjectInfo :project @reset="resetProject" />

      <div class="flex flex-col items-center justify-center gap-4 mt-8">
        <UButton
          v-if="status === 'idle' || status === 'init-solving'"
          :loading="status === 'init-solving'"
          :disabled="z3Status !== 'success' || !project"
          color="primary"
          size="xl"
          icon="lucide:play"
          @click="runSolver"
        >
          开始求解
        </UButton>
        <UFieldGroup v-else>
          <UButton
            v-if="displayIndex > 0"
            color="neutral"
            variant="outline"
            leading-icon="lucide:chevron-left"
            @click="displayIndex = Math.max(0, displayIndex - 1)"
          >
            上一个
          </UButton>
          <UButton
            v-if="displayIndex < solutions.length - 1 || ((status === 'has-solution' || status === 'no-solution') && !allSolutionsFetched && solutions.length >= 1)"
            :loading="status === 'append-solving'"
            color="primary"
            trailing-icon="lucide:chevron-right"
            @click="handleNextClick"
          >
            {{ status === 'append-solving' ? '求解中...' : '下一个' }}
          </UButton>
        </UFieldGroup>
      </div>

      <UEmpty
        v-if="status === 'no-solution'"
        class="w-100 mx-auto"
        title="当前约束条件下没有找到解"
        icon="lucide:ghost"
        size="xl"
      />

      <div v-if="status === 'has-solution' && solutions.length > 0" class="space-y-6">
        <div class="space-y-4 flex flex-col items-center">
          <UCard :ui="{ header: 'font-semibold' }" class="w-full lg:w-auto lg:max-w-fit">
            <template #header>
              {{ solutions.length === 1 ? '唯一的解' : `解 #${displayIndex + 1}` }}
            </template>
            <div class="flex justify-center">
              <div
                class="grid gap-0.5 bg-gray-200 dark:bg-gray-800 p-0.5 rounded"
                :style="{ gridTemplateColumns: `repeat(${project?.width || 5}, minmax(0, 1fr))` }"
              >
                <template v-for="(row, r) in solutions[displayIndex]" :key="r">
                  <div
                    v-for="(cell, c) in row"
                    :key="`${r}-${c}`"
                    class="w-10 h-10 flex items-center justify-center transition-all"
                    :class="[
                      cell
                        ? 'bg-primary-500 dark:bg-primary-400'
                        : 'bg-white dark:bg-gray-800',
                    ]"
                  />
                </template>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UContainer>
</template>

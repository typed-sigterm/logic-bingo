<script setup lang="ts">
import type { Bool } from 'z3-solver';
import type { Project } from '~/utils/game';

const toast = useToast();
const { z3, status, error: e } = useZ3();
watch(e, (x) => {
  console.error('Z3 Load Error:', x);
  toast.add({
    title: '求解模块加载失败，请检查网络连接',
    icon: 'lucide:circle-x',
    color: 'error',
    duration: 5000,
  });
});

const solutions = ref<boolean[][][]>([]);
const solving = ref(false);
const finished = ref(false);
const error = ref<string>();
const project = ref<Project>();
const uploadedFile = ref<File>();
const timeUsed = ref<number>(0);

watch(uploadedFile, async (file) => {
  if (!file)
    return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadedProject = await deserializeProject(arrayBuffer);
    project.value = loadedProject;
    solutions.value = [];
    finished.value = false;
    error.value = undefined;
  } catch (err) {
    console.error('Failed to load project:', err);
    error.value = `文件加载失败：${String(err)}`;
    toast.add({
      title: '文件加载失败',
      description: String(err),
      icon: 'lucide:circle-x',
      color: 'error',
      duration: 5000,
    });
  }
});

async function runSolver() {
  if (!z3.value || status.value !== 'success')
    return;

  if (!project.value) {
    toast.add({
      title: '请先选择文件',
      icon: 'lucide:circle-x',
      color: 'error',
      duration: 3000,
    });
    return;
  }

  solving.value = true;
  solutions.value = [];
  finished.value = false;
  error.value = undefined;
  const startTime = performance.now();

  try {
    const { Context } = z3.value;
    const ctx = Context('main');
    const { Solver, Bool, Or, Not } = ctx;

    const solver = new Solver();
    const board: Bool[][] = [];

    for (let i = 0; i < project.value.height; i++) {
      const rowArr = [];
      for (let j = 0; j < project.value.width; j++)
        rowArr.push(Bool.const(`@${i}_${j}`));
      board.push(rowArr);
    }

    solver.fromString(project.value.smtlib);
    solver.add(getBingoConstraint(ctx, project.value.width, project.value.height, board));

    let safety = 20;
    while ((await solver.check()) === 'sat' && safety-- > 0) {
      const model = solver.model();
      const grid: boolean[][] = [];
      const block: any[] = [];

      for (let i = 0; i < project.value.height; i++) {
        const rowRes: boolean[] = [];
        for (let j = 0; j < project.value.width; j++) {
          const cellVal = model.eval(board[i]![j]!).toString() === 'true';
          rowRes.push(cellVal);
          block.push(cellVal ? Not(board[i]![j]!) : board[i]![j]!);
        }
        grid.push(rowRes);
      }
      solutions.value.push(grid);
      solver.add(Or(...block));
    }
    timeUsed.value = Math.round(performance.now() - startTime) / 1000;
  } catch (e) {
    console.error(e);
    error.value = String(e);
    solving.value = false;
  } finally {
    solving.value = false;
    finished.value = true;
  }
}
</script>

<template>
  <UContainer class="py-8">
    <UFileUpload
      v-if="!project"
      v-model="uploadedFile"
      class="max-w-2xl mx-auto min-h-64"
      accept=".lbc"
      label="选择或拖拽文件到此处"
      description="支持 .lbc 格式文件"
      size="xl"
    />

    <div v-else class="space-y-8">
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
              @click="uploadedFile = project = undefined; solutions = []; finished = false;"
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

      <div class="flex items-center justify-center gap-4">
        <UButton
          :loading="solving"
          :disabled="status !== 'success' || !project"
          color="primary"
          size="xl"
          icon="lucide:play"
          @click="runSolver"
        >
          开始求解
        </UButton>
      </div>

      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        title="错误"
        :description="error"
        color="error"
        variant="soft"
      />

      <UEmpty
        v-if="finished && solutions.length === 0"
        class="w-100 mx-auto"
        title="当前约束条件下没有找到解"
        icon="lucide:ghost"
        size="xl"
      />

      <div v-if="solutions.length > 0">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-bold">
            在 {{ timeUsed }}s 内找到 {{ solutions.length }} 个解
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <UCard v-for="(item, i) in solutions" :key="i">
            <template #header>
              <span>Solution #{{ i + 1 }}</span>
            </template>
            <div class="flex justify-center">
              <div
                class="grid gap-0.5 bg-gray-200 dark:bg-gray-800 p-0.5 rounded"
                :style="{ gridTemplateColumns: `repeat(${project?.width || 5}, minmax(0, 1fr))` }"
              >
                <template v-for="(row, r) in item" :key="r">
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
    </div>
  </UContainer>
</template>

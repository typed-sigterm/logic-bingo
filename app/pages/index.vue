<script setup lang="ts">
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
const error = ref<string | null>(null);

const problemDescriptions = [
  [
    '这个格子应该打勾',
    '整张表打勾的格子数 <= 12',
    '第 2 列打勾格子数量小于第 3 列',
    '这一格所在行打勾格子数量小于所在列',
    '答案中 5 个连成一线的格子是一整列',
  ],
  [
    '这个格子周围 5 格中打勾的格子个数是奇数',
    '整张表打勾的格子个数 >= 13',
    '不存在周围格子均未被打勾的格子',
    '表格四个角上的格子恰有 2 个打勾',
    '答案中 5 个连成一线的格子是一整行',
  ],
  [
    '中心格被打勾',
    '左上角的九宫格有>=5 个格子打勾',
    '不存在上下相邻且均被打勾的两个格子',
    '不存在上下左右均勾但自身不勾的格子',
    '答案中 5 个连成一线的格子是斜对角线',
  ],
  [
    '存在某个格子周围打勾格子数量>=7',
    '这一格所在行打勾格子数量小于所在列',
    '存在 4 个格子均被打勾的 2×2 正方形',
    '这个格子周围 8 格中打勾的格子数量是偶数',
    '请先将这个格子打勾',
  ],
  [
    '第 5 列打勾格子数量小于 3',
    '第 2 列打勾格子数量大于 3',
    '第 1 列打勾格子数量大于 3',
    '第 3 列打勾格子数量在所有列中最小',
    '存在一整行或一整列没有打勾的格子',
  ],
];
async function runSolver() {
  if (!z3.value || status.value !== 'success')
    return;
  solving.value = true;
  solutions.value = [];
  finished.value = false;
  error.value = null;

  try {
    // Yield to allow UI update
    await new Promise(r => setTimeout(r, 50));

    const { Context } = z3.value;
    const ctx = Context('main');
    const { Solver, Bool, Int, And, Or, Not, If } = ctx;

    // Helpers similar to loops and I() in python
    const I = (b: any) => If(b, Int.val(1), Int.val(0));
    const Sum = (arr: any[]) => arr.reduce((acc, curr) => acc.add(curr), Int.val(0));

    const solver = new Solver();
    const board: any[][] = [];

    // Initialize 5x5 board variables
    for (let i = 0; i < 5; i++) {
      const rowArr = [];
      for (let j = 0; j < 5; j++) {
        rowArr.push(Bool.const(`cell_${i}_${j}`));
      }
      board.push(rowArr);
    }

    const row = (r: number) => board[r];
    const col = (c: number) => board.map(r => r[c]);
    const row_sum = (r: number) => Sum(row(r).map(I));
    const col_sum = (c: number) => Sum(col(c).map(I));

    // --- Constraints Definition (Direct translation) ---
    const constraints: any[][] = [];

    // Row 0
    constraints[0] = [
      board[0][0],
      Sum(board.flat().map(I)).le(12),
      col_sum(1).lt(col_sum(2)),
      row_sum(0).lt(col_sum(3)),
      Or(...[0, 1, 2, 3, 4].map(j => And(...col(j)))),
    ];

    // Row 1
    constraints[1] = [
      Sum([board[0][0], board[0][1], board[1][1], board[2][0], board[2][1]].map(I)).mod(2).eq(1),
      Sum(board.flat().map(I)).ge(13),
      // Not exists cell with all neighbors empty => All cells have at least one neighbor ticked
      And(...board.flat().map((_, idx) => {
        const r = Math.floor(idx / 5);
        const c = idx % 5;
        const n = [];
        for (const di of [-1, 0, 1]) {
          for (const dj of [-1, 0, 1]) {
            if (di === 0 && dj === 0)
              continue;
            if (r + di >= 0 && r + di < 5 && c + dj >= 0 && c + dj < 5)
              n.push(board[r + di][c + dj]);
          }
        }
        return Or(...n);
      })),
      Sum([board[0][0], board[0][4], board[4][0], board[4][4]].map(I)).eq(2),
      Or(...[0, 1, 2, 3, 4].map(i => And(...row(i)))),
    ];

    // Row 2
    constraints[2] = [
      board[2][2],
      Sum([0, 1, 2].flatMap(i => [0, 1, 2].map(j => board[i][j])).map(I)).ge(5),
      And(...[0, 1, 2, 3].flatMap(i => [0, 1, 2, 3, 4].map(j => Or(Not(board[i][j]), Not(board[i + 1][j]))))),
      And(...board.flat().map((_, idx) => {
        const r = Math.floor(idx / 5);
        const c = idx % 5;
        const terms = [board[r][c]]; // self
        terms.push(r - 1 >= 0 ? Not(board[r - 1][c]) : Bool.val(true));
        terms.push(r + 1 < 5 ? Not(board[r + 1][c]) : Bool.val(true));
        terms.push(c - 1 >= 0 ? Not(board[r][c - 1]) : Bool.val(true));
        terms.push(c + 1 < 5 ? Not(board[r][c + 1]) : Bool.val(true));
        return Or(...terms);
      })),
      Or(And(...[0, 1, 2, 3, 4].map(i => board[i][i])), And(...[0, 1, 2, 3, 4].map(i => board[i][4 - i]))),
    ];

    // Row 3
    constraints[3] = [
      Or(...board.flat().map((_, idx) => {
        const r = Math.floor(idx / 5);
        const c = idx % 5;
        const n = [];
        for (const di of [-1, 0, 1]) {
          for (const dj of [-1, 0, 1]) {
            if (r + di >= 0 && r + di < 5 && c + dj >= 0 && c + dj < 5)
              n.push(board[r + di][c + dj]);
          }
        }
        return Sum(n.map(I)).ge(7);
      })),
      row_sum(3).lt(col_sum(1)),
      Or(...[0, 1, 2, 3].flatMap(i => [0, 1, 2, 3].map(j => And(board[i][j], board[i + 1][j], board[i][j + 1], board[i + 1][j + 1])))),
      Sum((() => {
        const n = [];
        const r = 3, c = 1;
        for (const di of [-1, 0, 1]) {
          for (const dj of [-1, 0, 1]) {
            if (di === 0 && dj === 0)
              continue;
            if (r + di >= 0 && r + di < 5 && c + dj >= 0 && c + dj < 5)
              n.push(board[r + di][c + dj]);
          }
        }
        return n;
      })().map(I)).mod(2).eq(0),
      board[3][1],
    ];

    // Row 4
    constraints[4] = [
      col_sum(4).lt(3),
      col_sum(1).gt(3),
      col_sum(0).gt(3),
      And(...[0, 1, 3, 4].map(j => col_sum(2).le(col_sum(j)))),
      Or(
        Or(...[0, 1, 2, 3, 4].map(i => And(...row(i).map(c => Not(c))))),
        Or(...[0, 1, 2, 3, 4].map(j => And(...col(j).map(c => Not(c))))),
      ),
    ];

    // Apply constraints
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        solver.add(board[i][j].eq(constraints[i][j]));
      }
    }

    // Global Bingo
    solver.add(Or(
      ...[0, 1, 2, 3, 4].map(i => And(...row(i))),
      ...[0, 1, 2, 3, 4].map(j => And(...col(j))),
      And(...[0, 1, 2, 3, 4].map(i => board[i][i])),
      And(...[0, 1, 2, 3, 4].map(i => board[i][4 - i])),
    ));

    // Solve loop
    let safety = 20;
    while ((await solver.check()) === 'sat' && safety-- > 0) {
      const model = solver.model();
      const grid: boolean[][] = [];
      const block: any[] = [];

      for (let i = 0; i < 5; i++) {
        const rowRes: boolean[] = [];
        for (let j = 0; j < 5; j++) {
          const cellVal = model.eval(board[i][j]).toString() === 'true';
          rowRes.push(cellVal);
          block.push(cellVal ? Not(board[i][j]) : board[i][j]);
        }
        grid.push(rowRes);
      }
      solutions.value.push(grid);
      solver.add(Or(...block));
    }
  } catch (e: any) {
    console.error(e);
    error.value = e.message || String(e);
    solving.value = false;
  } finally {
    solving.value = false;
    finished.value = true;
  }
}
</script>

<template>
  <UContainer class="py-12">
    <UCard class="mb-8">
      <template #header>
        <h3 class="font-bold">
          Original Problem Board
        </h3>
        <p class="text-sm text-gray-500">
          5x5 Logic Bingo Constraints
        </p>
      </template>
      <div class="overflow-x-auto">
        <div class="grid grid-cols-5 gap-2 font-mono text-sm min-w-130">
          <template v-for="(row, r) in problemDescriptions" :key="r">
            <div
              v-for="(desc, c) in row"
              :key="`${r}-${c}`"
              class="p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-center h-24 max-w-24 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {{ desc }}
            </div>
          </template>
        </div>
      </div>
    </UCard>

    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold font-mono">
            Logic Bingo Demo
          </h1>
          <UBadge
            :color="status === 'error' ? 'error' : 'primary'"
            variant="subtle"
            size="md"
          >
            {{ status === 'success' ? 'Ready' : status }}
          </UBadge>
        </div>
      </template>

      <div class="flex gap-4 items-center">
        <UButton
          :loading="solving"
          :disabled="status !== 'success'"
          color="primary"
          size="lg"
          icon="i-heroicons-play-20-solid"
          @click="runSolver"
        >
          Find Solutions
        </UButton>
        <span v-if="solving" class="text-sm text-gray-500 animate-pulse">Calculating specific logic constraints...</span>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      icon="i-heroicons-exclamation-triangle"
      title="Optimization Failed"
      :description="error"
      color="error"
      variant="soft"
      class="mb-6"
    />

    <transition name="fade">
      <div v-if="finished && solutions.length === 0" class="flex flex-col items-center justify-center p-12 text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <UIcon name="i-heroicons-face-frown" class="w-12 h-12 mb-2" />
        <p>No solutions found for the current constraints.</p>
      </div>
    </transition>

    <div v-if="solutions.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="(sol, idx) in solutions"
        :key="idx"
        class="border-2 border-transparent hover:border-primary-500 transition-colors duration-300"
      >
        <template #header>
          <div class="flex justify-between items-center text-sm font-medium text-gray-500">
            <span>Solution #{{ idx + 1 }}</span>
            <UBadge color="neutral" variant="outline">
              {{ idx + 1 }}/{{ solutions.length }}
            </UBadge>
          </div>
        </template>

        <div class="flex justify-center py-2">
          <div class="grid grid-cols-5 gap-0.5 bg-gray-300 p-0.5 rounded shadow-sm">
            <template v-for="(row, r) in sol" :key="r">
              <div
                v-for="(cell, c) in row"
                :key="`${r}-${c}`"
                class="w-10 h-10 flex items-center justify-center text-sm font-bold transition-all duration-500"
                :class="[
                  cell
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 scale-100'
                    : 'bg-white text-gray-300 dark:bg-gray-800 dark:text-gray-700',
                ]"
              >
                <div v-if="cell" class="w-2 h-2 rounded-full bg-current" />
              </div>
            </template>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

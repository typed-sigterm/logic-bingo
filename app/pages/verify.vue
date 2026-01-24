<script setup lang="ts">
import type { Bool, Context, Solver } from 'z3-solver';
import { refManualReset } from '@vueuse/core';
import confetti from 'canvas-confetti';

const toast = useToast();
const { data: z3, status: z3Status, error: z3Error } = useZ3();
const { project, resetProject } = useProject();

watch(z3Error, (x) => {
  console.error(x);
  showErrorToast(toast, '求解模块加载失败，请检查网络连接', x);
});

const userGrid = refManualReset<boolean[][]>([]);
let ctx: Context | undefined;
let solver: Solver | undefined;

watch(project, () => {
  try {
    if (ctx)
      z3.value?.Z3.del_context(ctx.ptr);
    solver = ctx = undefined;
  } catch (err) {
    console.warn('Error cleaning up Z3 context:', err);
    ctx = undefined;
  }

  if (project.value) {
    userGrid.value = Array.from(
      { length: project.value.height },
      () => Array.from({ length: project.value!.width }, () => false),
    );
  }
});

function checkBingo(): boolean {
  if (!project.value)
    return false;

  // 行
  for (let i = 0; i < project.value.height; i++) {
    if (userGrid.value[i]?.every(cell => cell))
      return true;
  }

  // 列
  for (let j = 0; j < project.value.width; j++) {
    let allTrue = true;
    for (let i = 0; i < project.value.height; i++) {
      if (!userGrid.value[i]?.[j]) {
        allTrue = false;
        break;
      }
    }
    if (allTrue)
      return true;
  }

  // 对角线
  if (project.value.width === project.value.height) {
    let mainDiagAllTrue = true;
    let antiDiagAllTrue = true;

    for (let i = 0; i < project.value.width; i++) {
      if (!userGrid.value[i]?.[i])
        mainDiagAllTrue = false;
      if (!userGrid.value[i]?.[project.value.width - 1 - i])
        antiDiagAllTrue = false;
    }

    if (mainDiagAllTrue || antiDiagAllTrue)
      return true;
  }

  return false;
}

async function initSolver() {
  if (!z3.value || z3Status.value !== 'success' || !project.value)
    return false;

  try {
    const { Context } = z3.value;
    ctx = Context('main');
    const { Solver, Bool } = ctx;

    solver = new Solver();
    const board: Bool[][] = [];

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
    showErrorToast(toast, '验证失败', err);
    return false;
  }
}

async function performVerification() {
  if (!solver || !ctx || !project.value)
    return false;

  try {
    const board: Bool[][] = [];
    for (let i = 0; i < project.value.height; i++) {
      const rowArr = [];
      for (let j = 0; j < project.value.width; j++)
        rowArr.push(ctx!.Bool.const(`@${i}_${j}`));
      board.push(rowArr);
    }

    for (let i = 0; i < project.value.height; i++) {
      for (let j = 0; j < project.value.width; j++) {
        if (userGrid.value[i]?.[j])
          solver.add(board[i]![j]!);
        else
          solver.add(ctx!.Not(board[i]![j]!));
      }
    }

    return await solver.check() === 'sat';
  } catch (err) {
    console.error(err);
    showErrorToast(toast, '验证失败', err);
    return false;
  }
}

async function verifyAnswer() {
  if (!z3.value || z3Status.value !== 'success' || !project.value)
    return;

  try {
    if (!checkBingo()) {
      showErrorToast(toast, '未达成连线', '请先标记一条完整的行、列或对角线');
      return;
    }

    if (!await initSolver())
      return;

    if (await performVerification()) {
      toast.add({
        title: '验证通过',
        description: '你的答案成功连线，同时满足了所有约束！',
        icon: 'lucide:check-circle',
        color: 'success',
        duration: 5000,
      });
      confetti();
    } else {
      showErrorToast(toast, '验证失败', '答案不满足约束条件');
    }
  } catch (err) {
    console.error(err);
    showErrorToast(toast, '发生错误', err);
  }
}
</script>

<template>
  <UContainer class="py-8">
    <ProjectUploader v-if="!project" />

    <div v-else class="space-y-8">
      <ProjectInfo
        v-model="userGrid"
        :project
        interactive
        @reset="resetProject"
      />

      <div class="flex flex-col items-center gap-6">
        <UButton
          :disabled="z3Status !== 'success' || !project"
          color="primary"
          size="xl"
          icon="lucide:grid-2x2-check"
          @click="verifyAnswer"
        >
          验证答案
        </UButton>
      </div>
    </div>
  </UContainer>
</template>

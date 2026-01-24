<script setup lang="ts">
import type { Bool, Context, Solver } from 'z3-solver';
import { refManualReset } from '@vueuse/core';

const toast = useToast();
const { data: z3, status: z3Status, error: z3Error } = useZ3();
const { project, resetProject } = useProject();

watch(z3Error, (x) => {
  console.error(x);
  showErrorToast(toast, '求解模块加载失败，请检查网络连接', x);
});

const userGrid = refManualReset<boolean[][]>([]);
const checkResult = refManualReset<{
  valid: boolean
  message: string
} | undefined>(undefined);
const error = refManualReset<string | undefined>(undefined);
let ctx: Context | undefined;
let solver: Solver | undefined;

const { confetti } = useConfetti();

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
    userGrid.value = Array.from({ length: project.value.height }, () =>
      Array.from({ length: project.value!.width }, () => false));
  }

  checkResult.reset();
  error.reset();
});

function checkBingo(): boolean {
  if (!project.value)
    return false;

  // Check rows
  for (let i = 0; i < project.value.height; i++) {
    if (userGrid.value[i]?.every(cell => cell))
      return true;
  }

  // Check columns
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

  // Check diagonals (if square)
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

async function initializeSolver(): Promise<boolean> {
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
    console.error('Solver initialization failed:', err);
    error.value = String(err);
    return false;
  }
}

async function performVerification(): Promise<boolean> {
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
        if (userGrid.value[i]![j])
          solver.add(board[i]![j]!);
        else
          solver.add(ctx!.Not(board[i]![j]!));
      }
    }

    const result = await solver.check();
    return result === 'sat';
  } catch (err) {
    console.error('Verification error:', err);
    error.value = String(err);
    return false;
  }
}

async function verifyAnswer() {
  if (!z3.value || z3Status.value !== 'success' || !project.value)
    return;

  checkResult.value = undefined;
  error.value = undefined;

  try {
    if (!checkBingo()) {
      checkResult.value = {
        valid: false,
        message: '未达成连线',
      };
      showErrorToast(toast, '未达成连线', '请先标记一条完整的行、列或对角线');
      return;
    }

    const initialized = await initializeSolver();
    if (!initialized) {
      checkResult.value = {
        valid: false,
        message: error.value || '初始化求解器失败',
      };
      return;
    }

    const isValid = await performVerification();

    if (isValid) {
      checkResult.value = {
        valid: true,
        message: '恭喜！你的答案正确且满足所有约束条件！',
      };
      toast.add({
        title: '验证通过',
        description: '你的答案正确！',
        icon: 'lucide:check-circle',
        color: 'success',
        duration: 5000,
      });
      confetti();
    } else {
      checkResult.value = {
        valid: false,
        message: '你的答案不满足约束条件，请重新尝试。',
      };
      showErrorToast(toast, '验证失败', '答案不满足约束条件');
    }
  } catch (err) {
    console.error('Error in verifyAnswer:', err);
    error.value = String(err);
    checkResult.value = {
      valid: false,
      message: `验证过程出错：${String(err)}`,
    };
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
        :project="project"
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

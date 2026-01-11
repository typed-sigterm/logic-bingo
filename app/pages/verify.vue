<script setup lang="ts">
import type { Bool } from 'z3-solver';

const toast = useToast();
const { z3, status, error: e } = useZ3();
const { project, resetProject } = useProject();

watch(e, (x) => {
  console.error('Z3 Load Error:', x);
  toast.add({
    title: '求解模块加载失败，请检查网络连接',
    icon: 'lucide:circle-x',
    color: 'error',
    duration: 5000,
  });
});

const userGrid = ref<boolean[][]>([]);
const verifying = ref(false);
const verificationResult = ref<{
  valid: boolean
  message: string
}>();

const { confetti } = useConfetti();

watch(project, (x) => {
  if (x) {
    userGrid.value = Array.from({ length: x.height }, () =>
      Array.from({ length: x.width }, () => false));
    verificationResult.value = undefined;
  } else {
    userGrid.value = [];
    verificationResult.value = undefined;
  }
}, { immediate: true });

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

async function verifyAnswer() {
  if (!z3.value || status.value !== 'success' || !project.value)
    return;

  verifying.value = true;
  verificationResult.value = undefined;

  try {
    if (!checkBingo()) {
      verificationResult.value = {
        valid: false,
        message: '未达成连线',
      };
      toast.add({
        title: '未达成连线',
        description: '请先标记一条完整的行、列或对角线',
        icon: 'lucide:circle-x',
        color: 'error',
        duration: 5000,
      });
      return;
    }

    const { Context } = z3.value;
    const ctx = Context('main');
    const { Solver, Bool } = ctx;

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

    for (let i = 0; i < project.value.height; i++) {
      for (let j = 0; j < project.value.width; j++) {
        if (userGrid.value[i]![j])
          solver.add(board[i]![j]!);
        else
          solver.add(ctx.Not(board[i]![j]!));
      }
    }

    const result = await solver.check();

    if (result === 'sat') {
      verificationResult.value = {
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
      verificationResult.value = {
        valid: false,
        message: '你的答案不满足约束条件，请重新尝试。',
      };
      toast.add({
        title: '验证失败',
        description: '你的答案不满足约束条件',
        icon: 'lucide:circle-x',
        color: 'error',
        duration: 5000,
      });
    }
  } catch (err) {
    console.error('Verification error:', err);
    verificationResult.value = {
      valid: false,
      message: `验证过程出错：${String(err)}`,
    };
    toast.add({
      title: '验证错误',
      description: String(err),
      icon: 'lucide:circle-x',
      color: 'error',
      duration: 5000,
    });
  } finally {
    verifying.value = false;
  }
}

function clearGrid() {
  if (!project.value)
    return;
  userGrid.value = Array.from(
    { length: project.value.height },
    () => Array.from({ length: project.value!.width }, () => false),
  );
  verificationResult.value = undefined;
}
</script>

<template>
  <UContainer class="py-8">
    <ProjectUploader v-if="!project" />

    <div v-else class="space-y-8">
      <ProjectInfo :project="project" @reset="resetProject" />

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold">
              你的答案
            </h2>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-arrow-path"
              @click="clearGrid"
            >
              清空
            </UButton>
          </div>
        </template>

        <div class="flex flex-col items-center gap-6">
          <InteractiveGrid
            v-model="userGrid"
            :width="project.width"
            :height="project.height"
          />

          <div class="flex gap-4">
            <UButton
              :loading="verifying"
              :disabled="status !== 'success' || !project"
              color="primary"
              size="xl"
              icon="lucide:check"
              @click="verifyAnswer"
            >
              验证答案
            </UButton>
          </div>
        </div>
      </UCard>

      <UAlert
        v-if="verificationResult"
        :icon="verificationResult.valid ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
        :title="verificationResult.valid ? '验证通过' : '验证失败'"
        :description="verificationResult.message"
        :color="verificationResult.valid ? 'success' : 'error'"
        variant="soft"
      />
    </div>
  </UContainer>
</template>

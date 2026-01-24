<script setup lang="ts">
const toast = useToast();
const { loadProjectFromFile, loadDefaultProject, isLoading } = useProject();
const uploadedFile = ref<File>();

callOnce(() => loadDefaultProject());

watch(uploadedFile, async (file) => {
  if (!file)
    return;

  try {
    await loadProjectFromFile(file);
  } catch (e) {
    showErrorToast(toast, '文件加载失败', e);
  }
});
</script>

<template>
  <div class="space-y-4">
    <UFileUpload
      v-model="uploadedFile"
      class="max-w-2xl mx-auto min-h-64"
      accept=".lbc"
      label="选择或拖拽文件到此处"
      description="支持 .lbc 格式文件"
      size="xl"
      :loading="isLoading"
    />

    <p class="text-center text-sm text-gray-500 dark:text-gray-400">
      或使用
      <UButton
        class="p-0 cursor-pointer"
        variant="link"
        @click="loadDefaultProject"
      >
        示例文件
      </UButton>
    </p>
  </div>
</template>

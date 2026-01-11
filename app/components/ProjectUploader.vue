<script setup lang="ts">
const toast = useToast();
const { loadProjectFromFile, loadDefaultProject, isLoading } = useProject();
const uploadedFile = ref<File>();

// Load default project on mount
onMounted(() => {
  loadDefaultProject();
});

watch(uploadedFile, async (file) => {
  if (!file)
    return;

  try {
    await loadProjectFromFile(file);
  } catch (err) {
    toast.add({
      title: '文件加载失败',
      description: String(err),
      icon: 'lucide:circle-x',
      color: 'error',
      duration: 5000,
    });
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
      或使用默认示例文件（已自动加载）
    </p>
  </div>
</template>

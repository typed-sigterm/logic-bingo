import DefaultProject from '~/assets/default-project.lbc?arraybuffer';

export function useProject() {
  const project = useState<Project | undefined>('project');
  const isLoading = useState('project-loading', () => false);
  const error = useState<string | undefined>('project-error');

  async function loadDefaultProject() {
    project.value = await deserializeProject(DefaultProject);
  }

  async function loadProjectFromFile(file: File) {
    isLoading.value = true;
    error.value = undefined;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadedProject = await deserializeProject(arrayBuffer);
      project.value = loadedProject;
    } catch (err) {
      console.error('Failed to load project from file:', err);
      error.value = `文件加载失败：${String(err)}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function resetProject() {
    project.value = undefined;
    error.value = undefined;
  }

  return {
    project,
    isLoading,
    error,
    loadDefaultProject,
    loadProjectFromFile,
    resetProject,
  };
}

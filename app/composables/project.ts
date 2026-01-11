import type { Project } from '~/utils/game';

export function useProject() {
  const project = useState<Project | undefined>('project');
  const isLoading = useState('project-loading', () => false);
  const error = useState<string | undefined>('project-error');

  async function loadDefaultProject() {
    if (project.value)
      return; // Already loaded

    isLoading.value = true;
    error.value = undefined;

    try {
      const response = await fetch('/logic_bingo.lbc');
      if (!response.ok)
        throw new Error('Failed to fetch default project file');

      const arrayBuffer = await response.arrayBuffer();
      const loadedProject = await deserializeProject(arrayBuffer);
      project.value = loadedProject;
    } catch (err) {
      console.error('Failed to load default project:', err);
      error.value = `加载默认文件失败：${String(err)}`;
    } finally {
      isLoading.value = false;
    }
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

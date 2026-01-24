import DefaultProject from '~/assets/default-project.lbc?arraybuffer&base64';

export function useProject() {
  const project = useState<Project | undefined>();
  const isLoading = useState(() => false);
  const error = useState<string | undefined>();

  const loadDefaultProject = async () => {
    project.value = await deserializeProject(DefaultProject);
  };

  const loadProjectFromFile = async (file: File) => {
    isLoading.value = true;
    error.value = undefined;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadedProject = await deserializeProject(arrayBuffer);
      project.value = loadedProject;
    } catch (err) {
      console.error('文件加载失败', err);
      error.value = `文件加载失败：${String(err)}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const resetProject = () => {
    project.value = undefined;
    error.value = undefined;
  };

  return {
    project,
    isLoading,
    error,
    loadDefaultProject,
    loadProjectFromFile,
    resetProject,
  };
}

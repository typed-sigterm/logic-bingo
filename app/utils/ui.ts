import type { useToast } from '@nuxt/ui/runtime/composables/useToast.js';

export function showErrorToast(toast: ReturnType<typeof useToast>, title: string, error?: unknown) {
  toast.add({
    title,
    description: String(error),
    duration: 4500,
    color: 'error',
    icon: 'lucide:circle-x',
  });
}

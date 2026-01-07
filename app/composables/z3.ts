import type { Z3HighLevel, Z3LowLevel } from 'z3-solver';

export function useZ3() {
  const { data: z3, status, error, pending } = useAsyncData<Z3HighLevel & Z3LowLevel>(async () => {
    const { init } = await import('z3-solver/build/browser');
    return await init();
  }, {
    lazy: true,
    server: false,
    dedupe: 'defer',
  });

  return { z3, status, error, pending };
}

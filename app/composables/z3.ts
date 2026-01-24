import type { Z3HighLevel, Z3LowLevel } from 'z3-solver';
import { init } from 'z3-solver';

export function useZ3() {
  return useAsyncData<Z3HighLevel & Z3LowLevel>(init, {
    lazy: true,
    server: false,
    dedupe: 'defer',
  });
}

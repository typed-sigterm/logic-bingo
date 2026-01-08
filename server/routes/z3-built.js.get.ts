import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineEventHandler(async (ev) => {
  if (!import.meta.dev)
    throw new Error('Should be served statically in production.');
  const id = path.resolve(
    __dirname,
    '../../node_modules/z3-solver/build/z3-built.js',
  );
  ev.respondWith(
    new Response(await readFile(id), {
      headers: { 'Content-Type': 'application/javascript' },
    }),
  );
});

import * as z from 'zod';

export const ProjectSchema = z.object({
  schema: z.literal(1).default(1),
  width: z.int().min(1).max(100),
  height: z.int().min(1).max(100),
  smtlib: z.string(),
  labels: z.string().array().array(),
});
export type Project = z.infer<typeof ProjectSchema>;

async function readAll(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const result: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done)
      break;
    result.push(value);
  }
  const len = result.reduce((acc, cur) => acc + cur.length, 0);
  const output = new Uint8Array(len);
  let offset = 0;
  for (const chunk of result) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

export async function serializeProject(project: Project) {
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const ret = readAll(stream.readable);
  await writer.write(new TextEncoder().encode(JSON.stringify(project)));
  await writer.close();
  return await ret;
}

export async function deserializeProject(data: ArrayBuffer) {
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  const reading = readAll(stream.readable);
  await writer.write(data);
  await writer.close();
  const obj = JSON.parse(new TextDecoder().decode(await reading));
  return ProjectSchema.parse(obj);
}

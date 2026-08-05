import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Writes a downloaded media file to disk under public/uploads/blog/{mediaId}/{fileName},
 * matching the URL scheme used by getMediaUrl() in lib/blog.ts.
 *
 * IMPORTANT: assumes a persistent, writable filesystem (a traditional Node.js
 * server / VPS via `next start`). On serverless platforms (Vercel etc.),
 * `public/` is read-only at runtime and this WILL fail — swap the body of
 * this function for an object-storage upload (S3, R2, etc.) if/when this
 * moves to serverless. Every caller only depends on this function's
 * signature, not on how/where the bytes end up.
 */
export async function saveMediaFile(
  buffer: Buffer,
  mediaId: number,
  fileName: string,
): Promise<void> {
  const dir = path.join(process.cwd(), "public", "uploads", "blog", String(mediaId));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
}

/**
 * Local test runner for the blog sync — calls syncBlogs() directly, no
 * running server or auth header needed. Safe to run repeatedly: the sync
 * is insert-only (skips any slug that already exists), so re-running this
 * after a successful run will just report everything as "skipped".
 *
 * Run:
 *   npx tsx --env-file=.env scripts/run-blog-sync.ts
 */

import { syncBlogs } from "../lib/blog-sync";

syncBlogs()
  .then((stats) => {
    console.log("Sync complete:", stats);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });

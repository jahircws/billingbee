import { NextRequest, NextResponse } from "next/server";
import { syncBlogs } from "@/lib/blog-sync";

// Image downloads can take a while across many posts — extend if your
// hosting platform supports configuring function duration.
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.BLOG_SYNC_SECRET}`;
}

// POST /api/blog-sync — trigger a sync run. Call this from a cron job
// (Vercel Cron, GitHub Actions schedule, external scheduler, etc.) with
// header: Authorization: Bearer <BLOG_SYNC_SECRET>
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await syncBlogs();
  return NextResponse.json(stats);
}

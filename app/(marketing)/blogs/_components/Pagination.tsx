import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  sp.set("page", String(page));
  return `${basePath}?${sp.toString()}`;
}

/**
 * Builds a condensed page list like [1, "...", 5, 6, 7, 8, 9, "...", 53]
 * instead of every page number, which is unusable once totalPages is large.
 */
function getPageRange(current: number, total: number, delta = 2): (number | "...")[] {
  const range: (number | "...")[] = [];
  const start = Math.max(2, current - delta);
  const end = Math.min(total - 1, current + delta);

  range.push(1);
  if (start > 2) range.push("...");
  for (let p = start; p <= end; p++) range.push(p);
  if (end < total - 1) range.push("...");
  if (total > 1) range.push(total);

  return range;
}

export function Pagination({
  page,
  totalPages,
  basePath = "/blogs",
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath?: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const pages = getPageRange(page, totalPages);

  return (
    <nav
      className="flex items-center justify-center flex-wrap gap-1.5 mt-10"
      aria-label="Pagination"
    >
      <Link
        href={buildHref(basePath, params, Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`w-9 h-9 flex items-center justify-center rounded-lg border text-slate-500 transition-colors shrink-0 ${
          page === 1
            ? "pointer-events-none opacity-40"
            : "hover:bg-slate-50 border-slate-200"
        }`}
      >
        <ChevronLeft size={16} />
      </Link>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 flex items-center justify-center text-sm text-slate-400 shrink-0"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(basePath, params, p)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors shrink-0 ${
              p === page
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={buildHref(basePath, params, Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`w-9 h-9 flex items-center justify-center rounded-lg border text-slate-500 transition-colors shrink-0 ${
          page === totalPages
            ? "pointer-events-none opacity-40"
            : "hover:bg-slate-50 border-slate-200"
        }`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}

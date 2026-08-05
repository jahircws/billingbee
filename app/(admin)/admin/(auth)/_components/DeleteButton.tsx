"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(() => {
      action();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Delete"
      className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}

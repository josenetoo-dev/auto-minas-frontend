"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function HistoryBackButton({
  fallback,
  className,
  ariaLabel = "Voltar",
  children,
}: {
  fallback: string;
  className?: string;
  ariaLabel?: string;
  children?: ReactNode;
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button type="button" onClick={goBack} className={className} aria-label={ariaLabel}>
      {children ?? "←"}
    </button>
  );
}

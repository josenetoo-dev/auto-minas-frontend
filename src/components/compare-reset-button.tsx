"use client";

import { useRouter } from "next/navigation";

export default function CompareResetButton() {
  const router = useRouter();
  return <button type="button" className="min-h-11 rounded-lg border border-white/30 px-4 text-sm" onClick={() => {
    try { localStorage.removeItem("auto_minas_compare_v1"); window.dispatchEvent(new Event("auto-minas-compare-change")); }
    catch { /* The URL still gives the user a fresh selection. */ }
    router.push("/carros");
  }}>Limpar e escolher outro par</button>;
}

"use client";

import Link from "next/link";
import { useSyncExternalStore, useState } from "react";

const KEY = "auto_minas_compare_v1";
const CHANGE = "auto-minas-compare-change";
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(CHANGE, callback); window.removeEventListener("storage", callback); };
}
function snapshot() { try { return localStorage.getItem(KEY) || "[]"; } catch { return "[]"; } }
function selected(raw: string): number[] {
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? [...new Set(ids.filter((id): id is number => Number.isSafeInteger(id) && id > 0))].slice(0, 2) : [];
  } catch { return []; }
}
export default function CompareButton({ id }: { id: number }) {
  const ids = selected(useSyncExternalStore(subscribe, snapshot, () => "[]"));
  const [error, setError] = useState("");
  const active = ids.includes(id);
  function toggle() {
    if (!active && ids.length === 2) { setError("Remova um veículo para comparar outro par."); return; }
    const next = active ? ids.filter(item => item !== id) : [...ids, id];
    try { localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new Event(CHANGE)); setError(""); }
    catch { setError("Seu navegador não permitiu salvar a seleção."); }
  }
  return <div className="mt-5 flex flex-wrap items-center gap-3">
    <button type="button" onClick={toggle} aria-pressed={active} className="min-h-11 rounded-lg border border-[#d4af37]/50 px-4 text-sm font-semibold">
      {active ? "Remover da comparação" : "Adicionar à comparação"}
    </button>
    {ids.length === 2 && <Link href={`/comparar?ids=${ids.join(",")}`} className="min-h-11 content-center text-sm underline">
      Comparar dois veículos
    </Link>}
    {ids.length === 1 && <span className="text-sm text-[#c5c2b9]">Escolha mais um veículo para comparar.</span>}
    {error && <span role="alert" className="text-sm text-red-300">{error}</span>}
  </div>;
}

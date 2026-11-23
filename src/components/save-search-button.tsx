"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const KEYS = ["q","brand","city","state","fuel","transmission","minPrice","maxPrice","yearMin","sort"];
export default function SaveSearchButton({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!signedIn) { router.push(`/login?next=${encodeURIComponent(`/carros?${params.toString()}`)}`); return; }
    const filters: Record<string,string> = {};
    for (const key of KEYS) { const value = params.get(key); if (value) filters[key] = value; }
    if (!Object.keys(filters).length) { setMessage("Escolha pelo menos um filtro antes de salvar."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/saved-searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: name.trim(), filtros: filters }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Não foi possível salvar a busca.");
      setName(""); setOpen(false); setMessage("Busca salva. Consulte-a em sua conta.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar a busca."); }
    finally { setBusy(false); }
  }
  return <div className="mx-4 my-4 text-sm">
    <button type="button" className="min-h-11 rounded-lg border border-[#d4af37]/50 px-4 font-semibold" onClick={() => setOpen(value => !value)}>Guardar estes filtros</button>
    <p className="mt-1 text-[#c5c2b9]">Acesse esta mesma combinação depois em Minha conta → Buscas salvas. Não ativa alertas.</p>
    {open && <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-2">
      <label>Nome da busca <input className="ml-2 min-h-11 rounded border border-white/30 bg-[#171716] px-3" value={name} maxLength={60} required onChange={event => setName(event.target.value)} /></label>
      <button type="submit" disabled={busy} className="min-h-11 rounded bg-[#d4af37] px-4 font-semibold text-black">{busy ? "Salvando…" : "Salvar"}</button>
    </form>}
    {message && <p role="status" className="mt-2">{message}</p>}
  </div>;
}

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export type SavedSearch = { id: number; nome: string; filtros: Record<string,string>; atualizadoEm: string };
const KEYS = ["q","brand","city","state","fuel","transmission","minPrice","maxPrice","yearMin","sort"];
const EDITABLE = [
  { key: "q", label: "Marca ou modelo" }, { key: "brand", label: "Marca exata" },
  { key: "city", label: "Cidade" }, { key: "state", label: "UF" },
  { key: "minPrice", label: "Preço mínimo" }, { key: "maxPrice", label: "Preço máximo" },
  { key: "yearMin", label: "Ano mínimo" }, { key: "fuel", label: "Combustível" },
  { key: "transmission", label: "Câmbio" },
];
function searchUrl(filters: Record<string,string>) {
  const query = new URLSearchParams();
  for (const key of KEYS) if (filters[key]) query.set(key, filters[key]);
  return `/carros?${query.toString()}`;
}
export default function SavedSearchList({ initial }: { initial: SavedSearch[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [filters, setFilters] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function edit(item: SavedSearch) { setEditing(item.id); setName(item.nome); setFilters({ ...item.filtros }); setError(""); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (editing === null || busy) return;
    setBusy(true); setError("");
    try {
      const cleaned = Object.fromEntries(Object.entries(filters).filter(([key,value]) => KEYS.includes(key) && value.trim()));
      const response = await fetch(`/api/saved-searches/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: name.trim(), filtros: cleaned }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Não foi possível editar a busca.");
      const updated: SavedSearch = await response.json();
      setItems(previous => previous.map(item => item.id === updated.id ? updated : item)); setEditing(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível editar a busca."); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Não foi possível excluir a busca.");
      setItems(previous => previous.filter(item => item.id !== id)); if (editing === id) setEditing(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir a busca."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {items.length === 0 && <p>Nenhuma busca salva. <Link href="/carros" className="underline">Explorar carros</Link></p>}
    {items.map(item => <article key={item.id} className="rounded-xl border border-white/20 bg-[#171716] p-4">
      <h2 className="text-lg font-bold">{item.nome}</h2>
      <p className="mt-1 text-sm text-[#c5c2b9]">{Object.entries(item.filtros).map(([key,value]) => `${key}: ${value}`).join(" · ")}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link className="min-h-11 content-center underline" href={searchUrl(item.filtros)}>Usar busca</Link>
        <button type="button" className="min-h-11 underline" onClick={() => edit(item)}>Editar</button>
        <button type="button" className="min-h-11 text-red-300 underline" disabled={busy} onClick={() => void remove(item.id)}>Excluir</button>
      </div>
      {editing === item.id && <form className="mt-4 space-y-3 border-t border-white/20 pt-4" onSubmit={save}>
        <label className="block">Nome <input className="ml-2 min-h-11 rounded border border-white/30 bg-[#111] px-3" value={name} maxLength={60} required onChange={event => setName(event.target.value)} /></label>
        <div className="grid gap-3 sm:grid-cols-2">{EDITABLE.map(field => <label key={field.key} className="block text-sm">{field.label}
          <input className="mt-1 block min-h-11 w-full rounded border border-white/30 bg-[#111] px-3" value={filters[field.key] || ""} onChange={event => setFilters(previous => ({ ...previous, [field.key]: event.target.value }))} />
        </label>)}</div>
        <label className="block text-sm">Ordenação <select className="ml-2 min-h-11 rounded border border-white/30 bg-[#111] px-3" value={filters.sort || "recentes"} onChange={event => setFilters(previous => ({ ...previous, sort: event.target.value }))}>
          <option value="recentes">Recentes</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option><option value="menor-km">Menor km</option>
        </select></label>
        <button type="submit" disabled={busy} className="min-h-11 rounded bg-[#d4af37] px-4 font-semibold text-black">Salvar alterações</button>
      </form>}
    </article>)}
  </div>;
}

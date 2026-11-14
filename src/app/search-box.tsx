"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("CARRO");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ tipo });
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    if (state) params.set("state", state);
    router.push(`/carros?${params.toString()}`);
  }
  return <form onSubmit={submit} className="market-search">
    <div className="mb-5 flex gap-6 border-b border-[#d0c6b2]">{[["CARRO", "Carros"], ["MOTO", "Motos"]].map(([value, label]) => <button key={value} type="button" onClick={() => setTipo(value)} aria-pressed={tipo === value} className={`min-h-11 border-b-2 pb-3 text-sm font-semibold ${tipo === value ? "border-[#76602e] text-[#27251f]" : "border-transparent text-[#827967]"}`}>{label}</button>)}</div>
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)_70px]">
      <label className="market-search-label">O que você procura?<input value={q} onChange={event => setQ(event.target.value)} placeholder="Marca, modelo ou versão" className="market-search-input" /></label>
      <label className="market-search-label">Onde?<input value={city} onChange={event => setCity(event.target.value)} placeholder="Sua cidade" className="market-search-input" /></label>
      <label className="market-search-label">Estado<select value={state} onChange={event => setState(event.target.value)} className="market-search-input"><option value="">UF</option>{["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf}>{uf}</option>)}</select></label>
    </div>
    <button type="submit" className="mt-5 flex min-h-12 w-full items-center justify-between rounded-lg bg-[#24251f] px-5 text-sm font-semibold text-[#f4ead4] transition hover:bg-[#39392f]">Encontrar meu próximo veículo <span aria-hidden="true">↗</span></button>
  </form>;
}

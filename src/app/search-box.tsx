"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("CARRO");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = q.trim();
    const params=new URLSearchParams();params.set("tipo",tipo);if(value)params.set("q",value);if(city.trim())params.set("city",city.trim());if(state)params.set("state",state);
    router.push(`/carros?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-2xl border border-[#d4af37]/30 bg-black/60 p-2 backdrop-blur-xl sm:flex-row"
    >
      <div className="flex flex-1 flex-wrap items-center gap-3 rounded-xl px-4">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#d4af37]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por marca, modelo ou versão…"
          className="w-full bg-transparent py-3 text-sm text-[#f4f3ee] outline-none placeholder:text-[#5c5c66] sm:text-base"
        />
        <div className="flex w-full gap-2 pb-2 sm:w-auto sm:pb-0">
          {[["CARRO","Carros"],["MOTO","Motos"]].map(([value,label])=><button key={value} type="button" onClick={()=>setTipo(value)} aria-pressed={tipo===value} className={`rounded-full border px-3 py-1.5 text-xs ${tipo===value?"border-[#d4af37] text-[#f2d87e]":"border-white/10 text-[#a8a8b0]"}`}>{label}</button>)}
        </div>
        <input aria-label="Cidade" value={city} onChange={e=>setCity(e.target.value)} placeholder="Cidade" className="w-full border-t border-white/10 bg-transparent px-1 py-2 text-sm text-[#f4f3ee] outline-none placeholder:text-[#5c5c66] sm:w-36 sm:border-l sm:border-t-0 sm:pl-3" />
        <select aria-label="Estado" value={state} onChange={e=>setState(e.target.value)} className="w-full border-t border-white/10 bg-black px-1 py-2 text-sm text-[#f4f3ee] sm:w-24 sm:border-l sm:border-t-0 sm:pl-3"><option value="">UF</option>{["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf=><option key={uf}>{uf}</option>)}</select>
      </div>
      <button type="submit" className="btn-gold px-7 py-3">
        Buscar
      </button>
    </form>
  );
}

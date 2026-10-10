"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = q.trim();
    router.push(value ? `/carros?q=${encodeURIComponent(value)}` : "/carros");
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-2xl border border-[#d4af37]/30 bg-black/60 p-2 backdrop-blur-xl sm:flex-row"
    >
      <div className="flex flex-1 items-center gap-3 rounded-xl px-4">
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
      </div>
      <button type="submit" className="btn-gold px-7 py-3">
        Buscar
      </button>
    </form>
  );
}

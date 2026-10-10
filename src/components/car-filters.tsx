"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type FilterState = {
  q: string;
  brand: string;
  fuel: string;
  transmission: string;
  minPrice: string;
  maxPrice: string;
  yearMin: string;
  sort: string;
};

type Props = {
  initial: FilterState;
  brands: string[];
  fuelOptions: { value: string; label: string }[];
  transmissionOptions: { value: string; label: string }[];
  total: number;
};

const PRICE_RANGES = [
  { label: "Até R$ 40 mil", max: "40000", min: "" },
  { label: "R$ 40–70 mil", min: "40000", max: "70000" },
  { label: "R$ 70–100 mil", min: "70000", max: "100000" },
  { label: "Acima de R$ 100 mil", min: "100000", max: "" },
];

const YEAR_OPTIONS = ["2015", "2018", "2020", "2022", "2023", "2024", "2025"];

export default function CarFilters({ initial, brands, fuelOptions, transmissionOptions, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FilterState>(initial);
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);

  function apply(patch: Partial<FilterState>) {
    const next = { ...state, ...patch };
    setState(next);
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`/carros${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  // Ao digitar na busca, atualiza após uma pausa
  useEffect(() => {
    if (typing === null) return;
    const t = setTimeout(() => {
      apply({ q: typing });
      setTyping(null);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing]);

  function setPriceRange(min: string, max: string) {
    apply({ minPrice: min, maxPrice: max });
  }

  const activeCount =
    (state.q ? 1 : 0) +
    (state.brand ? 1 : 0) +
    (state.fuel ? 1 : 0) +
    (state.transmission ? 1 : 0) +
    (state.minPrice || state.maxPrice ? 1 : 0) +
    (state.yearMin ? 1 : 0);

  return (
    <div className="card-dark p-4 sm:p-5">
      {/* Linha superior: busca + ordenação */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d4af37]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={state.q}
            onChange={(e) => setTyping(e.target.value)}
            placeholder="Buscar marca, modelo ou versão…"
            className="input-dark pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="hidden text-xs font-semibold uppercase tracking-wider text-[#9b9ba4] sm:block">
            Ordenar
          </label>
          <select
            value={state.sort}
            onChange={(e) => apply({ sort: e.target.value })}
            className="input-dark w-full sm:w-56"
          >
            <option value="recentes">Mais recentes</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="menor-km">Menor quilometragem</option>
          </select>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-outline relative px-4 py-2.5 text-sm"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filtros
            {activeCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#f2d87e] to-[#b08d24] text-[10px] font-bold text-[#171003]">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Chips de preço rápido */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PRICE_RANGES.map((r) => {
          const active = state.minPrice === r.min && state.maxPrice === r.max;
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => setPriceRange(r.min, r.max)}
              className={`chip ${active ? "chip-active" : ""}`}
            >
              {r.label}
            </button>
          );
        })}
        <button type="button" onClick={() => apply({ minPrice: "", maxPrice: "" })} className="chip">
          Qualquer preço
        </button>
      </div>

      {/* Painel expandível */}
      {open && (
        <div className="mt-4 grid gap-4 border-t border-[#26262e] pt-4 animate-fade-up sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label-dark">Marca</label>
            <select
              value={state.brand}
              onChange={(e) => apply({ brand: e.target.value })}
              className="input-dark"
            >
              <option value="">Todas</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-dark">Combustível</label>
            <select
              value={state.fuel}
              onChange={(e) => apply({ fuel: e.target.value })}
              className="input-dark"
            >
              <option value="">Todos</option>
              {fuelOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-dark">Câmbio</label>
            <select
              value={state.transmission}
              onChange={(e) => apply({ transmission: e.target.value })}
              className="input-dark"
            >
              <option value="">Todos</option>
              {transmissionOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-dark">Ano mínimo</label>
            <select
              value={state.yearMin}
              onChange={(e) => apply({ yearMin: e.target.value })}
              className="input-dark"
            >
              <option value="">Qualquer</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}+</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="label-dark">Preço (R$)</label>
            <div className="flex gap-3">
              <input
                type="number"
                min="0"
                placeholder="Mínimo"
                value={state.minPrice}
                onChange={(e) => apply({ minPrice: e.target.value })}
                className="input-dark"
              />
              <input
                type="number"
                min="0"
                placeholder="Máximo"
                value={state.maxPrice}
                onChange={(e) => apply({ maxPrice: e.target.value })}
                className="input-dark"
              />
              <button
                type="button"
                onClick={() => apply({ minPrice: "", maxPrice: "" })}
                className="btn-ghost whitespace-nowrap text-sm"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[#26262e] pt-3.5">
        <p className="text-sm text-[#9b9ba4]">
          <span className="font-bold text-[#f2d87e]">{total}</span> veículo{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setState({ q: "", brand: "", fuel: "", transmission: "", minPrice: "", maxPrice: "", yearMin: "", sort: state.sort });
              router.replace("/carros", { scroll: false });
            }}
            className="text-sm font-semibold text-[#f2d87e] hover:underline"
          >
            Limpar todos os filtros
          </button>
        )}
      </div>
    </div>
  );
}

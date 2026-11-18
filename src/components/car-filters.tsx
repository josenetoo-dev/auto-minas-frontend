"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type FilterState = {
  q: string;
  brand: string;
  city: string;
  state: string;
  fuel: string;
  transmission: string;
  minPrice: string;
  maxPrice: string;
  yearMin: string;
  sort: string;
  tipo: string;
};

type Props = {
  initial: FilterState;
  brands: string[];
  fuelOptions: { value: string; label: string }[];
  transmissionOptions: { value: string; label: string }[];
  total: number;
};

const YEAR_OPTIONS = Array.from({length:new Date().getFullYear()+2-1900},(_,i)=>String(new Date().getFullYear()+1-i));
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function CarFilters({ initial, brands, fuelOptions, transmissionOptions, total }: Props) {
  const validBrands = useMemo(() => [...new Set(brands.map((b) => b.trim()).filter((b) =>
    b.length > 1 && !/^(selecione( um| uma)? (carro|marca|veículo)?|marca|todas?)$/i.test(b)
  ))], [brands]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FilterState>(initial);
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(initial.q);

  useEffect(() => {
    setState(initial);
    setTyping(initial.q);
  }, [initial]);

  function navigate(next: FilterState) {
    next = { ...next, brand: validBrands.includes(next.brand) ? next.brand : "", tipo:"CARRO" };
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");
    router.replace(`/carros${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  function applyAll() {
    const next = { ...state, q: typing.trim() };
    setState(next);
    navigate(next);
    setOpen(false);
  }

  function quickApply(patch: Partial<FilterState>) {
    const next = { ...state, ...patch };
    setState(next);
    navigate(next);
  }

  function clearAll() {
    const next: FilterState = {
      q: "",
      brand: "",
      city: "",
      state: "",
      fuel: "",
      transmission: "",
      minPrice: "",
      maxPrice: "",
      yearMin: "",
      sort: state.sort || "recentes",
      tipo: "CARRO",
    };
    setTyping("");
    setState(next);
    router.replace("/carros", { scroll: false });
  }

  const activeCount = useMemo(() =>
    (state.brand ? 1 : 0) +
    (state.city ? 1 : 0) +
    (state.state ? 1 : 0) +
    (state.fuel ? 1 : 0) +
    (state.transmission ? 1 : 0) +
    (state.minPrice || state.maxPrice ? 1 : 0) +
    (state.yearMin ? 1 : 0),
  [state]);

  return (
    <>
      <div className="cars-search-shell">
        <form
          className="cars-search-box"
          onSubmit={(event) => {
            event.preventDefault();
            applyAll();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            value={typing}
            onChange={(event) => setTyping(event.target.value)}
            placeholder="Busque por marca ou modelo..."
          />
        </form>

        <div className="cars-filter-chips">
          <button type="button" className="cars-filter-button" onClick={() => setOpen((value) => !value)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="8" cy="17" r="2" />
            </svg>
            <span>Filtros</span>
            {activeCount > 0 && <span className="cars-filter-count">{activeCount}</span>}
          </button>

          <button
            type="button"
            className={`cars-filter-chip ${state.tipo === "CARRO" ? "is-active" : ""}`}
            onClick={() => quickApply({ tipo: "CARRO" })}
          >
            Carros
          </button>
          <button
            type="button"
            className={`cars-filter-chip ${state.maxPrice === "70000" ? "is-active" : ""}`}
            onClick={() => quickApply({ minPrice: "", maxPrice: state.maxPrice === "70000" ? "" : "70000" })}
          >
            Até R$ 70 mil
          </button>
        </div>

        {open && (
          <div className="cars-filter-panel">
            <label>
              <span>Marca</span>
              <select value={state.brand} onChange={(e) => setState((prev) => ({ ...prev, brand: e.target.value }))}>
                <option value="">Todas</option>
                {validBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </label>

            <label>
              <span>Cidade</span>
              <input value={state.city} onChange={(e) => setState((prev) => ({ ...prev, city: e.target.value }))} placeholder="Sua cidade" />
            </label>

            <label>
              <span>Estado</span>
              <select value={state.state} onChange={(e) => setState((prev) => ({ ...prev, state: e.target.value }))}>
                <option value="">Todos</option>
                {UFS.map((uf) => <option key={uf}>{uf}</option>)}
              </select>
            </label>

            <label>
              <span>Combustível</span>
              <select value={state.fuel} onChange={(e) => setState((prev) => ({ ...prev, fuel: e.target.value }))}>
                <option value="">Todos</option>
                {fuelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label>
              <span>Câmbio</span>
              <select value={state.transmission} onChange={(e) => setState((prev) => ({ ...prev, transmission: e.target.value }))}>
                <option value="">Todos</option>
                {transmissionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label>
              <span>Ano mínimo</span>
              <select value={state.yearMin} onChange={(e) => setState((prev) => ({ ...prev, yearMin: e.target.value }))}>
                <option value="">Qualquer</option>
                {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}+</option>)}
              </select>
            </label>

            <label>
              <span>Preço mínimo</span>
              <input type="number" min="0" value={state.minPrice} onChange={(e) => setState((prev) => ({ ...prev, minPrice: e.target.value }))} placeholder="R$ 0" />
            </label>

            <label>
              <span>Preço máximo</span>
              <input type="number" min="0" value={state.maxPrice} onChange={(e) => setState((prev) => ({ ...prev, maxPrice: e.target.value }))} placeholder="Sem limite" />
            </label>
          </div>
        )}

        <div className="cars-results-toolbar">
          <p><strong>{total}</strong> veículo{total === 1 ? "" : "s"} encontrado{total === 1 ? "" : "s"}</p>
          <select value={state.sort} onChange={(e) => quickApply({ sort: e.target.value })} aria-label="Ordenar veículos">
            <option value="recentes">Mais recentes</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="menor-km">Menor km</option>
          </select>
        </div>
      </div>

      {open && (
        <div className="cars-filter-actions">
          <button type="button" className="cars-clear-filters" onClick={clearAll}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.2 8.2A7 7 0 0 1 18.8 9M17.8 15.8A7 7 0 0 1 5.2 15"/></svg>
            Limpar filtros
          </button>
          <button type="button" className="cars-apply-filters" onClick={applyAll}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>
            Aplicar filtros{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>
      )}
    </>
  );
}

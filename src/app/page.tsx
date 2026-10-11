import Link from "next/link";
import { publicCars } from "@/lib/car";
import CarCard from "@/components/car-card";
import { BRANDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

import SearchBox from "./search-box";

export default async function HomePage() {
  const cars = await publicCars().catch(() => null);
  const featured = cars?.slice(0,6) || [];
  const total = cars?.length ?? 0;

  return (
    <div>
      {!cars && <div role="alert" className="border-b border-amber-500/30 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-200">A API Auto Minas está indisponível. Não é possível carregar anúncios agora.</div>}
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "linear-gradient(125deg, #08080a 10%, #272014 55%, #08080a 100%)" }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-24 sm:pt-28">
          <span className="badge-gold max-w-full animate-fade-up px-3 text-center text-[10px] leading-snug sm:text-xs">Marketplace de veículos Auto Minas</span>
          <h1 className="font-display mt-5 max-w-3xl animate-fade-up text-[clamp(2rem,9vw,3rem)] font-bold leading-tight text-[#f4f3ee] sm:mt-6 sm:text-6xl">
            O seu próximo carro está aqui,{" "}
            <span className="gold-text italic">com estilo</span>
          </h1>
          <p className="mt-5 max-w-xl animate-fade-up text-base text-[#b9b9c0] sm:text-lg">
            Encontre veículos e envie propostas aos vendedores. Anúncios passam por revisão antes de serem publicados.
          </p>

          <div className="mt-10 w-full max-w-2xl animate-fade-up">
            <SearchBox />
          </div>

          <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-2.5 animate-fade-up min-[430px]:grid-cols-3 sm:mt-14 sm:gap-4">
            {[
              { value: cars ? String(total) : "—", label: "Carros à venda" },
              { value: "Humana", label: "Revisão dos anúncios" },
              { value: "Segurança", label: "Verificação documental" },
            ].map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-xl border border-white/10 bg-black/40 px-3 py-3 backdrop-blur-md sm:rounded-2xl sm:px-4 sm:py-5"
              >
                <p className="gold-text font-display text-2xl font-bold break-words sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#9b9ba4] sm:text-xs sm:tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 animate-fade-up sm:mt-12 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link href="/carros" className="btn-gold w-full px-5 py-3.5 sm:w-auto sm:px-8">
              Explorar veículos
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link href="/vender" className="btn-outline w-full px-5 py-3.5 sm:w-auto sm:px-8">
              Vender meu carro
            </Link>
          </div>
        </div>
      </section>

      {/* MARCAS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {BRANDS.slice(0, 12).map((brand) => (
            <Link
              key={brand}
              href={`/carros?brand=${encodeURIComponent(brand)}`}
              className="chip"
            >
              {brand}
            </Link>
          ))}
          <Link href="/carros" className="chip chip-active">
            Ver todas →
          </Link>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
              Seleção especial
            </p>
            <h2 className="font-display mt-2 text-[clamp(1.5rem,6vw,1.875rem)] font-bold text-[#f4f3ee]">
              Destaques <span className="gold-text">da semana</span>
            </h2>
          </div>
          <Link
            href="/carros"
            className="hidden items-center gap-1.5 text-sm font-semibold text-[#f2d87e] hover:underline sm:flex"
          >
            Ver todos os carros
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-y border-[#1c1c22] bg-[#0b0b0f]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
              Simples assim
            </p>
            <h2 className="font-display mt-2 text-[clamp(1.5rem,6vw,1.875rem)] font-bold text-[#f4f3ee]">
              Como funciona a <span className="gold-text">Auto Minas</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                ),
                title: "Encontre o carro ideal",
                text: "Navegue pelo acervo, filtre por marca, preço e características e encontre o veículo dos seus sonhos.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                  </svg>
                ),
                title: "Envie propostas e converse",
                text: "Envie uma proposta para iniciar uma negociação e converse diretamente com o anunciante.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12M7 8l5-5 5 5M5 21h14M5 15h14v6H5z" />
                  </svg>
                ),
                title: "Cadastre seu veículo",
                text: "Confirme sua conta, envie a documentação e aguarde a revisão para publicar o anúncio.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="card-dark card-dark-hover relative overflow-hidden p-7"
              >
                <span className="font-display absolute -right-2 -top-6 text-8xl font-bold text-[#d4af37]/8">
                  {i + 1}
                </span>
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#f2d87e] via-[#d4af37] to-[#8a6d1c] text-[#171003]">
                    {step.icon}
                  </div>
                  <h3 className="font-display mt-5 text-xl font-bold text-[#f4f3ee]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#9b9ba4]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA VENDER */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "linear-gradient(125deg, #0d0d11 10%, #25201a 60%, #08080a 100%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/90 to-[#08080a]/60" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Venda mais rápido
          </p>
          <h2 className="font-display max-w-xl text-3xl font-bold leading-snug text-[#f4f3ee] sm:text-4xl">
            Seu carro pode ser o <span className="gold-text">próximo destaque</span> da vitrine
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-[#9b9ba4]">
            Cadastre seu veículo, envie fotos e documentação e acompanhe a aprovação antes da publicação.
          </p>
          <Link href="/vender" className="btn-gold pulse-gold px-8 py-3.5">
            Anunciar meu carro agora
          </Link>
        </div>
      </section>
    </div>
  );
}

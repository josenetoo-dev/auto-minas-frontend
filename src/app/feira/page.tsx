import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roteiro de demonstração",
  description: "Experimente os recursos fictícios do Auto Minas na feira de tecnologia.",
  robots: { index: false, follow: false },
};

const STEPS = [
  { number: "01", title: "Explore os veículos", text: "Abra a vitrine, pesquise cidade/UF e visite os anúncios identificados como demonstração.", href: "/carros", action: "Explorar vitrine" },
  { number: "02", title: "Experimente uma negociação", text: "Com a conta fictícia de comprador, envie uma proposta de teste e acompanhe a conversa.", href: "/chat", action: "Ver negociações" },
  { number: "03", title: "Cadastre um anúncio de teste", text: "Na conta de demonstração, registre um veículo fictício: ele entrará em análise, não será publicado automaticamente.", href: "/vender", action: "Testar cadastro" },
  { number: "04", title: "Veja a revisão humana", text: "Com a conta de administrador da equipe, acompanhe a moderação e os fluxos de verificação sem documentos reais.", href: "/moderacao", action: "Painel da equipe" },
];

export default function FeiraPage() {
  // A rota só existe para builds de homologação; não publicar no site comercial.
  if (process.env.NEXT_PUBLIC_DEPLOY_CHANNEL !== "staging") notFound();

  return (
    <div className="min-h-[70vh] bg-[#08080a]">
      <section className="relative overflow-hidden border-b border-[#282217]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(212,175,55,0.16),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2d87e]">Feira de tecnologia · Auto Minas</p>
          <h1 className="font-display mt-5 max-w-3xl text-4xl font-bold leading-tight text-[#f4f3ee] sm:text-6xl">
            Conheça o <span className="gold-text">Auto Minas</span> por dentro.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#b9b9c0] sm:text-lg">
            Um marketplace de veículos com anúncios sujeitos a moderação, verificação documental humana
            e negociação por propostas. Siga o roteiro usando apenas as contas fictícias fornecidas pela equipe.
          </p>
          <div role="note" className="mt-7 max-w-2xl rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-4 text-sm leading-relaxed text-[#ead6a0]">
            Ambiente de demonstração: os veículos não estão à venda, as propostas não são ofertas reais
            e nenhuma consulta oficial a bases de veículos é realizada. Não envie documentos, selfies ou dados pessoais reais.
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/carros" className="btn-gold">Começar pela vitrine</Link>
            <Link href="/login" className="btn-outline">Entrar com conta de testes</Link>
          </div>
        </div>
      </section>
      <section aria-labelledby="banner-feira" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="grid items-center gap-8 rounded-2xl border border-[#26262e] bg-[#101014] p-5 sm:p-8 lg:grid-cols-[minmax(0,380px)_1fr]">
          <figure className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-[#d4af37]/25 bg-black">
            <Image
              src="/banners/auto-minas-feira-vertical.webp"
              alt="Arte de apresentação Auto Minas com carro amarelo, garagem escura e chamada aproxime o celular"
              width={800}
              height={1423}
              sizes="(max-width: 640px) 90vw, 380px"
              className="h-auto w-full"
            />
          </figure>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Material da feira</p>
            <h2 id="banner-feira" className="font-display mt-3 text-2xl font-bold text-[#f4f3ee] sm:text-3xl">Da apresentação para a experiência</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#b9b9c0]">
              Esta é a arte do nosso estande. Explore o marketplace, use uma conta fictícia e acompanhe a demonstração das etapas de segurança e negociação.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#9b9ba4]">
              Os ícones de consulta de CPF/veículo na arte representam objetivos do projeto:
              consultas oficiais automáticas ainda não foram integradas. A chamada NFC refere-se à interação física com o material da feira.
            </p>
            <Link href="/carros" className="btn-gold mt-6">Conhecer os veículos</Link>
          </div>
        </div>
      </section>
      <section aria-labelledby="passos" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d4af37]">Experimente em poucos passos</p>
          <h2 id="passos" className="font-display mt-2 text-2xl font-bold sm:text-3xl">Roteiro para visitantes</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map(step => (
            <article key={step.number} className="card-dark card-dark-hover flex min-w-0 flex-col p-5 sm:p-7">
              <span aria-hidden="true" className="font-display text-3xl font-bold text-[#d4af37]">{step.number}</span>
              <h3 className="mt-4 text-lg font-bold text-[#f4f3ee]">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#aaaab2]">{step.text}</p>
              <Link href={step.href} className="mt-5 inline-flex min-h-11 items-center self-start font-semibold text-[#f2d87e] underline-offset-4 hover:underline">
                {step.action} <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="border-t border-[#26262e] bg-[#101014]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-xl font-bold">Dúvidas durante a demonstração?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#aaaab2]">
            Peça à equipe uma conta de testes. Os perfis de comprador, vendedor e administrador
            têm permissões diferentes para demonstrar o controle de acesso do sistema.
          </p>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import EmailActivation from "@/components/email-activation";

export const metadata: Metadata = { title: "Minha conta" };
export default async function Account() {
  const user = await requireUser();
  const firstName = user.name.trim().split(/\s+/)[0];
  const pending = user.status === "PENDING_CONTACT_VERIFICATION";
  return <div className="account-workspace">
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <header><p className="market-eyebrow">Seu espaço no Auto Minas</p><h1 className="market-title mt-5">Olá, <em>{firstName}.</em></h1><p className="mt-5 text-sm text-[#aaa69e]">Sua próxima negociação começa aqui.</p></header>
      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="market-paper-card">
          <p className="text-[11px] uppercase tracking-[.2em] text-[#746650]">Seu próximo passo</p>
          <h2 className="mt-5 font-display text-3xl text-[#29251e]">Um novo destino para o seu carro.</h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#675f51]">Escolha entre um anúncio avulso e uma assinatura para seu negócio. Prepare os dados, envie para análise e acompanhe tudo por aqui.</p>
          <Link href="/planos" className="mt-8 flex min-h-12 items-center justify-between border-t border-[#c8bda6] pt-5 text-sm font-semibold text-[#30291e]">Escolher como anunciar <span aria-hidden="true">↗</span></Link>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#111316] p-6">
          <h2 className="text-sm font-semibold text-[#e4d9c1]">Sua conta</h2>
          <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-[#8c8982]">Nome</dt><dd className="mt-1 break-words">{user.name}</dd></div><div><dt className="text-xs text-[#8c8982]">E-mail</dt><dd className="mt-1 break-all">{user.email}</dd></div><div><dt className="text-xs text-[#8c8982]">Confirmação</dt><dd className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs ${pending ? "border-amber-500/25 text-amber-200" : "border-emerald-500/25 text-emerald-200"}`}>{pending ? "E-mail pendente de confirmação" : user.status === "ACTIVE" ? "E-mail confirmado" : user.status}</dd></div></dl>
          {pending && <p className="mt-5 text-xs leading-6 text-[#aaa69e]">Você já está conectado. Confirme seu e-mail para liberar as etapas de verificação e publicação.</p>}
        </section>
      </div>
      <nav aria-label="Atalhos da conta" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/meus-anuncios", "Meus anúncios", "Acompanhar análise e publicação"],
          ["/chat", "Conversas", "Propostas e negociações"],
          ["/verificacoes", "Verificações", "Identidade e documentos do veículo"],
          ["/assinatura", "Minhas assinaturas", "Consultar intenções e vigência"],
        ].map(([href, title, description]) => <Link key={href} href={href} className="account-shortcut"><span className="text-lg text-[#c6a767]" aria-hidden="true">↗</span><h2 className="font-display text-xl">{title}</h2><p className="text-xs leading-6 text-[#9c988e]">{description}</p></Link>)}
      </nav>
      <Link href="/privacidade/solicitacoes" className="mt-7 inline-flex min-h-11 items-center text-sm text-[#e4ca91] underline">Meus dados e pedidos de exclusão</Link>
      {user.role === "ADMIN" && <Link href="/moderacao/privacidade" className="ml-5 inline-flex min-h-11 items-center text-sm text-[#e4ca91] underline">Solicitações de privacidade</Link>}
      {pending && <div className="mt-8"><EmailActivation /></div>}
      {(user.role === "ADMIN" || user.role === "REVIEWER") && <Link href="/moderacao" className="btn-outline mt-8">Abrir moderação</Link>}
    </div>
  </div>;
}

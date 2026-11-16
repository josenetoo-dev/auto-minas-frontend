import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import Link from "next/link";
import FotoPerfil from "@/components/foto-perfil";
import EmailActivation from "@/components/email-activation";

export const metadata: Metadata = { title: "Minha conta" };
export default async function Account() {
  const user = await requireUser();
  const firstName = user.name.trim().split(/\s+/)[0];
  const pending = user.status === "PENDING_CONTACT_VERIFICATION";
  return <div className="account-workspace">
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10">
      <header><h1 className="font-display text-3xl sm:text-4xl">Olá, <em>{firstName}.</em></h1></header>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="market-paper-card">
          <p className="text-[11px] uppercase tracking-[.2em] text-[#63553e]">Seu próximo passo</p>
          <h2 className="mt-5 font-display text-3xl text-[#29251e]">Anunciar veículo</h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#675f51]">Envie os dados, as fotos e os documentos do seu veículo em um único formulário.</p>
          <Link href="/vender" className="mt-8 flex min-h-12 items-center justify-between border-t border-[#c8bda6] pt-5 text-sm font-semibold text-[#30291e]">Anunciar gratuitamente <span aria-hidden="true">↗</span></Link>
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#111316] p-6">
          <h2 className="text-sm font-semibold text-[#e4d9c1]">Sua conta</h2>
          <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-[#8c8982]">Nome</dt><dd className="mt-1 break-words">{user.name}</dd></div><div><dt className="text-xs text-[#8c8982]">E-mail</dt><dd className="mt-1 break-all">{user.email}</dd></div><div><dt className="text-xs text-[#8c8982]">Confirmação</dt><dd className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs ${pending ? "border-amber-500/25 text-amber-200" : "border-emerald-500/25 text-emerald-200"}`}>{pending ? "E-mail pendente de confirmação" : user.status === "ACTIVE" ? "E-mail confirmado" : user.status}</dd></div></dl>
          <FotoPerfil userId={user.id}/>
          {pending && <p className="mt-5 text-xs leading-6 text-[#aaa69e]">Você já está conectado. Confirme seu e-mail para liberar as etapas de verificação e publicação.</p>}
        </section>
      </div>
      <nav aria-label="Atalhos da conta" className="mt-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        {[
          ["/meus-anuncios", "Meus anúncios", "Acompanhar análise e publicação"],
          ["/chat", "Conversas", "Propostas e negociações"],
          ["/verificacoes", "Verificações", "Identidade e documentos do veículo"],
          ["/assinatura", "Minhas assinaturas", "Consultar intenções e vigência"],
        ].map(([href, title, description]) => <Link key={href} href={href} className="min-w-0 rounded-xl border border-white/10 bg-[#111316] p-4 hover:border-[#c6a767]"><h2 className="font-display text-xl">{title}</h2><p className="mt-2 text-xs leading-5 text-[#b7b3a9]">{description}</p></Link>)}
      </nav>
      <Link href="/privacidade/solicitacoes" className="mt-7 inline-flex min-h-11 items-center text-sm text-[#e4ca91] underline">Meus dados e pedidos de exclusão</Link>
      {user.role === "ADMIN" && <Link href="/moderacao/privacidade" className="ml-5 inline-flex min-h-11 items-center text-sm text-[#e4ca91] underline">Solicitações de privacidade</Link>}
      {pending && <div className="mt-8"><EmailActivation /></div>}
      {(user.role === "ADMIN" || user.role === "REVIEWER") && <Link href="/moderacao" className="btn-outline mt-8">Abrir moderação</Link>}
    </div>
  </div>;
}

import Link from "next/link";
import type { ReactNode } from "react";
export const LEGAL_VERSION = "2026-11-14-demo-v1";
export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
 return <div className="legal-document mx-auto max-w-3xl px-5 py-12 sm:px-8">
  <p className="market-eyebrow">Transparência · Auto Minas</p><h1 className="market-heading mt-4">{title}</h1>
  <p className="mt-4 text-xs text-[#b7b3a9]">Versão {LEGAL_VERSION} · Atualizado em 14/11/2026</p>
  <p className="my-7 rounded-xl border border-amber-500/25 p-4 text-sm leading-7 text-amber-100">Ambiente demonstrativo, com pagamentos desativados. Identificação do responsável e condições comerciais definitivas estão em preparação para revisão antes da operação com pessoas reais.</p>
  <div className="space-y-7 text-sm leading-7 text-[#d2cfc6]">{children}</div>
  <nav aria-label="Políticas do site" className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-6 text-sm text-[#e4ca91]">{[["/privacidade","Privacidade"],["/termos","Termos"],["/cookies","Cookies"],["/reembolsos","Reembolsos"],["/legal","Responsável e contato"],["/privacidade/solicitacoes","Solicitar exclusão de dados"]].map(([href,label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center underline underline-offset-4">{label}</Link>)}</nav>
 </div>;
}

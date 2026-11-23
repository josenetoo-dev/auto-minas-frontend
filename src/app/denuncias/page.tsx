import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { privateApi, type SpringPage } from "@/lib/backend";
import LegalPage from "@/components/legal-page";
import "@/styles/legal-info.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minhas denúncias | Auto Minas" };

type Report = { id:number; anuncioId:number; estado:"RECEBIDA"|"EM_ANALISE"|"RESOLVIDA"|"ENCERRADA_SEM_PROVIDENCIA"; recebidoEm:string; atualizadoEm:string|null };
const names:Record<Report["estado"],string> = {
  RECEBIDA:"Recebida", EM_ANALISE:"Em análise", RESOLVIDA:"Resolvida",
  ENCERRADA_SEM_PROVIDENCIA:"Encerrada sem providência",
};

export default async function MyReports() {
  await requireUser();
  const page = await privateApi<SpringPage<Report>>("/v1/denuncias/minhas?page=0&size=50").catch(() => null);
  return <LegalPage title="Minhas denúncias">
    <section>
      <h2>Acompanhamento</h2>
      <p>Você vê somente o estado do seu protocolo. Dados de terceiros e detalhes da investigação são restritos à equipe autorizada.</p>
      {!page && <p role="alert">Não foi possível consultar os protocolos agora.</p>}
      {page && page.content.length === 0 && <p>Você ainda não registrou denúncias.</p>}
      <ul className="mt-5 space-y-3">{page?.content.map(report => <li key={report.id} className="rounded-xl border border-white/15 p-4">
        <strong>Protocolo #{report.id} · {names[report.estado] ?? "Estado indisponível"}</strong>
        <p>Anúncio #{report.anuncioId} · Recebida em {new Date(report.recebidoEm).toLocaleDateString("pt-BR")}</p>
        {report.atualizadoEm && <p>Atualizada em {new Date(report.atualizadoEm).toLocaleDateString("pt-BR")}</p>}
      </li>)}</ul>
      {page && page.totalPages > 1 && <p>Mostrando os 50 protocolos mais recentes.</p>}
      <Link href="/conta" className="underline">Voltar à conta</Link>
    </section>
  </LegalPage>;
}

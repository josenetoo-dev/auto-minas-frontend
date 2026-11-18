import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { commercialPlans, currentCommercialContract, sellerProfile, type CommercialContract } from "@/lib/commercial";
import SellerPlanFlow from "@/components/seller-plan-flow";
import Link from "next/link";
import HistoryBackButton from "@/components/history-back-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contratação demonstrativa" };

export default async function SellerPlansPage({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  const query = await searchParams;
  const [plans, contract, session] = await Promise.all([
    commercialPlans().catch(() => []),
    currentCommercialContract().catch(() => null),
    getSession(),
  ]);
  const profile = session ? await sellerProfile().catch(() => null) : null;
  const plan = plans.find((item) => item.codigo === query.plano);
  if (!plan) notFound();
  void contract;
  const demoContract: CommercialContract = {
    id: 0, versao: "1.0-DEMO", titulo: "Minuta demonstrativa de contratação",
    conteudo: "MINUTA DEMONSTRATIVA — PENDENTE DE REVISÃO JURÍDICA.\n\nCONTRATANTE: {{RAZAO_SOCIAL}}, CNPJ {{CNPJ}}, endereço {{ENDERECO}}. CONTRATANTE ANUNCIANTE: {{NOME_COMPLETO}}, CPF {{CPF_MASCARADO}}.\n\nPLANO E MENSALIDADE: {{PLANO}}, R$ {{MENSALIDADE}}, conforme periodicidade do plano. A cobrança desta versão é externa e não está habilitada no Auto Minas. A assinatura só poderá ser ativada após confirmação real do pagamento.\n\nRESPONSABILIDADES DO ANUNCIANTE: fornecer informações verdadeiras, manter documentação válida e informar a conclusão da venda.\n\nNEGOCIAÇÃO E PAGAMENTO DO VEÍCULO: comprador e anunciante negociam e realizam o pagamento diretamente, fora do Auto Minas. A plataforma não processa nem garante o pagamento do veículo.\n\nCANCELAMENTO: o anunciante poderá solicitar cancelamento; efeitos sobre vigência e mensalidade dependem da política comercial definitiva.\n\nRESPONSABILIDADES DA PLATAFORMA: disponibilizar ferramentas de divulgação e comunicação conforme disponibilidade e regras publicadas.\n\nTRATAMENTO DE DADOS: os dados serão tratados para cadastro, verificação, execução do serviço e cumprimento das obrigações aplicáveis, conforme aviso de privacidade.\n\nENCERRAMENTO: a plataforma poderá suspender ou encerrar o serviço nas hipóteses previstas nos termos definitivos e na legislação aplicável.\n\nEste documento não identifica a pessoa jurídica real nem constitui contrato comercial publicado. O aceite nesta versão é demonstrativo e não autoriza operação comercial.",
    hashSha256: "", publicado: false, demonstrativo: true, criadoEm: "",
  };
  return (
    <div className="plan-intent-screen">
      <header className="plan-intent-topbar">
        <HistoryBackButton fallback="/planos" className="plan-intent-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="plan-intent-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="plan-intent-content">
        <header className="plan-intent-heading">
          <h1>Contratação</h1>
          <p>Revise o plano escolhido e registre sua intenção.</p>
        </header>

        {!session ? (
          <section className="plan-intent-gate">
            <h2>Entre para continuar</h2>
            <p>O plano {plan.nome} está selecionado. Faça login para avançar.</p>
            <Link href={`/login?next=${encodeURIComponent(`/vender/planos?plano=${plan.codigo}`)}`}>Entrar ou criar conta</Link>
          </section>
        ) : !profile?.identificacaoInformada ? (
          <section className="plan-intent-gate">
            <h2>Complete sua identificação</h2>
            <p>O backend exige identificação do vendedor antes da intenção comercial.</p>
            <Link href={`/vender?plano=${encodeURIComponent(plan.codigo)}`}>Preencher identificação</Link>
          </section>
        ) : (
          <SellerPlanFlow plan={plan} contract={demoContract} />
        )}
      </main>

      <div className="plan-intent-glow" aria-hidden="true" />
    </div>
  );
}

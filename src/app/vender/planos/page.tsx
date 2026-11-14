import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { commercialPlans, currentCommercialContract, sellerProfile, type CommercialContract } from "@/lib/commercial";
import SellerPlanFlow from "@/components/seller-plan-flow";
import Link from "next/link";

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
    conteudo: "MINUTA DEMONSTRATIVA — PENDENTE DE REVISÃO JURÍDICA.\n\nCONTRATANTE: {{RAZAO_SOCIAL}}, CNPJ {{CNPJ}}, endereço {{ENDERECO}}. CONTRATANTE ANUNCIANTE: {{NOME_COMPLETO}}, CPF {{CPF_MASCARADO}}.\n\nPLANO E MENSALIDADE: {{PLANO}}, R$ {{MENSALIDADE}} por mês. A cobrança desta versão é externa e não está habilitada no Auto Minas. A assinatura só poderá ser ativada após confirmação real do pagamento.\n\nRESPONSABILIDADES DO ANUNCIANTE: fornecer informações verdadeiras, manter documentação válida e informar a conclusão da venda.\n\nNEGOCIAÇÃO E PAGAMENTO DO VEÍCULO: comprador e anunciante negociam e realizam o pagamento diretamente, fora do Auto Minas. A plataforma não processa nem garante o pagamento do veículo.\n\nCANCELAMENTO: o anunciante poderá solicitar cancelamento; efeitos sobre vigência e mensalidade dependem da política comercial definitiva.\n\nRESPONSABILIDADES DA PLATAFORMA: disponibilizar ferramentas de divulgação e comunicação conforme disponibilidade e regras publicadas.\n\nTRATAMENTO DE DADOS: os dados serão tratados para cadastro, verificação, execução do serviço e cumprimento das obrigações aplicáveis, conforme aviso de privacidade.\n\nENCERRAMENTO: a plataforma poderá suspender ou encerrar o serviço nas hipóteses previstas nos termos definitivos e na legislação aplicável.\n\nEste documento não identifica a pessoa jurídica real nem constitui contrato comercial publicado. O aceite nesta versão é demonstrativo e não autoriza operação comercial.",
    hashSha256: "", publicado: false, demonstrativo: true, criadoEm: "",
  };
  return <main className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 sm:py-12">
    <header><p className="text-xs font-bold uppercase tracking-[.25em] text-[#d4af37]">Área do vendedor</p><h1 className="font-display mt-2 text-3xl font-bold text-[#f4f3ee] sm:text-4xl">Revisar contratação</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#a9a9b2]">Revise os termos demonstrativos e registre sua intenção. Esta etapa não ativa a assinatura nem habilita anúncios comerciais.</p></header>
    {!session ? <section className="card-dark space-y-3 p-6"><h2 className="font-display text-xl font-bold">Entre para continuar</h2><p className="text-sm leading-6 text-[#a9a9b2]">O plano {plan.nome} está selecionado. Entre ou crie sua conta para avançar.</p><Link href={`/login?next=${encodeURIComponent(`/vender/planos?plano=${plan.codigo}`)}`} className="btn-gold inline-flex min-h-11 items-center px-5">Entrar ou criar conta</Link></section> : !profile?.identificacaoInformada ? <section className="card-dark space-y-3 p-6"><h2 className="font-display text-xl font-bold">Complete a identificação antes de continuar</h2><p className="text-sm leading-6 text-[#a9a9b2]">O CPF é exigido pelo backend e protegido. Após preencher, retorne ao plano {plan.nome}.</p><Link href={`/vender?plano=${encodeURIComponent(plan.codigo)}`} className="btn-gold inline-flex min-h-11 items-center px-5">Preencher identificação</Link></section> : <SellerPlanFlow plan={plan} contract={demoContract} />}
  </main>;
}

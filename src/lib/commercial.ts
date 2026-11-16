import { allPages, backendFetch, getApiToken, privateApi } from "@/lib/backend";

export type CommercialPlan = {
  codigo: "AVULSO" | "RECORRENTE" | "BASIC" | "PROFESSIONAL" | "PREMIUM";
  nome: string;
  mensalidade: number;
  moeda: "BRL";
  periodicidade: "MENSAL" | "UNICO";
  comissaoPercentual: number;
  beneficiosJson: string;
};

export type CommercialContract = {
  id: number;
  versao: string;
  titulo: string;
  conteudo: string;
  hashSha256: string;
  publicado: boolean;
  demonstrativo: boolean;
  criadoEm: string;
};

export type DeclaredSale = {
  id: number; anuncioId: number; vendedorId: number; codigoPlano: string; nomePlano: string;
  valorFinal: number; moeda: "BRL"; comissaoPercentual: number; comissaoCalculada: number;
  dataVendaDeclarada: string; declaradoEm: string; situacao: string;
};
export type SellerProfile = { nomeCompleto: string; cpfMascarado: string | null; identificacaoInformada: boolean };
export type CommercialSubscription = { id: number; codigoPlano: string; nomePlano: string; mensalidade: number; comissaoPercentual: number; moeda: "BRL"; periodicidade: "MENSAL" | "UNICO"; status: string; situacaoFinanceira: string; criadoEm: string; inicioVigencia: string | null; vencimentoEm: string | null; canceladaEm: string | null; referenciaPagamentoExterno: string | null; renovacaoCancelada: boolean };

export async function sellerProfile(): Promise<SellerProfile> {
  return privateApi<SellerProfile>("/v1/usuario/me/dados-vendedor");
}
export async function mySubscriptions(): Promise<CommercialSubscription[]> {
  const token = await getApiToken();
  return token ? allPages<CommercialSubscription>("/v1/assinaturas/minhas", token) : [];
}

export async function commercialPlans(): Promise<CommercialPlan[]> {
  return backendFetch<CommercialPlan[]>("/v1/planos");
}

export async function currentCommercialContract(): Promise<CommercialContract> {
  return backendFetch<CommercialContract>("/v1/contratos/atual");
}

export async function myDeclaredSales(): Promise<DeclaredSale[]> {
  const token = await getApiToken();
  if (!token) return [];
  return allPages<DeclaredSale>("/v1/vendas/minhas", token);
}

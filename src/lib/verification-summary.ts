export type VerificationSummary = {
  vendedor: { analisadaManualmente: boolean; analisadaEm: string | null };
  veiculo: { analisadaManualmente: boolean; analisadaEm: string | null };
  aviso: string;
};

/** Declarações do vendedor. NÃO representam inspeção ou verificação do Auto Minas. */
export const HISTORY_QUESTIONS = [
  { key: "colisao", label: "O veículo já sofreu alguma colisão?" },
  { key: "repintura", label: "O veículo já foi repintado, total ou parcialmente?" },
  { key: "pecasAcidente", label: "O veículo possui peças substituídas por acidentes?" },
  { key: "leilao", label: "O veículo já passou por leilão?" },
  { key: "alagamento", label: "O veículo já sofreu enchente ou alagamento?" },
  { key: "problemaMecanico", label: "O veículo possui algum problema mecânico conhecido?" },
  { key: "sinistro", label: "O veículo possui histórico de sinistro?" },
] as const;

export type HistoryKey = typeof HISTORY_QUESTIONS[number]["key"];
export type HistoryAnswer = "" | "SIM" | "NAO" | "NAO_SEI_INFORMAR";
export type VehicleHistory = Record<HistoryKey, HistoryAnswer> & Record<`detalhes${Capitalize<HistoryKey>}`, string>;
export const HISTORY_OPTIONS = [
  { value: "SIM", label: "Sim" },
  { value: "NAO", label: "Não" },
  { value: "NAO_SEI_INFORMAR", label: "Não sei informar" },
] as const;
export const EMPTY_HISTORY: VehicleHistory = {
  colisao: "", repintura: "", pecasAcidente: "", leilao: "",
  alagamento: "", problemaMecanico: "", sinistro: "",
  detalhesColisao: "", detalhesRepintura: "", detalhesPecasAcidente: "",
  detalhesLeilao: "", detalhesAlagamento: "", detalhesProblemaMecanico: "",
  detalhesSinistro: "",
};
export function historyDetailKey(key:HistoryKey):keyof VehicleHistory {
  return `detalhes${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof VehicleHistory;
}
export function completeHistory(history: VehicleHistory | null | undefined):boolean {
  return Boolean(history && HISTORY_QUESTIONS.every(({key})=>["SIM","NAO","NAO_SEI_INFORMAR"].includes(history[key])));
}
export function normalizeHistory(value: Partial<VehicleHistory> | null | undefined):VehicleHistory {
  return { ...EMPTY_HISTORY, ...(value ?? {}) };
}

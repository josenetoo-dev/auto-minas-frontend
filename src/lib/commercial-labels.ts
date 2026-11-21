export function subscriptionStatus(status: string) {
  const labels: Record<string, string> = {
    INTENCAO: "Solicitação recebida",
    PENDENTE_PAGAMENTO_EXTERNO: "Aguardando confirmação do pagamento",
    ATIVA: "Ativa",
    CANCELADA: "Cancelada",
    EXPIRADA: "Expirada",
  };
  return labels[status] ?? "Status indisponível";
}

export function paymentStatus(status: string) {
  const labels: Record<string, string> = {
    NAO_PAGO: "Aguardando pagamento",
    PENDENTE_EXTERNO: "Pagamento pendente",
    CONFIRMADO_EXTERNAMENTE: "Pagamento confirmado",
    CANCELADO: "Pagamento cancelado",
  };
  return labels[status] ?? "Situação indisponível";
}

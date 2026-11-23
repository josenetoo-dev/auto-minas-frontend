import Link from "next/link";
import LegalPage from "@/components/legal-page";
import "@/styles/legal-info.css";

export const metadata = { title: "Encontro seguro | Auto Minas" };

const steps = [
  "Marque o encontro em local público e seguro, durante o dia. Avise alguém de confiança onde estará.",
  "Confira pessoalmente a identidade de quem anuncia e quem comparece. Mudanças repentinas de interlocutor exigem cautela.",
  "Compare placa, chassi e documentos do veículo com os dados apresentados. Consulte as fontes oficiais disponíveis antes de fechar negócio.",
  "Faça uma vistoria independente e teste o veículo com segurança. Fotos e declarações do anúncio não substituem inspeção.",
  "Não transfira sinal ou pagamento antecipado a terceiros. Confirme titularidade e documentação antes de qualquer transferência.",
  "Guarde os termos acordados e comprovantes. Se houver pressão para decidir imediatamente, interrompa a negociação.",
];

export default function SafeMeetingPage() {
  return <LegalPage title="Checklist de encontro seguro">
    <section aria-labelledby="before-visit">
      <h2 id="before-visit">Antes de visitar ou comprar</h2>
      <p>Use esta lista em qualquer negociação. Verificações da plataforma reduzem riscos, mas não garantem que uma transação esteja livre de golpes.</p>
      <ol className="mt-5 list-decimal space-y-4 pl-6">{steps.map(step => <li key={step}>{step}</li>)}</ol>
    </section>
    <section><h2>Algo parece suspeito?</h2><p>Não envie dinheiro ou documentos adicionais. Use a opção de denúncia do anúncio ou interrompa o contato.</p><Link href="/carros" className="underline">Voltar aos anúncios</Link></section>
  </LegalPage>;
}

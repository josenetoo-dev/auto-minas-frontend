import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { mySubscriptions } from "@/lib/commercial";
import SubscriptionPanel from "@/components/subscription-panel";
import HistoryBackButton from "@/components/history-back-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minhas assinaturas" };

export default async function SubscriptionPage() {
  await requireUser();
  const subscriptions = await mySubscriptions().catch(() => []);

  return (
    <div className="subscription-reference-screen">
      <header className="subscription-reference-topbar">
        <HistoryBackButton fallback="/conta" className="subscription-reference-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="subscription-reference-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="subscription-reference-content">
        <header className="subscription-reference-heading">
          <h1>Minhas Assinaturas</h1>
          <p>Gerencie seu plano e acompanhe intenções e vigências.</p>
        </header>

        <SubscriptionPanel initial={subscriptions} />
      </main>

      <div className="subscription-reference-glow" aria-hidden="true" />
    </div>
  );
}

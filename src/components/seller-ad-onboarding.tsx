"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import SellForm from "@/components/sell-form";
import SellerIdentityForm from "@/components/seller-identity-form";

export default function SellerAdOnboarding({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [identified, setIdentified] = useState(false);
  const complete = useCallback(() => {
    setIdentified(true);
    if (returnTo) router.push(returnTo);
  }, [returnTo, router]);
  return <div className="space-y-6">
    <SellerIdentityForm onComplete={complete} />
    {identified ? <>
      <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[.04] p-5 text-sm leading-6 text-[#c5c5ce]">
        <p className="font-semibold text-[#f2d87e]">Etapa 2 · Revisão humana</p>
        <p className="mt-2">Envie sua documentação de identidade e do veículo na área de verificação. A revisão é humana; biometria e prova de vida não estão habilitadas.</p>
        <a href="/verificacoes" className="mt-3 inline-flex min-h-10 items-center text-[#f2d87e] underline underline-offset-4">Abrir verificação documental</a>
      </div>
      <section><p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#d4af37]">Etapa 3 · Anúncio para análise</p><SellForm mode="create" /></section>
    </> : <p className="rounded-xl border border-white/[.08] p-4 text-sm text-[#8f8f99]">Salve a identificação para continuar com o fluxo do anunciante.</p>}
  </div>;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/header";
import CookiePreferences from "@/components/cookie-preferences";
import MobileActions from "@/components/mobile-actions";
import Footer from "@/components/footer";

import "./globals.css";
import "@/styles/home.css";

export const metadata: Metadata = {
  title: {
    default: "Auto Minas | Compra e venda de veículos",
    template: "%s | Auto Minas",
  },
  description:
    "Auto Minas: marketplace de veículos com análise documental e moderação humana de anúncios.",
  robots: process.env.NEXT_PUBLIC_DEPLOY_CHANNEL === "staging"
    ? { index: false, follow: false, nocache: true }
    : undefined,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">

      <body className="min-h-screen bg-[#08080a] text-[#f4f3ee] antialiased">
        <a href="#conteudo-principal" className="skip-link">Pular para o conteúdo</a>
        {process.env.NEXT_PUBLIC_DEPLOY_CHANNEL === "staging" && (
          <div role="note" className="border-b border-[#b89534]/25 bg-[#211b0f] px-4 py-2 text-center text-[11px] font-medium tracking-wide text-[#e8d5a1] sm:text-xs">
            <strong className="mr-2 uppercase tracking-[0.16em]">Auto Minas · Homologação</strong>
            Ambiente de testes com dados fictícios. Não envie documentos pessoais reais.
            <Link href="/feira" className="ml-2 inline-flex min-h-6 items-center font-semibold text-[#f2d87e] underline underline-offset-2 hover:text-white">
              Roteiro de demonstração →
            </Link>
          </div>
        )}
        <Header />
        <main id="conteudo-principal" tabIndex={-1} className="min-h-[60vh]">{children}</main>
        <Footer />
        <MobileActions />
        <CookiePreferences />
      </body>
    </html>
  );
}

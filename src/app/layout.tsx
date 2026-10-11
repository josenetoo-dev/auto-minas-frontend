import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getSession } from "@/lib/auth";

import "./globals.css";

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const unread = 0; // Backend não possui marcador de mensagens não lidas.

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#08080a] text-[#f4f3ee] antialiased">
        {process.env.NEXT_PUBLIC_DEPLOY_CHANNEL === "staging" && (
          <div role="note" className="border-b border-[#b89534]/25 bg-[#211b0f] px-4 py-2 text-center text-[11px] font-medium tracking-wide text-[#e8d5a1] sm:text-xs">
            <strong className="mr-2 uppercase tracking-[0.16em]">Auto Minas · Homologação</strong>
            Ambiente de testes com dados fictícios. Não envie documentos pessoais reais.
            <Link href="/feira" className="ml-2 inline-flex min-h-6 items-center font-semibold text-[#f2d87e] underline underline-offset-2 hover:text-white">
              Roteiro de demonstração →
            </Link>
          </div>
        )}
        <Header
          user={
            session
              ? { name: session.name, avatarUrl: session.avatarUrl }
              : null
          }
          unreadCount={unread}
        />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

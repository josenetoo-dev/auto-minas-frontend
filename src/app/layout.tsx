import type { Metadata } from "next";
import type { ReactNode } from "react";
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

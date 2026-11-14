"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function MobileActions() {
  const path = usePathname();
  if (!["/", "/carros", "/planos"].includes(path)) return null;
  return <nav aria-label="Ações rápidas" className="mobile-actions"><Link href="/carros" className="flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-[#f1e4c8]">Buscar veículos</Link><Link href="/planos" className="btn-gold min-h-12">Anunciar veículo</Link></nav>;
}

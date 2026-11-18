import Link from "next/link";
import { CookieSettingsButton } from "./cookie-preferences";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#26262e] bg-[#0a0a0d]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#9b9ba4]">
            O marketplace Auto Minas conecta compradores e vendedores com anúncios sujeitos a análise documental e moderação.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Navegação
          </h2>
          <ul className="space-y-2.5 text-sm text-[#9b9ba4]">
            <li>
              <Link href="/" className="transition-colors hover:text-[#f2d87e]">Início</Link>
            </li>
            <li>
              <Link href="/carros" className="transition-colors hover:text-[#f2d87e]">Comprar carro</Link>
            </li>
            <li>
              <Link href="/vender" className="transition-colors hover:text-[#f2d87e]">Vender carro</Link>
            </li>
            <li>
              <Link href="/chat" className="transition-colors hover:text-[#f2d87e]">Chat comprador × vendedor</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Atendimento
          </h2>
          <ul className="space-y-2.5 text-sm text-[#9b9ba4]">
            <li><Link className="inline-flex min-h-11 items-center" href="/privacidade">Privacidade</Link></li><li><Link className="inline-flex min-h-11 items-center" href="/termos">Termos de uso</Link></li><li><Link className="inline-flex min-h-11 items-center" href="/cookies">Política de cookies</Link></li><li><CookieSettingsButton /></li><li><Link className="inline-flex min-h-11 items-center" href="/reembolsos">Cancelamento e reembolso</Link></li><li><Link className="inline-flex min-h-11 items-center" href="/privacidade/solicitacoes">Solicitar exclusão de dados</Link></li><li><Link className="inline-flex min-h-11 items-center" href="/legal">Responsável e contato</Link></li>
            <li>Não transferimos propriedade nem garantimos o pagamento.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#1a1a20] py-5 text-center text-xs text-[#a5a5ad]">
        © {new Date().getFullYear()} Auto Minas — Todos os direitos reservados.
      </div>
    </footer>
  );
}

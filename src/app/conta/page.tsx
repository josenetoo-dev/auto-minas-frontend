import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { backendFetch } from "@/lib/backend";
import AccountLogoutButton from "@/components/account-logout-button";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "Meu perfil" };

type PublicProfile={nome:string;temFoto:boolean;nivel:number;veiculos:{id:number;titulo:string}[];temMais:boolean};

export default async function Account() {
  const user=await requireUser();
  const profile=await backendFetch<PublicProfile>(`/v1/perfis/${user.id}?pagina=0`).catch(()=>null);
  const level=Math.max(0,Math.min(4,profile?.nivel??0));
  const pending=user.status==="PENDING_CONTACT_VERIFICATION";

  return (
    <div className="account-reference-screen">
      <header className="account-reference-topbar">
        <Link href="/" className="account-reference-back" aria-label="Voltar para o início">←</Link>
        <Link href="/" className="account-reference-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="account-reference-content">
        <section className="account-reference-heading">
          <div>
            <h1>Meu perfil</h1>
            <p>Gerencie suas informações pessoais, contato e segurança da conta.</p>
          </div>
          <div className="account-reference-car" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/demo/hb20.jpg" alt=""/>
          </div>
        </section>

        <section className="account-reference-identity">
          <Link href="/conta/editar" className="account-reference-avatar" aria-label="Editar foto e perfil">
            {profile?.temFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/perfil/${user.id}/foto`} alt={user.name}/>
            ) : (
              <span aria-hidden="true">●</span>
            )}
            <i aria-hidden="true">▣</i>
          </Link>

          <h2>{user.name}</h2>
          <span className="account-level-pill">◈ Nível {level}</span>
          {pending && <Link href="/verificar-email" className="account-email-warning">E-mail pendente de verificação →</Link>}
        </section>

        <nav className="account-reference-menu" aria-label="Configurações da conta">
          <Link href="/conta/editar">
            <span className="account-menu-icon">♙</span>
            <span><strong>Editar perfil</strong><small>Nome, telefone e foto pública</small></span>
            <b>›</b>
          </Link>

          <Link href="/recuperar-senha">
            <span className="account-menu-icon">▣</span>
            <span><strong>Segurança da conta</strong><small>Senha e recuperação de acesso</small></span>
            <b>›</b>
          </Link>

          <Link href="/verificacoes">
            <span className="account-menu-icon">◈</span>
            <span><strong>Verificação de identidade</strong><small>Níveis e documentos</small></span>
            <b>›</b>
          </Link>

          <Link href="/privacidade/solicitacoes">
            <span className="account-menu-icon">☷</span>
            <span><strong>Privacidade e dados</strong><small>Solicitações e exclusão de dados</small></span>
            <b>›</b>
          </Link>

          <Link href="/meus-anuncios">
            <span className="account-menu-icon">▤</span>
            <span><strong>Meus anúncios</strong><small>Acompanhar análise e publicação</small></span>
            <b>›</b>
          </Link>
        </nav>

        <AccountLogoutButton/>
      </main>

      <div className="account-reference-glow" aria-hidden="true"/>
    </div>
  );
}

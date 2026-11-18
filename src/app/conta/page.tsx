import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { backendFetch, getApiToken } from "@/lib/backend";
import { mySubscriptions } from "@/lib/commercial";
import AccountLogoutButton from "@/components/account-logout-button";
import HistoryBackButton from "@/components/history-back-button";
import "@/styles/account-plans.css";
import "@/styles/profile.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meu perfil" };

type PublicProfile = {
  nome: string;
  temFoto: boolean;
  nivel: number;
  veiculos: { id: number; titulo: string }[];
  temMais: boolean;
};

type PrivateUser = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  role: string;
};

const LEVEL_COPY = [
  "Conta criada",
  "Identidade",
  "Veículo",
  "Verificação reforçada",
  "Vendedor confiável",
] as const;

export default async function Account() {
  const user = await requireUser();
  const token = await getApiToken();

  const [profile, me, subscriptions] = await Promise.all([
    backendFetch<PublicProfile>(`/v1/perfis/${user.id}?pagina=0`).catch(() => null),
    backendFetch<PrivateUser>("/v1/usuario/me", {}, token || undefined).catch(() => null),
    mySubscriptions().catch(() => []),
  ]);

  const level = Math.max(0, Math.min(4, profile?.nivel ?? 0));
  const pending = user.status === "PENDING_CONTACT_VERIFICATION";
  const activeSubscription = subscriptions.find((item) => item.status === "ATIVA") ?? subscriptions[0] ?? null;

  return (
    <div className="account-hub-screen">
      <header className="account-hub-topbar">
        <HistoryBackButton fallback="/" className="account-hub-back" ariaLabel="Voltar">←</HistoryBackButton>
        <Link href="/" className="account-hub-brand"><span>AM</span><strong>Auto Minas</strong></Link>
      </header>

      <main className="account-hub-content">
        <section className="account-hub-hero">
          <div>
            <h1>Meu Perfil</h1>
            <p>Gerencie sua conta, anúncios, plano e verificações.</p>
          </div>
          <div className="account-hub-car" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/demo/hb20.jpg" alt="" />
          </div>
        </section>

        <Link href="/conta/editar" className="account-hub-profile-card">
          <div className="account-hub-avatar">
            {profile?.temFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/perfil/${user.id}/foto`} alt={user.name} />
            ) : (
              <span>{user.name.slice(0, 2).toUpperCase()}</span>
            )}
            <i aria-hidden="true">▣</i>
          </div>

          <div className="account-hub-profile-copy">
            <h2>{user.name}</h2>
            <span className="account-hub-level-pill">Nível {level}</span>
            <p>{user.email}</p>
            {me?.telefone && <p>{me.telefone}</p>}
            {pending && <strong>E-mail pendente de verificação</strong>}
          </div>

          <b aria-hidden="true">›</b>
        </Link>

        <Link href="/verificacoes" className="account-hub-verification-card">
          <div className="account-hub-verification-heading">
            <div>
              <h2>Nível de verificação</h2>
              <p>{LEVEL_COPY[level]}</p>
            </div>
            <span>Nível {level}</span>
          </div>

          <div className="account-hub-progress">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={item <= level ? "is-active" : ""}>
                <i>{item < level ? "✓" : item}</i>
                <strong>Nível {item}</strong>
              </div>
            ))}
          </div>
        </Link>

        <nav className="account-hub-grid" aria-label="Área da conta">
          <Link href="/meus-anuncios">
            <span>▤</span>
            <div><strong>Meus anúncios</strong><small>Gerencie seus veículos</small></div>
            <b>›</b>
          </Link>

          <Link href="/assinatura">
            <span>♛</span>
            <div>
              <strong>Meu plano</strong>
              <small>{activeSubscription ? activeSubscription.nomePlano : "Planos e assinatura"}</small>
            </div>
            <b>›</b>
          </Link>

          <Link href="/chat">
            <span>◌</span>
            <div><strong>Conversas</strong><small>Suas negociações</small></div>
            <b>›</b>
          </Link>

          <Link href="/recuperar-senha">
            <span>◈</span>
            <div><strong>Segurança</strong><small>Senha e recuperação</small></div>
            <b>›</b>
          </Link>

          <Link href={`/perfil/${user.id}`}>
            <span>◎</span>
            <div><strong>Perfil público</strong><small>Veja como compradores enxergam você</small></div>
            <b>›</b>
          </Link>

          <Link href="/privacidade/solicitacoes">
            <span>☷</span>
            <div><strong>Privacidade</strong><small>Dados e solicitações</small></div>
            <b>›</b>
          </Link>

          {user.role !== "USER" && (
            <Link href="/moderacao" className="account-hub-admin-link">
              <span>⌘</span>
              <div>
                <strong>{user.role === "ADMIN" ? "Administração" : "Moderação"}</strong>
                <small>{user.role === "ADMIN" ? "Anúncios, comercial e privacidade" : "Anúncios, documentos e denúncias"}</small>
              </div>
              <b>›</b>
            </Link>
          )}
        </nav>

        {pending && <Link href="/verificar-email" className="account-hub-email-warning">Verificar meu e-mail agora →</Link>}

        <AccountLogoutButton />
      </main>

      <div className="account-hub-bottom-glow" aria-hidden="true" />
    </div>
  );
}
